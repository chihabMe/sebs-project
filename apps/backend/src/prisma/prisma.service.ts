import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

type ModelName = 'user' | 'event' | 'tag' | 'eventFormQuestion' | 'booking' | 'review';
type AnyRecord = Record<string, any>;

const collectionNames: Record<ModelName, string> = {
  user: 'users',
  event: 'events',
  tag: 'tags',
  eventFormQuestion: 'eventFormQuestions',
  booking: 'bookings',
  review: 'reviews',
};

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private db = getFirestore(this.ensureFirebaseApp());

  user = this.createRepository('user');
  event = this.createRepository('event');
  tag = this.createRepository('tag');
  eventFormQuestion = this.createRepository('eventFormQuestion');
  booking = this.createRepository('booking');
  review = this.createRepository('review');

  async onModuleInit() {
    await this.db.listCollections();
  }

  async onModuleDestroy() {
    await this.db.terminate();
  }

  async $connect() {
    await this.onModuleInit();
  }

  async $disconnect() {
    await this.onModuleDestroy();
  }

  async $transaction<T>(operations: Promise<T>[]) {
    return Promise.all(operations);
  }

  private ensureFirebaseApp() {
    const existing = getApps()[0];
    if (existing) return existing;

    const projectId = process.env.FIRESTORE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

    if (process.env.FIRESTORE_EMULATOR_HOST) {
      return initializeApp({ projectId: projectId || 'eventify-local' });
    }

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      return initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
        projectId,
      });
    }

    return initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  }

  private collection(model: ModelName) {
    return this.db.collection(collectionNames[model]);
  }

  private createRepository(model: ModelName) {
    return {
      create: (args: AnyRecord) => this.create(model, args),
      createMany: (args: AnyRecord) => this.createMany(model, args),
      findUnique: (args: AnyRecord) => this.findUnique(model, args),
      findMany: (args: AnyRecord = {}) => this.findMany(model, args),
      update: (args: AnyRecord) => this.update(model, args),
      updateMany: (args: AnyRecord) => this.updateMany(model, args),
      delete: (args: AnyRecord) => this.delete(model, args),
      deleteMany: (args: AnyRecord = {}) => this.deleteMany(model, args),
      count: (args: AnyRecord = {}) => this.count(model, args),
      aggregate: (args: AnyRecord = {}) => this.aggregate(model, args),
    };
  }

  private async create(model: ModelName, args: AnyRecord) {
    const now = new Date();
    const id = args.data?.id || randomUUID();
    const data = this.prepareWrite(model, {
      id,
      ...this.defaultsFor(model, now),
      ...this.normalizeNestedWrites(args.data || {}),
      createdAt: args.data?.createdAt || now,
      updatedAt: args.data?.updatedAt || now,
    });

    await this.collection(model).doc(id).set(data);
    const created = await this.getById(model, id);
    return this.shape(model, created, args);
  }

  private async createMany(model: ModelName, args: AnyRecord) {
    const rows = args.data || [];
    await Promise.all(rows.map((data: AnyRecord) => this.create(model, { data })));
    return { count: rows.length };
  }

  private async findUnique(model: ModelName, args: AnyRecord) {
    const row = await this.findRawUnique(model, args.where || {});
    return row ? this.shape(model, row, args) : null;
  }

  private async findMany(model: ModelName, args: AnyRecord = {}) {
    const snapshot = await this.collection(model).get();
    let rows = snapshot.docs.map((doc) => this.fromFirestore(doc.data()));
    rows = (await Promise.all(rows.map(async (row) => ((await this.matchesWhere(model, row, args.where || {})) ? row : null))))
      .filter(Boolean) as AnyRecord[];
    rows = await this.sortRows(model, rows, args.orderBy);
    if (typeof args.skip === 'number') rows = rows.slice(args.skip);
    if (typeof args.take === 'number') rows = rows.slice(0, args.take);
    return Promise.all(rows.map((row) => this.shape(model, row, args)));
  }

  private async update(model: ModelName, args: AnyRecord) {
    const existing = await this.findRawUnique(model, args.where || {});
    if (!existing) throw new Error(`${model} not found`);

    const data = this.normalizeNestedWrites(args.data || {}, existing);
    const updated = this.prepareWrite(model, {
      ...existing,
      ...data,
      updatedAt: new Date(),
    });

    await this.collection(model).doc(existing.id).set(updated, { merge: false });
    const row = await this.getById(model, existing.id);
    return this.shape(model, row, args);
  }

  private async updateMany(model: ModelName, args: AnyRecord) {
    const rows = await this.findMany(model, { where: args.where || {} });
    await Promise.all(rows.map((row) => this.update(model, { where: { id: row.id }, data: args.data || {} })));
    return { count: rows.length };
  }

  private async delete(model: ModelName, args: AnyRecord) {
    const existing = await this.findRawUnique(model, args.where || {});
    if (!existing) throw new Error(`${model} not found`);
    await this.deleteById(model, existing.id);
    return existing;
  }

  private async deleteMany(model: ModelName, args: AnyRecord = {}) {
    const rows = await this.findMany(model, { where: args.where || {} });
    await Promise.all(rows.map((row) => this.deleteById(model, row.id)));
    return { count: rows.length };
  }

  private async count(model: ModelName, args: AnyRecord = {}) {
    return (await this.findMany(model, { where: args.where || {} })).length;
  }

  private async aggregate(model: ModelName, args: AnyRecord = {}) {
    const rows = await this.findMany(model, { where: args.where || {} });
    const result: AnyRecord = {};

    if (args._sum) {
      result._sum = {};
      for (const key of Object.keys(args._sum)) {
        result._sum[key] = rows.reduce((sum, row) => sum + Number(row[key] || 0), 0);
      }
    }

    if (args._avg) {
      result._avg = {};
      for (const key of Object.keys(args._avg)) {
        result._avg[key] = rows.length ? rows.reduce((sum, row) => sum + Number(row[key] || 0), 0) / rows.length : null;
      }
    }

    if (args._count) {
      result._count = {};
      for (const key of Object.keys(args._count)) {
        result._count[key] = rows.filter((row) => row[key] !== undefined && row[key] !== null).length;
      }
    }

    return result;
  }

  private defaultsFor(model: ModelName, now: Date) {
    if (model === 'user') return { role: 'USER', isBanned: false, avatar: null, bio: null, tagIds: [] };
    if (model === 'event') {
      return {
        status: 'UPCOMING',
        isApproved: false,
        price: 0,
        autoApproveBookings: false,
        invitationToken: randomUUID(),
        tagIds: [],
      };
    }
    if (model === 'eventFormQuestion') return { required: true };
    if (model === 'booking') return { status: 'PENDING', answers: [], createdAt: now, updatedAt: now };
    if (model === 'review') return { createdAt: now };
    return {};
  }

  private normalizeNestedWrites(data: AnyRecord, existing: AnyRecord = {}) {
    const normalized: AnyRecord = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      if (key === 'tags' && value && typeof value === 'object') {
        const tagRefs = value.set || value.connect || [];
        normalized.tagIds = tagRefs.map((tag: AnyRecord) => tag.id);
        continue;
      }
      if (key === 'answers' && value && typeof value === 'object') {
        if (value.create) {
          normalized.answers = value.create.map((answer: AnyRecord) => ({
            id: randomUUID(),
            bookingId: existing.id,
            questionId: answer.questionId,
            answer: answer.answer,
          }));
        }
        continue;
      }
      normalized[key] = value;
    }

    return normalized;
  }

  private prepareWrite(model: ModelName, data: AnyRecord) {
    const writable = { ...data };
    if (model === 'booking') {
      writable.answers = (writable.answers || []).map((answer: AnyRecord) => ({
        id: answer.id || randomUUID(),
        bookingId: writable.id,
        questionId: answer.questionId,
        answer: answer.answer,
      }));
    }
    return writable;
  }

  private async getById(model: ModelName, id: string) {
    const doc = await this.collection(model).doc(id).get();
    return doc.exists ? this.fromFirestore(doc.data() || {}) : null;
  }

  private async findFirstByFields(model: ModelName, fields: AnyRecord) {
    const snapshot = await this.collection(model).get();
    const row = snapshot.docs
      .map((doc) => this.fromFirestore(doc.data()))
      .find((item) => Object.entries(fields).every(([key, value]) => item[key] === value));
    return row || null;
  }

  private async findRawUnique(model: ModelName, where: AnyRecord) {
    if (where.id) return this.getById(model, where.id);
    if (model === 'user' && where.email) return this.findFirstByFields(model, { email: where.email });
    if (model === 'tag' && where.name) return this.findFirstByFields(model, { name: where.name });
    if ((model === 'booking' || model === 'review') && where.userId_eventId) {
      return this.findFirstByFields(model, where.userId_eventId);
    }
    return null;
  }

  private async deleteById(model: ModelName, id: string) {
    if (model === 'event') {
      await Promise.all([
        this.deleteMany('booking', { where: { eventId: id } }),
        this.deleteMany('review', { where: { eventId: id } }),
        this.deleteMany('eventFormQuestion', { where: { eventId: id } }),
      ]);
    }

    if (model === 'tag') {
      const [events, users] = await Promise.all([this.findMany('event'), this.findMany('user')]);
      await Promise.all([
        ...events
          .filter((event) => (event.tagIds || []).includes(id))
          .map((event) => this.collection('event').doc(event.id).update({ tagIds: event.tagIds.filter((tagId: string) => tagId !== id) })),
        ...users
          .filter((user) => (user.tagIds || []).includes(id))
          .map((user) => this.collection('user').doc(user.id).update({ tagIds: user.tagIds.filter((tagId: string) => tagId !== id) })),
      ]);
    }

    await this.collection(model).doc(id).delete();
  }

  private async shape(model: ModelName, row: AnyRecord | null, args: AnyRecord = {}) {
    if (!row) return null;
    let shaped = { ...row };

    if (model === 'user' && (args.include?.tags || args.select?.tags)) {
      shaped.tags = await this.resolveTags(shaped.tagIds || []);
    }

    if (model === 'event') {
      if (args.include?.tags || args.select?.tags) shaped.tags = await this.resolveTags(shaped.tagIds || []);
      if (args.include?.organizer) {
        const organizer = await this.getById('user', shaped.organizerId);
        shaped.organizer = this.applySelect(organizer, args.include.organizer.select);
      }
      if (args.include?.formQuestions) {
        shaped.formQuestions = await this.findMany('eventFormQuestion', { where: { eventId: shaped.id } });
      }
      if (args.include?._count?.select?.bookings) {
        shaped._count = {
          bookings: await this.count('booking', {
            where: { eventId: shaped.id, ...(args.include._count.select.bookings.where || {}) },
          }),
        };
      }
    }

    if (model === 'booking') {
      if (args.include?.user) {
        const user = await this.getById('user', shaped.userId);
        shaped.user = this.applySelect(user, args.include.user.select);
      }
      if (args.include?.event) {
        const event = await this.getById('event', shaped.eventId);
        shaped.event = this.applySelect(event, args.include.event.select);
      }
      if (args.include?.answers) {
        shaped.answers = await Promise.all((shaped.answers || []).map(async (answer: AnyRecord) => {
          const result = { ...answer };
          if (args.include.answers.include?.question) {
            result.question = await this.getById('eventFormQuestion', answer.questionId);
          }
          return result;
        }));
      }
    }

    if (model === 'review' && args.include?.user) {
      const user = await this.getById('user', shaped.userId);
      shaped.user = this.applySelect(user, args.include.user.select);
    }

    if (args.select) {
      shaped = this.applySelect(shaped, args.select);
    }

    delete shaped.tagIds;
    return shaped;
  }

  private async resolveTags(tagIds: string[]) {
    return Promise.all(tagIds.map((id) => this.getById('tag', id))).then((tags) => tags.filter(Boolean));
  }

  private applySelect(row: AnyRecord | null, select?: AnyRecord) {
    if (!row || !select) return row;
    return Object.fromEntries(Object.entries(select).filter(([, enabled]) => enabled).map(([key]) => [key, row[key]]));
  }

  private async matchesWhere(model: ModelName, row: AnyRecord, where: AnyRecord): Promise<boolean> {
    for (const [key, expected] of Object.entries(where || {})) {
      if (key === 'OR') {
        const matches = await Promise.all((expected as AnyRecord[]).map((condition) => this.matchesWhere(model, row, condition)));
        if (!matches.some(Boolean)) return false;
        continue;
      }

      if (key === 'tags') {
        if (!(await this.matchesTagRelation(row.tagIds || [], expected))) return false;
        continue;
      }

      if (key === 'event') {
        const event = await this.getById('event', row.eventId);
        if (!event || !(await this.matchesWhere('event', event, expected))) return false;
        continue;
      }

      if (key === 'user') {
        const user = await this.getById('user', row.userId);
        if (!user || !(await this.matchesWhere('user', user, expected))) return false;
        continue;
      }

      if (!this.matchesValue(row[key], expected)) return false;
    }
    return true;
  }

  private async matchesTagRelation(tagIds: string[], condition: AnyRecord) {
    if (!condition?.some) return true;
    const tags = await this.resolveTags(tagIds);
    const matches = await Promise.all(tags.map((tag) => this.matchesWhere('tag', tag, condition.some)));
    return matches.some(Boolean);
  }

  private matchesValue(actual: any, expected: any): boolean {
    if (expected && typeof expected === 'object' && !(expected instanceof Date) && !Array.isArray(expected)) {
      if ('contains' in expected) {
        const actualText = String(actual || '');
        const needle = String(expected.contains || '');
        return expected.mode === 'insensitive' ? actualText.toLowerCase().includes(needle.toLowerCase()) : actualText.includes(needle);
      }
      if ('in' in expected) return expected.in.includes(actual);
      if ('gte' in expected && actual < expected.gte) return false;
      if ('lte' in expected && actual > expected.lte) return false;
      return Object.entries(expected).every(([key, value]) => this.matchesValue(actual?.[key], value));
    }
    return actual === expected;
  }

  private async sortRows(model: ModelName, rows: AnyRecord[], orderBy?: AnyRecord) {
    if (!orderBy) return rows;
    const sortSpec = Array.isArray(orderBy) ? orderBy[0] : orderBy;
    const [field, directionOrNested] = Object.entries(sortSpec)[0] || [];
    if (!field) return rows;
    const direction = typeof directionOrNested === 'string' ? directionOrNested : Object.values(directionOrNested as AnyRecord)[0];
    const nestedField = typeof directionOrNested === 'object' ? Object.keys(directionOrNested as AnyRecord)[0] : undefined;
    const rowsWithSortValues = await Promise.all(rows.map(async (row) => ({
      row,
      sortValue: nestedField && model === 'booking' && field === 'event'
        ? (await this.getById('event', row.eventId))?.[nestedField]
        : nestedField
          ? row[field]?.[nestedField]
          : row[field],
    })));

    return rowsWithSortValues.sort((left, right) => {
      const leftComparable = left.sortValue instanceof Date ? left.sortValue.getTime() : left.sortValue;
      const rightComparable = right.sortValue instanceof Date ? right.sortValue.getTime() : right.sortValue;
      if (leftComparable === rightComparable) return 0;
      const result = leftComparable > rightComparable ? 1 : -1;
      return direction === 'desc' ? -result : result;
    }).map(({ row }) => row);
  }

  private fromFirestore(data: AnyRecord): AnyRecord {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, this.convertFirestoreValue(value)]),
    );
  }

  private convertFirestoreValue(value: any): any {
    if (value instanceof Timestamp) return value.toDate();
    if (Array.isArray(value)) return value.map((item) => this.convertFirestoreValue(item));
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, this.convertFirestoreValue(nested)]));
    }
    return value;
  }
}
