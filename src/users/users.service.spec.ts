import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Certificate } from './entities/certificate.entity';
import { PortfolioItem } from './entities/portfolio-item.entity';
import { RolesService } from '../roles/roles.service';
import { UploadService } from '../upload/upload.service';
import { ReviewsService } from '../reviews/reviews.service';
import { Job } from '../jobs/entities/job.entity';
import { Role } from '../roles/entities/role.entity';
import { RoleName } from '../roles/enums/role.enum';
import { ProfileMessages } from './users.messages';

/**
 * Testes de Unidade - User Story US02 (Manter Perfil).
 * Cobrem RN02, RN03, RN06 e dão suporte às evidências dos testes de
 * aceitação TA02.01 e TA02.02.
 */
describe('UsersService - US02 (Manter Perfil)', () => {
  let service: UsersService;

  const userRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    find: jest.fn(),
  };
  const rolesService = { findByName: jest.fn() };

  const makeRole = (name: RoleName): Role => ({ name }) as unknown as Role;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Certificate), useValue: {} },
        { provide: getRepositoryToken(PortfolioItem), useValue: {} },
        { provide: getRepositoryToken(Job), useValue: {} },
        { provide: RolesService, useValue: rolesService },
        { provide: UploadService, useValue: {} },
        { provide: ReviewsService, useValue: {} },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    // save apenas devolve a entidade recebida
    userRepository.save.mockImplementation((entity: User) =>
      Promise.resolve(entity),
    );
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('updateProfile (RN03 / TA02.01)', () => {
    it('atualiza biografia e telefone e retorna MSG01', async () => {
      const user: Partial<User> = {
        id: 'u1',
        firstName: 'Ismael',
        lastName: 'Gomes',
        email: 'ismael@teste.com',
        roles: [makeRole(RoleName.USER)],
        profile: undefined,
      };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.updateProfile('u1', {
        bio: 'Eletricista há 10 anos',
        phoneNumber: '(84) 99999-9999',
      });

      expect(result.message).toBe(ProfileMessages.UPDATE_SUCCESS);
      expect(result.user.profile?.bio).toBe('Eletricista há 10 anos');
      expect(result.user.profile?.phoneNumber).toBe('(84) 99999-9999');
      expect(userRepository.save).toHaveBeenCalledTimes(1);
    });

    it('lança NotFound quando o usuário não existe', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile('inexistente', { bio: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('switchRole (RN02 / RN06 / TA02.02)', () => {
    it('promove USER para PROFESSIONAL e retorna MSG02', async () => {
      const user: Partial<User> = {
        id: 'u1',
        firstName: 'Ismael',
        lastName: 'Gomes',
        email: 'ismael@teste.com',
        roles: [makeRole(RoleName.USER)],
      };
      userRepository.findOne.mockResolvedValue(user);
      rolesService.findByName.mockResolvedValue(
        makeRole(RoleName.PROFESSIONAL),
      );

      const result = await service.switchRole('u1', RoleName.PROFESSIONAL);

      expect(result.message).toBe(ProfileMessages.ROLE_SWITCH_SUCCESS);
      expect(result.user.roles).toContain(RoleName.PROFESSIONAL);
      expect(result.user.roles).toContain(RoleName.USER);
      expect(userRepository.save).toHaveBeenCalledTimes(1);
    });

    it('rebaixa PROFESSIONAL de volta para USER (bidirecional)', async () => {
      const user: Partial<User> = {
        id: 'u1',
        firstName: 'Ismael',
        lastName: 'Gomes',
        email: 'ismael@teste.com',
        roles: [makeRole(RoleName.USER), makeRole(RoleName.PROFESSIONAL)],
      };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.switchRole('u1', RoleName.USER);

      expect(result.message).toBe(ProfileMessages.ROLE_SWITCH_SUCCESS);
      expect(result.user.roles).toContain(RoleName.USER);
      expect(result.user.roles).not.toContain(RoleName.PROFESSIONAL);
    });

    it('é idempotente ao promover quem já é PROFESSIONAL', async () => {
      const user: Partial<User> = {
        id: 'u1',
        firstName: 'Ismael',
        lastName: 'Gomes',
        email: 'ismael@teste.com',
        roles: [makeRole(RoleName.USER), makeRole(RoleName.PROFESSIONAL)],
      };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.switchRole('u1', RoleName.PROFESSIONAL);

      // Não deve consultar/duplicar a role
      expect(rolesService.findByName).not.toHaveBeenCalled();
      expect(
        result.user.roles.filter(
          (r) => r === (RoleName.PROFESSIONAL as string),
        ).length,
      ).toBe(1);
    });

    it('rejeita role não permitida (ex.: ADMIN) com BadRequest', async () => {
      await expect(
        service.switchRole('u1', RoleName.ADMIN),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('lança NotFound quando o usuário não existe', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.switchRole('inexistente', RoleName.PROFESSIONAL),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
