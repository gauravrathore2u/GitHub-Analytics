import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import mongoose from 'mongoose';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongoose.connection.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('server is up!');
  });

  it('/auth/login (POST) should return 401 for invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'invalid', password: 'invalid' })
      .expect(401);
  });

  it('should return 404 for unknown route', async () => {
    await request(app.getHttpServer()).get('/unknown-route').expect(404);
  });

  it('/auth/signup (POST) should return 400 for password mismatch', async () => {
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'user1',
        password: 'pass1',
        confirmPassword: 'pass2',
        githubPat: 'ghp_invalidpat',
      })
      .expect(400);
  });

  it('/auth/signup (POST) should return 201 for valid signup', async () => {
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'user2',
        password: 'pass1234',
        confirmPassword: 'pass1234',
        githubPat: 'ghp_invalidpat',
      })
      .expect(201);
  });
});
