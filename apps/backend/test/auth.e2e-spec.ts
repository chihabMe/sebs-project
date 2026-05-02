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
  isActive: boolean;
  isBanned: boolean;
  tags: Array<{ id: string; name: string }>;
  emailVerificationTokenHash: string | null;
  emailVerificationExpiresAt: Date | null;
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
        if (where.emailVerificationTokenHash) {
          return users.find((user) => user.emailVerificationTokenHash === where.emailVerificationTokenHash) ?? null;
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
          isActive: data.isActive ?? true,
          isBanned: false,
          tags: [],
          emailVerificationTokenHash: data.emailVerificationTokenHash ?? null,
          emailVerificationExpiresAt: data.emailVerificationExpiresAt ?? null,
        };
        users.push(user);
        return user;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const user = users.find((u) => u.id === where.id);
        if (user) {
          Object.assign(user, data);
        }
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
        password: 'StrongPassword123!',
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.token).toBeUndefined();
  });

  it('/api/auth/login (POST)', async () => {
    const email = `login${Date.now()}@example.com`;
    const registerRes = createMockResponse();
    await authController.register(
      {
        name: 'Jane Doe',
        email,
        password: 'StrongPassword123!',
      },
      registerRes,
    );

    // Get the created user from Prisma mock to get the token hash (or just manually verify them)
    // For simplicity, we can mock their isActive to true by updating the user directly
    const prisma = moduleFixture.get(PrismaService) as any;
    const user = await prisma.user.findUnique({ where: { email } });
    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: true },
    });

    const loginRes = createMockResponse();
    await authController.login(
      {
        email,
        password: 'StrongPassword123!',
      },
      loginRes,
    );

    expect(loginRes.status).toHaveBeenCalledWith(200);
    expect(loginRes.body.data.token).toBeDefined();
    expect(loginRes.cookies.accessToken).toBeDefined();
    expect(loginRes.cookies.refreshToken).toBeDefined();
  });
});
