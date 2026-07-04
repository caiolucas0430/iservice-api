import { Test, TestingModule } from '@nestjs/testing';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('JobsController', () => {
  let controller: JobsController;

  const mockJobsService = {
    create: jest.fn(),
    findByClient: jest.fn(),
    findNearbyJobs: jest.fn(),
    cancelJob: jest.fn(),
    acceptJob: jest.fn(),
    findByProfessional: jest.fn(),
    completeJob: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 1,
      roles: ['PROFESSIONAL'],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        {
          provide: JobsService,
          useValue: mockJobsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<JobsController>(JobsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Inicialização', () => {
    it('deve estar definido', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('create', () => {
    it('deve chamar service.create com o DTO recebido e o ID do usuário do token', async () => {
      const createJobDto: CreateJobDto = {
        description: 'Conserto de pia',
        latitude: -6.4585,
        longitude: -37.0944,
      };

      const mockResult = { id: 10, ...createJobDto, client: { id: 1 } };
      mockJobsService.create.mockResolvedValue(mockResult);

      const result = await controller.create(
        createJobDto,
        mockRequest as never,
      );

      expect(mockJobsService.create).toHaveBeenCalledWith(createJobDto, 1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findMyJobs', () => {
    it('deve chamar service.findByClient passando o ID do usuário logado', async () => {
      const mockJobs = [{ id: 1, description: 'Conserto de pia' }];
      mockJobsService.findByClient.mockResolvedValue(mockJobs);

      const result = await controller.findMyJobs(mockRequest as never);

      expect(mockJobsService.findByClient).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockJobs);
    });
  });

  describe('findRadar', () => {
    it('deve converter latitude/longitude para Float e repassar o raio para o service', async () => {
      const mockJobs = [{ id: 2, description: 'Trocar fiação' }];
      mockJobsService.findNearbyJobs.mockResolvedValue(mockJobs);

      const result = await controller.findRadar('-6.4585', '-37.0944', '5000');

      expect(mockJobsService.findNearbyJobs).toHaveBeenCalledWith(
        -6.4585,
        -37.0944,
        '5000',
      );
      expect(result).toEqual(mockJobs);
    });

    it('deve repassar undefined para o raio caso ele não seja enviado na requisição', async () => {
      await controller.findRadar('-6.4585', '-37.0944');

      expect(mockJobsService.findNearbyJobs).toHaveBeenCalledWith(
        -6.4585,
        -37.0944,
        undefined,
      );
    });
  });

  describe('cancelJob', () => {
    it('deve chamar service.cancelJob com o id do serviço e do usuário', async () => {
      const mockResult = { success: true };

      mockJobsService.cancelJob.mockResolvedValue(mockResult);

      const result = await controller.cancelJob('10', mockRequest as never);

      expect(mockJobsService.cancelJob).toHaveBeenCalledWith('10', 1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('acceptJob', () => {
    it('deve chamar service.acceptJob com o id do serviço e do profissional', async () => {
      const mockResult = { success: true };

      mockJobsService.acceptJob.mockResolvedValue(mockResult);

      const result = await controller.acceptJob('10', mockRequest as never);

      expect(mockJobsService.acceptJob).toHaveBeenCalledWith('10', 1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findMyServices', () => {
    it('deve chamar service.findByProfessional passando o ID do profissional logado', async () => {
      const mockServices = [
        { id: 1, description: 'Troca de chuveiro' },
        { id: 2, description: 'Instalação de tomada' },
      ];

      mockJobsService.findByProfessional.mockResolvedValue(mockServices);

      const result = await controller.findMyServices(mockRequest as never);

      expect(mockJobsService.findByProfessional).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockServices);
    });
  });

  describe('completeJob', () => {
    it('deve chamar service.completeJob com o id do serviço e do profissional', async () => {
      const mockResult = { success: true };

      mockJobsService.completeJob.mockResolvedValue(mockResult);

      const result = await controller.completeJob('10', mockRequest as never);

      expect(mockJobsService.completeJob).toHaveBeenCalledWith('10', 1);
      expect(result).toEqual(mockResult);
    });
  });
});
