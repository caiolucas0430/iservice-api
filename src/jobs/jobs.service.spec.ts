import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Job, JobStatus } from './entities/job.entity';
import { UsersService } from 'src/users/users.service';
import { CreateJobDto } from './dto/create-job.dto';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

describe('JobsService', () => {
  let service: JobsService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest
      .fn()
      .mockResolvedValue([{ id: '1', description: 'Serviço Radar' }]),
  };

  const mockJobRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getRepositoryToken(Job),
          useValue: mockJobRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Inicialização', () => {
    it('deve estar definido', () => {
      expect(service).toBeDefined();
    });
  });

  describe('create', () => {
    it('deve formatar as coordenadas em GeoJSON Point e salvar o serviço', async () => {
      const createJobDto: CreateJobDto = {
        description: 'Vazamento na pia',
        latitude: -6.4585,
        longitude: -37.0944,
      };

      const mockUser = { id: '1', name: 'João Cliente' };
      const mockJobCreated = {
        description: createJobDto.description,
        client: mockUser,
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockJobRepository.create.mockReturnValue(mockJobCreated);
      mockJobRepository.save.mockResolvedValue({ id: '10', ...mockJobCreated });

      const result = await service.create(createJobDto, '1');

      expect(mockUsersService.findById).toHaveBeenCalledWith('1');
      expect(mockJobRepository.create).toHaveBeenCalledWith({
        description: 'Vazamento na pia',
        location: {
          type: 'Point',
          coordinates: [-37.0944, -6.4585],
        },
        client: mockUser,
      });
      expect(mockJobRepository.save).toHaveBeenCalledWith(mockJobCreated);
      expect(result).toHaveProperty('id', '10');
    });
  });

  describe('findByClient', () => {
    it('deve retornar os serviços solicitados por um cliente específico', async () => {
      const mockJobs = [{ id: '1', description: 'Limpeza de calha' }];
      mockJobRepository.find.mockResolvedValue(mockJobs);

      const result = await service.findByClient('1');

      expect(mockJobRepository.find).toHaveBeenCalledWith({
        where: { client: { id: '1' } },
        relations: ['client', 'professional'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockJobs);
    });
  });

  describe('findNearbyJobs', () => {
    it('deve usar o raio padrão de 10000 metros quando nenhum raio é fornecido', async () => {
      const result = await service.findNearbyJobs(-6.4585, -37.0944);

      expect(mockJobRepository.createQueryBuilder).toHaveBeenCalledWith('job');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          latitude: -6.4585,
          longitude: -37.0944,
          radius: 10000,
        }),
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'job.createdAt',
        'DESC',
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual([{ id: '1', description: 'Serviço Radar' }]);
    });

    it('deve converter e usar o raio fornecido (ex: 5000 metros)', async () => {
      await service.findNearbyJobs(-6.4585, -37.0944, '5000');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          radius: 5000,
        }),
      );
    });
  });

  describe('create - refactor UUID', () => {
    it('deve criar um novo job com sucesso usando UUID #37', async () => {
      const mockDto = { description: 'Teste', longitude: 0, latitude: 0 };
      const mockUserId = 'uuid-v4-string';
      const mockUser = { id: mockUserId, name: 'Ismael' };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockJobRepository.create.mockReturnValue({
        ...mockDto,
        client: mockUser,
      });
      mockJobRepository.save.mockResolvedValue({ id: 'job-id', ...mockDto });

      const result = await service.create(mockDto as any, mockUserId);

      expect(mockUsersService.findById).toHaveBeenCalledWith(mockUserId);
      expect(result).toHaveProperty('id');
    });
  });

  describe('findByClient - refactor UUID', () => {
    it('deve retornar lista de jobs de um cliente usando UUID #37', async () => {
      const mockUserId = 'uuid-v4-string';
      mockJobRepository.find.mockResolvedValue([
        { id: 'job-1' },
        { id: 'job-2' },
      ]);

      const result = await service.findByClient(mockUserId);

      expect(mockJobRepository.find).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findByProfessional', () => {
    it('deve retornar os serviços aceitos por um profissional específico', async () => {
      const mockJobs = [{ id: '1', description: 'Limpeza de calha' }];
      mockJobRepository.find.mockResolvedValue(mockJobs);

      const result = await service.findByProfessional('prof-123');

      expect(mockJobRepository.find).toHaveBeenCalledWith({
        where: { professional: { id: 'prof-123' } },
        relations: ['client', 'professional'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockJobs);
    });
  });

  describe('cancelJob', () => {
    const mockJobId = 'job-123';
    const mockClientId = 'client-123';
    const mockProfessionalId = 'prof-123';

    it('deve cancelar o job se o solicitante for o cliente criador', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.SEARCHING,
        client: { id: mockClientId },
        professional: null,
      };

      mockJobRepository.findOne = jest.fn().mockResolvedValue(mockJob);
      mockJobRepository.save.mockResolvedValue({
        ...mockJob,
        status: JobStatus.CANCELED,
      });

      const result = await service.cancelJob(mockJobId, mockClientId);

      expect(mockJobRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockJobId },
        relations: ['client', 'professional'],
      });
      expect(result.status).toBe(JobStatus.CANCELED);
    });

    it('deve remover o profissional e voltar o status para SEARCHING se o profissional cancelar', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.ACCEPTED,
        client: { id: mockClientId },
        professional: { id: mockProfessionalId },
      };

      mockJobRepository.findOne = jest.fn().mockResolvedValue(mockJob);
      mockJobRepository.save.mockResolvedValue({
        ...mockJob,
        status: JobStatus.SEARCHING,
        professional: null,
      });

      const result = await service.cancelJob(mockJobId, mockProfessionalId);

      expect(result.status).toBe(JobStatus.SEARCHING);
      expect(result.professional).toBeNull();
    });

    it('deve lançar NotFoundException se o job não existir', async () => {
      mockJobRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.cancelJob(mockJobId, mockClientId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ConflictException se o job já estiver concluído', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.COMPLETED,
        client: { id: mockClientId },
      };

      mockJobRepository.findOne = jest.fn().mockResolvedValue(mockJob);

      await expect(service.cancelJob(mockJobId, mockClientId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve lançar ForbiddenException se o usuário não tiver permissão', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.SEARCHING,
        client: { id: mockClientId },
        professional: null,
      };

      mockJobRepository.findOne = jest.fn().mockResolvedValue(mockJob);

      await expect(service.cancelJob(mockJobId, 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('acceptJob', () => {
    const mockJobId = 'job-123';
    const mockClientId = 'client-123';
    const mockProfessionalId = 'prof-123';

    it('deve aceitar o job com sucesso', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.SEARCHING,
        client: { id: mockClientId },
        professional: null,
      };
      const mockProfessionalUser = { id: mockProfessionalId, name: 'Pro' };

      mockJobRepository.findOne = jest.fn().mockResolvedValue(mockJob);
      mockUsersService.findById.mockResolvedValue(mockProfessionalUser);
      mockJobRepository.save.mockResolvedValue({
        ...mockJob,
        status: JobStatus.ACCEPTED,
        professional: mockProfessionalUser,
      });

      const result = await service.acceptJob(mockJobId, mockProfessionalId);

      expect(mockJobRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockJobId },
        relations: ['client', 'professional'],
      });
      expect(mockUsersService.findById).toHaveBeenCalledWith(
        mockProfessionalId,
      );
      expect(result.status).toBe(JobStatus.ACCEPTED);
      expect(result.professional).toEqual(mockProfessionalUser);
    });

    it('deve lançar ConflictException se o cliente tentar aceitar o próprio job', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.SEARCHING,
        client: { id: mockClientId },
        professional: null,
      };

      mockJobRepository.findOne = jest.fn().mockResolvedValue(mockJob);

      await expect(service.acceptJob(mockJobId, mockClientId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve lançar ConflictException se o job não estiver mais SEARCHING', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.CANCELED,
        client: { id: mockClientId },
        professional: null,
      };

      mockJobRepository.findOne = jest.fn().mockResolvedValue(mockJob);

      await expect(
        service.acceptJob(mockJobId, mockProfessionalId),
      ).rejects.toThrow(ConflictException);
    });

    it('deve lançar ConflictException se o job já tiver sido aceito (concorrência)', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.SEARCHING,
        client: { id: mockClientId },
        professional: { id: 'outro-prof-123' },
      };

      mockJobRepository.findOne = jest.fn().mockResolvedValue(mockJob);

      await expect(
        service.acceptJob(mockJobId, mockProfessionalId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('completeJob', () => {
    const mockJobId = 'job-123';
    const mockProfessionalId = 'prof-123';

    it('deve concluir o job com sucesso', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.ACCEPTED,
        professional: { id: mockProfessionalId },
      };

      mockJobRepository.findOne = jest.fn().mockResolvedValue(mockJob);
      mockJobRepository.save.mockResolvedValue({
        ...mockJob,
        status: JobStatus.COMPLETED,
      });

      const result = await service.completeJob(mockJobId, mockProfessionalId);

      expect(mockJobRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockJobId },
        relations: ['professional'],
      });
      expect(result.status).toBe(JobStatus.COMPLETED);
    });

    it('deve lançar NotFoundException se o job não for encontrado', async () => {
      mockJobRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        service.completeJob(mockJobId, mockProfessionalId),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException se o status do job não for ACCEPTED', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.SEARCHING,
        professional: { id: mockProfessionalId },
      };

      mockJobRepository.findOne = jest.fn().mockResolvedValue(mockJob);

      await expect(
        service.completeJob(mockJobId, mockProfessionalId),
      ).rejects.toThrow(ConflictException);
    });

    it('deve lançar ForbiddenException se um usuário diferente tentar concluir', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.ACCEPTED,
        professional: { id: mockProfessionalId },
      };

      mockJobRepository.findOne = jest.fn().mockResolvedValue(mockJob);

      await expect(
        service.completeJob(mockJobId, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
