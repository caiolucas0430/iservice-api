import { Test, TestingModule } from '@nestjs/testing';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';

describe('WorkersController', () => {
  let controller: WorkersController;

  const mockWorkersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkersController],
      providers: [
        {
          provide: WorkersService,
          useValue: mockWorkersService,
        },
      ],
    }).compile();

    controller = module.get<WorkersController>(WorkersController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('deve criar um trabalhador', () => {
      const dto = {
        name: 'João',
        role: 'Pedreiro',
      };

      const worker = {
        id: 1,
        ...dto,
      };

      mockWorkersService.create.mockReturnValue(worker);

      const result = controller.create(dto);

      expect(result).toEqual(worker);
      expect(mockWorkersService.create).toHaveBeenCalledWith(dto);
      expect(mockWorkersService.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('deve listar trabalhadores', () => {
      const workers = [
        {
          id: 1,
          name: 'João',
          role: 'Pedreiro',
        },
      ];

      mockWorkersService.findAll.mockReturnValue(workers);

      const result = controller.findAll();

      expect(result).toEqual(workers);
      expect(mockWorkersService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('deve buscar um trabalhador pelo id', () => {
      const worker = {
        id: 1,
        name: 'João',
        role: 'Pedreiro',
      };

      mockWorkersService.findOne.mockReturnValue(worker);

      const result = controller.findOne(1);

      expect(result).toEqual(worker);
      expect(mockWorkersService.findOne).toHaveBeenCalledWith(1);
      expect(mockWorkersService.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('deve atualizar um trabalhador', () => {
      const dto = {
        role: 'Eletricista',
      };

      const worker = {
        id: 1,
        name: 'João',
        role: 'Eletricista',
      };

      mockWorkersService.update.mockReturnValue(worker);

      const result = controller.update(1, dto);

      expect(result).toEqual(worker);
      expect(mockWorkersService.update).toHaveBeenCalledWith(1, dto);
      expect(mockWorkersService.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('deve remover um trabalhador', () => {
      const response = {
        deleted: true,
      };

      mockWorkersService.remove.mockReturnValue(response);

      const result = controller.remove(1);

      expect(result).toEqual(response);
      expect(mockWorkersService.remove).toHaveBeenCalledWith(1);
      expect(mockWorkersService.remove).toHaveBeenCalledTimes(1);
    });
  });
});
