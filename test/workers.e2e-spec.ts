/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { describe, beforeAll, it, expect, afterAll } from '@jest/globals';
import request from 'supertest';

describe('Workers E2E CRUD', () => {
  let app: INestApplication;
  let workerId: number;
  let token: string;

  const email = `worker_user_${Date.now()}@gmail.com`;
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

    // Register & Login a user to get the JWT token
    await request(app.getHttpServer()).post('/auth/register').send({
      firstName: 'WorkerTester',
      lastName: 'User',
      email,
      password: senha,
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: senha });
    token = (loginRes.body as { token: string }).token;
  });

  it('deve criar um trabalhador (POST /workers)', async () => {
    const res = await request(app.getHttpServer())
      .post('/workers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Carlos da Silva',
        role: 'Pintor',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Carlos da Silva');
    expect(res.body.role).toBe('Pintor');
    workerId = (res.body as { id: number }).id;
  });

  it('deve retornar a lista de trabalhadores (GET /workers)', async () => {
    const res = await request(app.getHttpServer())
      .get('/workers')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('deve retornar um trabalhador pelo ID (GET /workers/:id)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/workers/${workerId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(workerId);
    expect(res.body.name).toBe('Carlos da Silva');
  });

  it('deve atualizar um trabalhador (PATCH /workers/:id)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/workers/${workerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Carlos S. Pintor',
        role: 'Pintor Profissional',
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Carlos S. Pintor');
    expect(res.body.role).toBe('Pintor Profissional');
  });

  it('deve retornar 404 ao tentar buscar um trabalhador inexistente (GET /workers/:id)', async () => {
    const res = await request(app.getHttpServer())
      .get('/workers/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('deve remover um trabalhador (DELETE /workers/:id)', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/workers/${workerId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);
  });

  afterAll(async () => {
    await app.close();
  });
});
