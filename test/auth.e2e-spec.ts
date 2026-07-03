/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { describe, beforeAll, it, expect, afterAll } from '@jest/globals';
import request from 'supertest';

describe('Fluxo de Autenticação e Autorização (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  const emailUnico = `teste_e2e_${Date.now()}@gmail.com`;
  const senhaTeste = 'senhaMuitoSegura123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).post('/auth/register').send({
      firstName: 'Caio',
      lastName: 'Lucas',
      email: emailUnico,
      password: senhaTeste,
    });
  });

  it('/auth/login (POST) - Deve retornar status de sucesso e um token válido', async () => {
    const credenciaisDeLogin = {
      email: emailUnico,
      password: senhaTeste,
    };

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(credenciaisDeLogin);

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
    expect(response.body).toHaveProperty('token');

    const responseBody = response.body as { token: string };
    jwtToken = responseBody.token;
  });

  describe('Proteção de Rotas com JwtAuthGuard', () => {
    const rotaProtegida = '/users/me';

    it(`${rotaProtegida} (GET) - Cenário A: Deve bloquear o acesso sem token`, async () => {
      await request(app.getHttpServer()).get(rotaProtegida).expect(401);
    });

    it(`${rotaProtegida} (GET) - Cenário B: Deve permitir o acesso com token`, async () => {
      await request(app.getHttpServer())
        .get(rotaProtegida)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
