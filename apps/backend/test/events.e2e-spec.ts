import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { AuthController } from './../src/auth/auth.controller';
import { EventsController } from './../src/events/events.controller';

type TestUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  avatar: string | null;
  bio: string | null;
  isBanned: boolean;
  tags: Array<{ id: string; name: string }>;
};

type TestEvent = {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  category: string;
  maxTickets: number;
  availableTickets: number;
  price: number;
  organizerId: string;
  isApproved: boolean;
  status: string;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Array<{ id: string; name: string }>;
  organizer: { id: string; name: string } | null;
};

const createPrismaMock = () => {
  const users: TestUser[] = [];
  const events: TestEvent[] = [];

  return {
    user: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.email) {
          return users.find((user) => user.email === where.email) ?? null;
        }
        if (where.id) {
          return users.find((user) => user.id === where.id) ?? null;
        }
        return null;
      }),
      create: jest.fn(async ({ data }: any) => {
        const user: TestUser = {
          id: randomUUID(),
          email: data.email,
          password: data.password,
          name: data.name,
          role: data.role,
          avatar: null,
          bio: null,
          isBanned: false,
          tags: [],
        };
        users.push(user);
        return user;
      }),
    },
    event: {
      create: jest.fn(async ({ data }: any) => {
        const organizer = users.find((user) => user.id === data.organizerId);
        const event: TestEvent = {
          id: randomUUID(),
          title: data.title,
          description: data.description,
          date: data.date,
          location: data.location,
          category: data.category,
          maxTickets: data.maxTickets,
          availableTickets: data.maxTickets,
          price: data.price,
          organizerId: data.organizerId,
          isApproved: data.isApproved,
          status: data.status ?? 'UPCOMING',
          image: data.image ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          organizer: organizer ? { id: organizer.id, name: organizer.name } : null,
        };
        events.push(event);
        return event;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        let filtered = [...events];
        if (typeof where?.isApproved === 'boolean') {
          filtered = filtered.filter((event) => event.isApproved === where.isApproved);
        }
        return filtered;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        return events.find((event) => event.id === where.id) ?? null;
      }),
    },
  };
};

const createMockResponse = () => {
  const response: any = {
    statusCode: 200,
    body: null,
    cookies: {} as Record<string, string>,
  };

  response.cookie = jest.fn((name: string, value: string) => {
    response.cookies[name] = value;
    return response;
  });
  response.status = jest.fn((code: number) => {
    response.statusCode = code;
    return response;
  });
  response.json = jest.fn((payload: any) => {
    response.body = payload;
    return response;
  });

  return response;
};

describe('EventsController (e2e)', () => {
  let moduleFixture: TestingModule;
  let authController: AuthController;
  let eventsController: EventsController;
  let organizerId: string;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(createPrismaMock())
      .compile();

    authController = moduleFixture.get<AuthController>(AuthController);
    eventsController = moduleFixture.get<EventsController>(EventsController);

    const email = `organizer${Date.now()}@example.com`;
    const res = createMockResponse();
    await authController.register(
      {
        name: 'Event Organizer',
        email,
        password: 'password123',
        role: 'ORGANIZER',
      },
      res,
    );

    organizerId = res.body.data.user.id;
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('/api/events (GET)', async () => {
    const response = await eventsController.findAll({});
    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
  });

  it('/api/events (POST) - Create Event', async () => {
    const response = await eventsController.create(organizerId, 'ORGANIZER', {
      title: 'NestJS Conference',
      description: 'A great conference about NestJS',
      date: new Date(Date.now() + 86400000).toISOString(),
      location: 'Online',
      category: 'Technology',
      maxTickets: 100,
      price: 0,
    });

    expect(response.success).toBe(true);
    expect(response.data.title).toBe('NestJS Conference');
    expect(response.data.organizerId).toBe(organizerId);
    expect(response.data.isApproved).toBe(false);
  });
});
