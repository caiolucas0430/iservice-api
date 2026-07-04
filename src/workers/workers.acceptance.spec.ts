import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { WorkersModule } from './workers.module';
import request from 'supertest';

interface WorkerResponse {
  id: number;
  name: string;
  role: string;
}

describe('Workers (e2e)', () => {
  let app: INestApplication;
  let server: Parameters<typeof request>[0];
  let workerId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [WorkersModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    server = app.getHttpServer() as Parameters<typeof request>[0];
  });

  it('POST /workers - criar worker', async () => {
    const response = (await request(server)
      .post('/workers')
      .send({
        name: 'João',
        role: 'Pedreiro',
      })
      .expect(201)) as { body: WorkerResponse };

    workerId = response.body.id;

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('João');
    expect(response.body.role).toBe('Pedreiro');
  });

  it('GET /workers - listar workers', async () => {
    const response = await request(server).get('/workers').expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('GET /workers/:id - buscar worker', async () => {
    const response = (await request(server)
      .get(`/workers/${workerId}`)
      .expect(200)) as { body: WorkerResponse };

    expect(response.body.id).toBe(workerId);
  });

  it('PATCH /workers/:id - atualizar worker', async () => {
    const response = (await request(server)
      .patch(`/workers/${workerId}`)
      .send({
        role: 'Eletricista',
      })
      .expect(200)) as { body: WorkerResponse };

    expect(response.body.role).toBe('Eletricista');
  });

  it('DELETE /workers/:id - remover worker', async () => {
    await request(server).delete(`/workers/${workerId}`).expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
