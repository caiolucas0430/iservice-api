import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Provider } from '../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    generateJwt: jest.fn(),
    loginGoogleMobile: jest.fn(),
    login: jest.fn(),
  };

  const usersService = {
    createLocalUser: jest.fn(),
  };

  const mockUser: any = {
    id: 1,
    email: 'teste@email.com',
    firstName: 'João',
    lastName: 'Silva',
    provider: Provider.LOCAL,
    roles: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleAuth', () => {
    it('deve retornar undefined (fluxo controlado pelo guard)', async () => {
      await expect(controller.googleAuth()).resolves.toBeUndefined();
    });
  });

  describe('googleAuthRedirect', () => {
    it('deve gerar um JWT para o usuário autenticado', () => {
      const retorno = {
        token: 'jwt-token',
        user: mockUser,
      };

      authService.generateJwt.mockReturnValue(retorno);

      const result = controller.googleAuthRedirect({
        user: mockUser,
      });

      expect(authService.generateJwt).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(retorno);
    });
  });

  describe('googleAuthMobile', () => {
    it('deve autenticar utilizando token do Google', async () => {
      const retorno = {
        token: 'jwt-token',
        user: mockUser,
      };

      authService.loginGoogleMobile.mockResolvedValue(retorno);

      const result = await controller.googleAuthMobile('google-token');

      expect(authService.loginGoogleMobile).toHaveBeenCalledWith(
        'google-token',
      );

      expect(result).toEqual(retorno);
    });
  });

  describe('register', () => {
    it('deve registrar um usuário local', async () => {
      const dto = {
        email: 'teste@email.com',
        password: '123456',
        firstName: 'João',
        lastName: 'Silva',
      };

      usersService.createLocalUser.mockResolvedValue(mockUser);

      const result = await controller.register(dto as any);

      expect(usersService.createLocalUser).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('deve realizar login', async () => {
      const dto = {
        email: 'teste@email.com',
        password: '123456',
      };

      const retorno = {
        token: 'jwt-token',
        user: mockUser,
      };

      authService.login.mockResolvedValue(retorno);

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(retorno);
    });
  });
});