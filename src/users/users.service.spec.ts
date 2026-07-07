import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User, Provider } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import * as bcrypt from 'bcrypt';
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

  const certificateRepository = { create: jest.fn(), save: jest.fn() };
  const portfolioItemRepository = { create: jest.fn(), save: jest.fn() };

  const makeRole = (name: RoleName): Role => ({ name }) as unknown as Role;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        {
          provide: getRepositoryToken(Certificate),
          useValue: certificateRepository,
        },
        {
          provide: getRepositoryToken(PortfolioItem),
          useValue: portfolioItemRepository,
        },
        {
          provide: getRepositoryToken(Job),
          useValue: { count: jest.fn().mockResolvedValue(0) },
        },
        { provide: RolesService, useValue: rolesService },
        {
          provide: UploadService,
          useValue: { uploadFile: jest.fn().mockResolvedValue('url-mock') },
        },
        {
          provide: ReviewsService,
          useValue: {
            getReviewsByUser: jest
              .fn()
              .mockResolvedValue({ averageRating: 0, totalReviews: 0 }),
          },
        },
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
        result.user.roles.filter((r) => r === (RoleName.PROFESSIONAL as string))
          .length,
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

  describe('updateStatus', () => {
    it('deve atualizar o status isOnline com sucesso', async () => {
      const user: Partial<User> = {
        id: 'u1',
        profile: { isOnline: false } as Profile,
      };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.updateStatus('u1', true);

      expect(result.message).toBe('Status atualizado com sucesso');
      expect(result.isOnline).toBe(true);
      expect(user.profile?.isOnline).toBe(true);
      expect(userRepository.save).toHaveBeenCalledTimes(1);
    });

    it('deve lançar NotFoundException se o usuário não for encontrado', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('inexistente', true),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  /**
   * Testes Complementares - Cenários de Sucesso e Erro
   * Objetivo: Aumentar a cobertura do arquivo users.service.ts
   */
  describe('Cenários Adicionais de Cobertura (Sucesso e Erro)', () => {
    describe('createLocalUser', () => {
      it('deve criar um usuário com sucesso (Sucesso)', async () => {
        userRepository.findOne.mockResolvedValue(null);
        rolesService.findByName.mockResolvedValue(makeRole(RoleName.USER));

        const mockUser = { id: 'novo_id', email: 'teste@teste.com' };
        jest
          .spyOn(User, 'createLocal')
          .mockReturnValue(mockUser as unknown as User);
        userRepository.save.mockResolvedValue(mockUser);

        const result = await service.createLocalUser({
          email: 'teste@teste.com',
          password: '123',
          firstName: 'A',
          lastName: 'B',
        });
        expect(result.id).toBe('novo_id');
      });

      it('deve disparar erro se o e-mail já existir (Erro)', async () => {
        userRepository.findOne.mockResolvedValue({ id: 'existente' });
        await expect(
          service.createLocalUser({
            email: 'teste@teste.com',
            password: '123',
            firstName: 'A',
            lastName: 'B',
          }),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('updatePortfolio', () => {
      it('deve atualizar o portfólio (Sucesso)', async () => {
        userRepository.findOne.mockResolvedValue({
          id: 'u1',
          firstName: 'A',
          lastName: 'B',
          profile: {},
        });
        await service.updatePortfolio('u1', { roleTitle: 'Desenvolvedor' });
        expect(userRepository.save).toHaveBeenCalled();
      });

      it('deve disparar erro se o usuário não for achado (Erro)', async () => {
        userRepository.findOne.mockResolvedValue(null);
        await expect(service.updatePortfolio('invalido', {})).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('addPortfolioItem e addCertificate', () => {
      it('deve adicionar um novo item ao portfólio (Sucesso)', async () => {
        userRepository.findOne.mockResolvedValue({ id: 'u1' });
        portfolioItemRepository.create.mockReturnValue({ title: 'Projeto' });
        portfolioItemRepository.save.mockResolvedValue({ id: 'item1' });

        await service.addPortfolioItem('u1', {
          title: 'Projeto',
          description: 'Desc',
          imageUrl: '',
        });
        expect(portfolioItemRepository.save).toHaveBeenCalled();
      });

      it('deve adicionar um novo certificado (Sucesso)', async () => {
        userRepository.findOne.mockResolvedValue({ id: 'u1' });
        certificateRepository.create.mockReturnValue({ title: 'AWS' });
        certificateRepository.save.mockResolvedValue({ id: 'cert1' });

        await service.addCertificate('u1', {
          title: 'AWS',
          description: 'Cloud',
          icon: 'aws',
        });
        expect(certificateRepository.save).toHaveBeenCalled();
      });
    });

    describe('buscarOuCriarSocial', () => {
      it('deve retornar o usuário existente se o email já estiver cadastrado', async () => {
        const mockUser = { id: 'u1', email: 'social@teste.com' };
        userRepository.findOne.mockResolvedValue(mockUser);
        const result = await service.buscarOuCriarSocial({
          email: 'social@teste.com',
          firstName: 'Social',
          lastName: 'Test',
          provider: Provider.GOOGLE,
        });
        expect(result).toEqual(mockUser);
        expect(userRepository.create).not.toHaveBeenCalled();
      });

      it('deve criar um novo usuário se o email não estiver cadastrado', async () => {
        userRepository.findOne.mockResolvedValue(null);
        rolesService.findByName.mockResolvedValue(makeRole(RoleName.USER));
        const mockNewUser = { id: 'u2', email: 'novo@social.com' };
        userRepository.create.mockReturnValue(mockNewUser);
        userRepository.save.mockResolvedValue(mockNewUser);

        const result = await service.buscarOuCriarSocial({
          email: 'novo@social.com',
          firstName: 'Novo',
          lastName: 'Social',
          provider: Provider.GOOGLE,
        });
        expect(result).toEqual(mockNewUser);
        expect(userRepository.create).toHaveBeenCalled();
        expect(userRepository.save).toHaveBeenCalled();
      });
    });

    describe('validateUser', () => {
      it('deve retornar o usuário validado sem a senha se a senha bater', async () => {
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 1);
        const mockUser = {
          id: 'u1',
          email: 'test@test.com',
          password: hashedPassword,
        };
        userRepository.findOne.mockResolvedValue(mockUser);

        const result = await service.validateUser('test@test.com', password);
        expect(result).toEqual({ id: 'u1', email: 'test@test.com' });
        expect(result?.password).toBeUndefined();
      });

      it('deve retornar null se a senha estiver incorreta', async () => {
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 1);
        const mockUser = {
          id: 'u1',
          email: 'test@test.com',
          password: hashedPassword,
        };
        userRepository.findOne.mockResolvedValue(mockUser);

        const result = await service.validateUser(
          'test@test.com',
          'wrongpassword',
        );
        expect(result).toBeNull();
      });

      it('deve retornar null se o usuário não for encontrado', async () => {
        userRepository.findOne.mockResolvedValue(null);
        const result = await service.validateUser(
          'notfound@test.com',
          'password',
        );
        expect(result).toBeNull();
      });
    });

    describe('findById', () => {
      it('deve retornar o usuário se existir', async () => {
        const mockUser = { id: 'u1' };
        userRepository.findOne.mockResolvedValue(mockUser);
        const result = await service.findById('u1');
        expect(result).toEqual(mockUser);
      });

      it('deve lançar NotFoundException se o usuário não for encontrado', async () => {
        userRepository.findOne.mockResolvedValue(null);
        await expect(service.findById('notFound')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('findMe', () => {
      it('deve retornar os dados formatados do usuário logado', async () => {
        const mockUser = { id: 'u1', firstName: 'Test', lastName: 'User' };
        userRepository.findOne.mockResolvedValue(mockUser);
        const result = await service.findMe('u1');
        expect(result.id).toBe('u1');
        expect(result.firstName).toBe('Test');
      });

      it('deve lançar NotFoundException se o usuário não for encontrado', async () => {
        userRepository.findOne.mockResolvedValue(null);
        await expect(service.findMe('notFound')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('getPortfolio', () => {
      it('deve retornar o portfolio do usuário', async () => {
        const mockUser = {
          id: 'u1',
          firstName: 'Prof',
          lastName: 'User',
          profile: {
            bio: 'Dev',
            roleTitle: 'Engineer',
            photoUrl: 'foto.jpg',
            highlights: {},
          },
          certificates: [],
          portfolioItems: [],
        };
        userRepository.findOne.mockResolvedValue(mockUser);
        const result = await service.getPortfolio('u1');
        expect(result.id).toBe('u1');
        expect(result.name).toBe('Prof User');
        expect(result.roleTitle).toBe('Engineer');
      });

      it('deve lançar NotFoundException se o usuário não existir ao buscar portfolio', async () => {
        userRepository.findOne.mockResolvedValue(null);
        await expect(service.getPortfolio('notFound')).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });
});
