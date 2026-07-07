import { Worker } from './worker.entity';

describe('Worker Entity', () => {
  it('should be defined and instantiate correctly', () => {
    const worker = new Worker();
    expect(worker).toBeDefined();

    worker.id = 1;
    worker.name = 'Test Worker';
    worker.role = 'Technician';

    expect(worker.id).toBe(1);
    expect(worker.name).toBe('Test Worker');
    expect(worker.role).toBe('Technician');
  });
});
