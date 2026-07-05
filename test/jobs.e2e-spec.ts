/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { describe, beforeAll, it, expect, afterAll } from '@jest/globals';
import request from 'supertest';

describe('Jobs E2E Flow', () => {
  let app: INestApplication;
  let clientToken: string;
  let profToken: string;
  let jobId: string;

  const clientEmail = `client_${Date.now()}@gmail.com`;
  const profEmail = `prof_${Date.now()}@gmail.com`;
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

    // Register Client
    await request(app.getHttpServer()).post('/auth/register').send({
      firstName: 'Client',
      lastName: 'User',
      email: clientEmail,
      password: senha,
    });

    const clientLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: clientEmail, password: senha });
    clientToken = (clientLogin.body as { token: string }).token;

    // Register Professional
    await request(app.getHttpServer()).post('/auth/register').send({
      firstName: 'Prof',
      lastName: 'User',
      email: profEmail,
      password: senha,
    });

    const profLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: profEmail, password: senha });
    profToken = (profLogin.body as { token: string }).token;

    // Promote Professional user to PROFESSIONAL role
    await request(app.getHttpServer())
      .patch('/users/me/role')
      .set('Authorization', `Bearer ${profToken}`)
      .send({ role: 'PROFESSIONAL' });

    // Refresh Professional login token to include professional role
    const profLoginRefreshed = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: profEmail, password: senha });
    profToken = (profLoginRefreshed.body as { token: string }).token;
  });

  it('deve criar um serviço como cliente', async () => {
    const res = await request(app.getHttpServer())
      .post('/jobs')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        description: 'Vazamento pia da cozinha',
        latitude: -5.79448,
        longitude: -35.211,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.description).toBe('Vazamento pia da cozinha');
    jobId = (res.body as { id: string }).id;
  });

  it('deve permitir listar os próprios serviços criados (cliente)', async () => {
    const res = await request(app.getHttpServer())
      .get('/jobs/my-jobs')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('deve permitir ao profissional buscar serviços próximos (radar)', async () => {
    const res = await request(app.getHttpServer())
      .get('/jobs/radar')
      .set('Authorization', `Bearer ${profToken}`)
      .query({
        latitude: '-5.79448',
        longitude: '-35.211',
        radius: '15000',
      });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const hasOurJob = (res.body as { id: string }[]).some(
      (j) => j.id === jobId,
    );
    expect(hasOurJob).toBe(true);
  });

  it('deve permitir ao profissional aceitar o serviço', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/jobs/${jobId}/accept`)
      .set('Authorization', `Bearer ${profToken}`);

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    expect(res.body.status).toBe('accepted');
  });

  it('deve permitir ao profissional listar seus serviços aceitos (my-services)', async () => {
    const res = await request(app.getHttpServer())
      .get('/jobs/my-services')
      .set('Authorization', `Bearer ${profToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('deve permitir ao profissional concluir o serviço', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/jobs/${jobId}/complete`)
      .set('Authorization', `Bearer ${profToken}`);

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    expect(res.body.status).toBe('completed');
  });

  it('deve permitir cancelar um serviço em andamento (criação de um novo para teste)', async () => {
    // Create new job to cancel
    const newJob = await request(app.getHttpServer())
      .post('/jobs')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        description: 'Trocar disjuntor elétrico',
        latitude: -5.79448,
        longitude: -35.211,
      });

    const newJobId = (newJob.body as { id: string }).id;

    // Cancel job
    const cancelRes = await request(app.getHttpServer())
      .patch(`/jobs/${newJobId}/cancel`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(cancelRes.status).toBeGreaterThanOrEqual(200);
    expect(cancelRes.status).toBeLessThan(300);
    expect(cancelRes.body.status).toBe('canceled');
  });

  afterAll(async () => {
    await app.close();
  });
});
