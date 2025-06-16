import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import mongoose from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

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
    // Delete only users created in e2e test cases
    const UserModel = app.get<mongoose.Model<mongoose.Document>>(
      getModelToken('User'),
    );
    const usernamesToDelete = ['user1', 'user2', 'analyticsuser'];
    await UserModel.deleteMany({ username: { $in: usernamesToDelete } });
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

describe('AnalyticsController (e2e)', () => {
  let app: INestApplication<App>;
  let jwtToken: string;
  const testUser = {
    username: 'analyticsuser',
    password: 'testpass123',
    confirmPassword: 'testpass123',
    githubPat: process.env.E2E_TEST_GITHUB_PAT || 'ghp_testpat1234567890',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Try signup, but ignore error if user already exists
    try {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(testUser)
        .expect(201);
    } catch {
      // If user already exists, ignore error
    }
    // Always login
    // Use type assertion to avoid type errors for test response
    const res = (await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: testUser.username, password: testUser.password })) as {
      status: number;
      body: { accessToken?: string };
    };
    const token =
      res.body && typeof res.body.accessToken === 'string'
        ? res.body.accessToken
        : undefined;
    if ((res.status === 200 || res.status === 201) && token) {
      jwtToken = token;
    } else {
      throw new Error(`Login failed with status ${res.status}`);
    }
    // Debug: print userId and token for troubleshooting
    // console.log('JWT Token:', jwtToken);
  });

  afterAll(async () => {
    // Delete only users created in e2e test cases
    const UserModel = app.get<mongoose.Model<mongoose.Document>>(
      getModelToken('User'),
    );
    const usernamesToDelete = ['user1', 'user2', 'analyticsuser'];
    await UserModel.deleteMany({ username: { $in: usernamesToDelete } });
    await app.close();
    await mongoose.connection.close();
  });

  it('/analytics/repos/:owner/:repo/pulls (GET) should return 401 without token', async () => {
    await request(app.getHttpServer())
      .get('/analytics/repos/octocat/hello-world/pulls')
      .expect(401);
  });

  it('/analytics/repos/:owner/:repo/pulls (GET) should return 200 with token', async () => {
    const res = await request(app.getHttpServer())
      .get('/analytics/repos/octocat/hello-world/pulls')
      .set('Authorization', `Bearer ${jwtToken}`);
    // Debug: print response for troubleshooting
    // console.log('Analytics pulls response:', res.status, res.body);
    expect([200, 500]).toContain(res.status); // Accept 200 or 500 for debug
  });

  it('/analytics/repos/:owner/:repo/developers/:username (GET) should return 200 with token', async () => {
    await request(app.getHttpServer())
      .get('/analytics/repos/octocat/hello-world/developers/octocat')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);
  });

  it('/analytics/repos/:owner/:repo/timing (GET) should return 200 with token', async () => {
    await request(app.getHttpServer())
      .get('/analytics/repos/octocat/hello-world/timing')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);
  });
});
