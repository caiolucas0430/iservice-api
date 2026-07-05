/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { describe, beforeAll, it, expect, afterAll } from '@jest/globals';
import request from 'supertest';

describe('Reviews E2E Flow', () => {
  let app: INestApplication;
  let clientToken: string;
  let profToken: string;
  let clientId: string;
  let profId: string;
  let jobId: string;

  const clientEmail = `reviewer_c_${Date.now()}@gmail.com`;
  const profEmail = `reviewer_p_${Date.now()}@gmail.com`;
  const senha = 'senhaMuitoSegura123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    // Register & Login Client
    await request(app.getHttpServer()).post('/auth/register').send({
      firstName: 'ClientReviewer',
      lastName: 'User',
      email: clientEmail,
      password: senha,
    });
    const clientLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: clientEmail, password: senha });
    clientToken = (clientLogin.body as { token: string }).token;
    clientId = (clientLogin.body as { user: { id: string } }).user.id;

    // Register & Login Professional
    await request(app.getHttpServer()).post('/auth/register').send({
      firstName: 'ProfReviewee',
      lastName: 'User',
      email: profEmail,
      password: senha,
    });
    const profLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: profEmail, password: senha });
    profToken = (profLogin.body as { token: string }).token;
    profId = (profLogin.body as { user: { id: string } }).user.id;

    // Promote to Professional
    await request(app.getHttpServer())
      .patch('/users/me/role')
      .set('Authorization', `Bearer ${profToken}`)
      .send({ role: 'PROFESSIONAL' });

    const profLoginRefreshed = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: profEmail, password: senha });
    profToken = (profLoginRefreshed.body as { token: string }).token;

    // Create a job
    const jobRes = await request(app.getHttpServer())
      .post('/jobs')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        description: 'Reparo elétrico residencial',
        latitude: -5.79448,
        longitude: -35.211,
      });
    jobId = (jobRes.body as { id: string }).id;

    // Professional accepts the job
    await request(app.getHttpServer())
      .patch(`/jobs/${jobId}/accept`)
      .set('Authorization', `Bearer ${profToken}`);

    // Professional completes the job
    await request(app.getHttpServer())
      .patch(`/jobs/${jobId}/complete`)
      .set('Authorization', `Bearer ${profToken}`);
  });

  it('deve permitir ao cliente avaliar o profissional', async () => {
    const res = await request(app.getHttpServer())
      .post('/reviews')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        jobId,
        rating: 5,
        comment: 'Excelente eletricista, muito rápido!',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.rating).toBe(5);
    expect(res.body.comment).toBe('Excelente eletricista, muito rápido!');
  });

  it('deve permitir obter as avaliações de um usuário específico', async () => {
    const res = await request(app.getHttpServer())
      .get(`/reviews/user/${profId}`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('averageRating');
    expect(res.body).toHaveProperty('totalReviews');
    expect(res.body.totalReviews).toBe(1);
    expect(res.body.averageRating).toBe(5);
    expect(res.body.reviews[0].reviewer.id).toBe(clientId);
  });

  it('deve rejeitar uma segunda avaliação para o mesmo serviço e avaliador', async () => {
    const res = await request(app.getHttpServer())
      .post('/reviews')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        jobId,
        rating: 4,
        comment: 'Tentei avaliar de novo',
      });

    expect(res.status).toBe(409); // ConflictException
  });

  afterAll(async () => {
    await app.close();
  });
});
