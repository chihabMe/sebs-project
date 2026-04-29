import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { AuthController } from './../src/auth/auth.controller';

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

const createPrismaMock = () => {
  const users: TestUser[] = [];

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
      findMany: jest.fn(async () => []),
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

describe('AuthController (e2e)', () => {
  let moduleFixture: TestingModule;
  let authController: AuthController;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(createPrismaMock())
      .compile();

    authController = moduleFixture.get<AuthController>(AuthController);
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('/api/auth/register (POST)', async () => {
    const email = `test${Date.now()}@example.com`;
    const res = createMockResponse();

    await authController.register(
      {
        name: 'John Doe',
        email,
        password: 'password123',
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.token).toBeDefined();
    expect(res.cookies.accessToken).toBeDefined();
    expect(res.cookies.refreshToken).toBeDefined();
  });

  it('/api/auth/login (POST)', async () => {
    const email = `login${Date.now()}@example.com`;
    const registerRes = createMockResponse();
    await authController.register(
      {
        name: 'Jane Doe',
        email,
        password: 'password123',
      },
      registerRes,
    );

    const loginRes = createMockResponse();
    await authController.login(
      {
        email,
        password: 'password123',
      },
      loginRes,
    );

    expect(loginRes.status).toHaveBeenCalledWith(200);
    expect(loginRes.body.data.token).toBeDefined();
    expect(loginRes.cookies.accessToken).toBeDefined();
    expect(loginRes.cookies.refreshToken).toBeDefined();
  });
});
