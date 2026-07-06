/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { describe, beforeAll, it, expect, afterAll } from '@jest/globals';
import request from 'supertest';

/**
 * Testes de Aceitação - User Story US02 (Manter Perfil).
 * Mapeamento direto:
 *   TA02.01 -> Atualização de biografia e telefone (MSG01)
 *   TA02.02 -> Alteração de role USER <-> PROFESSIONAL (MSG02)
 *   TA02.03 -> Acesso não autenticado (MSG03)
 *   TA02.04 -> Telefone inválido (MSG04)
 *
 * Requer PostgreSQL + PostGIS ativo (docker-compose up -d) e .env configurado.
 * Execução: npm run test:e2e
 */
describe('US02 - Manter Perfil (e2e)', () => {
  let app: INestApplication;
  let token: string;

  const email = `us02_${Date.now()}@gmail.com`;
  const senha = 'senhaSegura123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Reproduz a configuração global do main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    await request(app.getHttpServer()).post('/auth/register').send({
      firstName: 'Ismael',
      lastName: 'Gomes',
      email,
      password: senha,
    });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: senha });

    token = (login.body as { token: string }).token;
  });

  it('TA02.03 - bloqueia acesso não autenticado (MSG03)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/users/profile')
      .send({ bio: 'tentativa sem token' });

    expect(res.status).toBe(401);
    expect(JSON.stringify(res.body)).toContain('Usuário não autenticado.');
  });

  it('TA02.01 - atualiza biografia e telefone com sucesso (MSG01)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ bio: 'Eletricista há 10 anos', phoneNumber: '(84) 99999-9999' });

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);

    const body = res.body as {
      message: string;
      user: { profile: { bio: string; phoneNumber: string } };
    };
    expect(body.message).toBe('Perfil atualizado com sucesso.');
    expect(body.user.profile.bio).toBe('Eletricista há 10 anos');
    expect(body.user.profile.phoneNumber).toBe('(84) 99999-9999');
  });

  it('TA02.04 - rejeita telefone inválido (MSG04)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ phoneNumber: '123' });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain('Telefone inválido.');
  });

  it('TA02.02 - alterna role para PROFESSIONAL e volta para USER (MSG02)', async () => {
    const paraProf = await request(app.getHttpServer())
      .patch('/users/me/role')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'PROFESSIONAL' });

    expect(paraProf.status).toBeGreaterThanOrEqual(200);
    expect(paraProf.status).toBeLessThan(300);

    const bodyProf = paraProf.body as {
      message: string;
      user: { roles: string[] };
    };
    expect(bodyProf.message).toBe('Tipo de conta alterado com sucesso.');
    expect(bodyProf.user.roles).toContain('PROFESSIONAL');

    const paraUser = await request(app.getHttpServer())
      .patch('/users/me/role')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'USER' });

    const bodyUser = paraUser.body as { user: { roles: string[] } };
    expect(bodyUser.user.roles).toContain('USER');
    expect(bodyUser.user.roles).not.toContain('PROFESSIONAL');
  });

  afterAll(async () => {
    await app.close();
  });
});
