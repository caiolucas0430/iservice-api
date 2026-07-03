// src/workers/workers.service.spec.ts

import { WorkersService } from './workers.service';
import { NotFoundException } from '@nestjs/common';

describe('WorkersService', () => {
  let service: WorkersService;

  beforeEach(() => {
    service = new WorkersService();
  });

  it('deve iniciar com lista vazia', () => {
    expect(service.findAll()).toEqual([]);
  });

  it('deve criar um trabalhador', () => {
    const worker = service.create({
      name: 'João',
      role: 'Pedreiro',
    });

    expect(worker).toHaveProperty('id');
    expect(worker.name).toBe('João');
  });

  it('deve gerar ids incrementais', () => {
    const worker1 = service.create({
      name: 'João',
      role: 'Pedreiro',
    });

    const worker2 = service.create({
      name: 'Maria',
      role: 'Pintora',
    });

    expect(worker1.id).toBe(1);
    expect(worker2.id).toBe(2);
  });

  it('deve listar trabalhadores', () => {
    service.create({ name: 'João', role: 'Pedreiro' });
    service.create({ name: 'Maria', role: 'Pintora' });

    const workers = service.findAll();

    expect(workers.length).toBe(2);
  });

  it('deve buscar por id', () => {
    const worker = service.create({
      name: 'João',
      role: 'Pedreiro',
    });

    const found = service.findOne(worker.id);

    expect(found.id).toBe(worker.id);
  });

  it('deve lançar erro ao buscar inexistente', () => {
    expect(() => service.findOne(999)).toThrow(NotFoundException);
  });

  it('deve atualizar trabalhador', () => {
    const worker = service.create({
      name: 'João',
      role: 'Pedreiro',
    });

    const updated = service.update(worker.id, {
      name: 'Carlos',
    });

    expect(updated.name).toBe('Carlos');
  });

  it('deve preservar os campos não atualizados', () => {
    const worker = service.create({
      name: 'João',
      role: 'Pedreiro',
    });

    const updated = service.update(worker.id, {
      role: 'Eletricista',
    });

    expect(updated.name).toBe('João');
    expect(updated.role).toBe('Eletricista');
  });

  it('deve lançar erro ao atualizar trabalhador inexistente', () => {
    expect(() =>
      service.update(999, {
        role: 'Eletricista',
      }),
    ).toThrow(NotFoundException);
  });

  it('deve remover trabalhador', () => {
    const worker = service.create({
      name: 'João',
      role: 'Pedreiro',
    });

    service.remove(worker.id);

    expect(service.findAll().length).toBe(0);
  });

  it('deve lançar erro ao remover trabalhador inexistente', () => {
    expect(() => service.remove(999)).toThrow(NotFoundException);
  });

  it('não deve encontrar trabalhador após remoção', () => {
    const worker = service.create({
      name: 'João',
      role: 'Pedreiro',
    });

    service.remove(worker.id);

    expect(() => service.findOne(worker.id)).toThrow(NotFoundException);
  });

  it('deve remover apenas o trabalhador informado', () => {
    const worker1 = service.create({
      name: 'João',
      role: 'Pedreiro',
    });

    const worker2 = service.create({
      name: 'Maria',
      role: 'Pintora',
    });

    service.remove(worker1.id);

    const workers = service.findAll();

    expect(workers).toHaveLength(1);
    expect(workers[0].id).toBe(worker2.id);
  });
});
