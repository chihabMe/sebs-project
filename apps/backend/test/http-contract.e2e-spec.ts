import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type TestUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'USER' | 'ORGANIZER' | 'ADMIN';
  isBanned: boolean;
  avatar: string | null;
  bio: string | null;
  tags: Array<{ id: string; name: string }>;
  createdAt: Date;
};

const createPrismaMock = () => {
  const users: TestUser[] = [];
  users.push({
    id: randomUUID(),
    email: 'admin@sebs.com',
    password: '$2b$12$5Bm9KNx0xj7t3lZtW6vB4.r1IyQ8hEjN0jzZMfjNV8iPBUFeCFG3u',
    name: 'System Admin',
    role: 'ADMIN',
    isBanned: false,
    avatar: null,
    bio: null,
    tags: [],
    createdAt: new Date(),
  });
  const tags = [{ id: randomUUID(), name: 'Music' }];
  const events = [
    {
      id: randomUUID(),
      title: 'Public Event',
      description: 'Public event description long enough',
      date: new Date(Date.now() + 86400000),
      location: 'Online',
      category: 'Music',
      status: 'UPCOMING',
      isApproved: true,
      maxTickets: 50,
      price: 0,
      organizerId: 'org-1',
      image: null,
      tags: [],
      organizer: { id: 'org-1', name: 'Organizer One' },
    },
  ];

  return {
    user: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.email) return users.find((u) => u.email === where.email) ?? null;
        if (where.id) return users.find((u) => u.id === where.id) ?? null;
        return null;
      }),
      create: jest.fn(async ({ data }: any) => {
        const user: TestUser = {
          id: randomUUID(),
          email: data.email,
          password: data.password,
          name: data.name,
          role: data.role ?? 'USER',
          isBanned: false,
          avatar: null,
          bio: null,
          tags: [],
          createdAt: new Date(),
        };
        users.push(user);
        return user;
      }),
      findMany: jest.fn(async () =>
        users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          isBanned: u.isBanned,
          createdAt: u.createdAt,
        })),
      ),
      count: jest.fn(async () => users.length),
      update: jest.fn(async ({ where, data }: any) => {
        const user = users.find((u) => u.id === where.id);
        if (!user) return null;
        Object.assign(user, data);
        return user;
      }),
    },
    event: {
      findMany: jest.fn(async ({ where }: any = {}) => {
        if (typeof where?.isApproved === 'boolean') {
          return events.filter((event) => event.isApproved === where.isApproved);
        }
        return events;
      }),
      count: jest.fn(async () => events.length),
      aggregate: jest.fn(async () => ({ _sum: { price: 0 } })),
      findUnique: jest.fn(async ({ where }: any) => events.find((e) => e.id === where.id) ?? null),
      update: jest.fn(async ({ where, data }: any) => {
        const event = events.find((e) => e.id === where.id);
        if (!event) return null;
        Object.assign(event, data);
        return event;
      }),
    },
    booking: {
      count: jest.fn(async () => 0),
      findMany: jest.fn(async () => []),
      findUnique: jest.fn(async () => null),
      update: jest.fn(async () => null),
      create: jest.fn(async () => null),
    },
    tag: {
      findMany: jest.fn(async () => tags),
      findUnique: jest.fn(async ({ where }: any) => tags.find((tag) => tag.name === where.name) ?? null),
      create: jest.fn(async ({ data }: any) => {
        const tag = { id: randomUUID(), name: data.name };
        tags.push(tag);
        return tag;
      }),
      delete: jest.fn(async ({ where }: any) => {
        const idx = tags.findIndex((tag) => tag.id === where.id);
        if (idx >= 0) tags.splice(idx, 1);
      }),
    },
    review: {
      findMany: jest.fn(async () => []),
      aggregate: jest.fn(async () => ({ _avg: { rating: null }, _count: { id: 0 } })),
      findUnique: jest.fn(async () => null),
      create: jest.fn(async () => null),
      update: jest.fn(async () => null),
      delete: jest.fn(async () => null),
    },
    eventFormQuestion: {
      findMany: jest.fn(async () => []),
      deleteMany: jest.fn(async () => null),
      createMany: jest.fn(async () => null),
    },
    $transaction: jest.fn(async () => null),
  };
};

const describeHttpE2E =
  process.env.ENABLE_SOCKET_HTTP_E2E === '1' ? describe : describe.skip;

describeHttpE2E('HTTP Integration Contracts (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(createPrismaMock())
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/events should return public events list', async () => {
    await request(app.getHttpAdapter().getInstance())
      .get('/api/events')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });

  it('POST /api/auth/register + POST /api/auth/login + GET /api/users/profile cookie flow should work', async () => {
    const email = `contract-${Date.now()}@example.com`;
    const agent = request.agent(app.getHttpAdapter().getInstance());

    await agent
      .post('/api/auth/register')
      .send({ name: 'Contract User', email, password: 'password123' })
      .expect(201);

    await agent
      .post('/api/auth/login')
      .send({ email, password: 'password123' })
      .expect(200)
      .expect((res) => {
        expect(res.headers['set-cookie']).toBeDefined();
      });

    await agent
      .get('/api/users/profile')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe(email);
      });
  });

  it('GET /api/admin/users should reject non-admin user', async () => {
    const email = `normal-${Date.now()}@example.com`;
    const agent = request.agent(app.getHttpAdapter().getInstance());

    await agent
      .post('/api/auth/register')
      .send({ name: 'Normal User', email, password: 'password123' })
      .expect(201);

    await agent
      .get('/api/admin/users')
      .expect(403);
  });

  it('POST /api/auth/admin/login + GET /api/auth/admin/session should work for admin', async () => {
    const agent = request.agent(app.getHttpAdapter().getInstance());

    await agent
      .post('/api/auth/admin/login')
      .send({ email: 'admin@sebs.com', password: 'password123' })
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.user.role).toBe('ADMIN');
        expect(res.headers['set-cookie']).toBeDefined();
      });

    await agent
      .get('/api/auth/admin/session')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.portal).toBe('admin');
        expect(res.body.data.user.role).toBe('ADMIN');
      });
  });

  it('POST /api/auth/admin/login should reject non-admin credentials', async () => {
    const email = `not-admin-${Date.now()}@example.com`;

    await request(app.getHttpAdapter().getInstance())
      .post('/api/auth/register')
      .send({ name: 'User', email, password: 'password123' })
      .expect(201);

    await request(app.getHttpAdapter().getInstance())
      .post('/api/auth/admin/login')
      .send({ email, password: 'password123' })
      .expect(403);
  });
});
