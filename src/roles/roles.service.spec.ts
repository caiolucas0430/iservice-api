import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { RoleName } from './enums/role.enum';

describe('RolesService', () => {
  let service: RolesService;

  const mockRoleRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: getRepositoryToken(Role), useValue: mockRoleRepository },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByName', () => {
    it('retorna a role quando encontrada', async () => {
      const role = { name: RoleName.PROFESSIONAL } as Role;
      mockRoleRepository.findOne.mockResolvedValue(role);

      const result = await service.findByName(RoleName.PROFESSIONAL);

      expect(result).toBe(role);
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { name: RoleName.PROFESSIONAL },
      });
    });

    it('retorna null quando a role não existe', async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);

      const result = await service.findByName('INEXISTENTE');

      expect(result).toBeNull();
    });
  });

  describe('onApplicationBootstrap (seeder)', () => {
    it('cria as três roles base quando nenhuma existe', async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.create.mockImplementation((data: Partial<Role>) => data);
      mockRoleRepository.save.mockResolvedValue(undefined);

      await service.onApplicationBootstrap();

      expect(mockRoleRepository.findOne).toHaveBeenCalledTimes(3);
      expect(mockRoleRepository.create).toHaveBeenCalledTimes(3);
      expect(mockRoleRepository.save).toHaveBeenCalledTimes(3);
      expect(mockRoleRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: RoleName.USER }),
      );
      expect(mockRoleRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: RoleName.ADMIN }),
      );
      expect(mockRoleRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: RoleName.PROFESSIONAL }),
      );
    });

    it('não recria roles que já existem', async () => {
      mockRoleRepository.findOne.mockResolvedValue({
        name: RoleName.USER,
      } as Role);

      await service.onApplicationBootstrap();

      expect(mockRoleRepository.findOne).toHaveBeenCalledTimes(3);
      expect(mockRoleRepository.create).not.toHaveBeenCalled();
      expect(mockRoleRepository.save).not.toHaveBeenCalled();
    });

    it('cria apenas as roles ausentes quando algumas já existem', async () => {
      mockRoleRepository.findOne.mockImplementation(
        ({ where }: { where: { name: RoleName } }) =>
          Promise.resolve(
            where.name === RoleName.ADMIN ? ({ name: RoleName.ADMIN } as Role) : null,
          ),
      );
      mockRoleRepository.create.mockImplementation((data: Partial<Role>) => data);
      mockRoleRepository.save.mockResolvedValue(undefined);

      await service.onApplicationBootstrap();

      expect(mockRoleRepository.create).toHaveBeenCalledTimes(2);
      expect(mockRoleRepository.save).toHaveBeenCalledTimes(2);
      expect(mockRoleRepository.create).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: RoleName.ADMIN }),
      );
    });
  });
});
