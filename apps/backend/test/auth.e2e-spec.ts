import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import * as cookieParser from 'cookie-parser';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/auth/register (POST)', () => {
    const email = `test${Date.now()}@example.com`;
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: email,
        password: 'password123',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.data.user.email).toBe(email);
        expect(res.body.data.token).toBeDefined();
      });
  });

  it('/api/auth/login (POST)', async () => {
    const email = `login${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Jane Doe',
        email: email,
        password: 'password123',
      });

    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: email,
        password: 'password123',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.token).toBeDefined();
        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();
        expect(cookies[0]).toContain('accessToken=');
      });
  });
});
