import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { Provider, User } from '../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;

  const authService: Pick<
    AuthService,
    'generateJwt' | 'loginGoogleMobile' | 'login'
  > = {
    generateJwt: jest.fn(),
    loginGoogleMobile: jest.fn(),
    login: jest.fn(),
  };

  const usersService: Pick<UsersService, 'createLocalUser'> = {
    createLocalUser: jest.fn(),
  };

  const mockUser = {
    id: '1',
    email: 'teste@email.com',
    firstName: 'João',
    lastName: 'Silva',
    provider: Provider.LOCAL,
    roles: [],
    profile: null,
    requestedJobs: [],
    acceptedJobs: [],
    certificates: [],
    portfolioItems: [],
  } as unknown as User;

  const userResponse: UserResponseDto = {
    id: '1',
    email: 'teste@email.com',
    firstName: 'João',
    lastName: 'Silva',
    roles: [],
    profile: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleAuth', () => {
    it('deve retornar undefined', async () => {
      await expect(controller.googleAuth()).resolves.toBeUndefined();
    });
  });

  describe('googleAuthRedirect', () => {
    it('deve gerar JWT', () => {
      const resultMock = {
        token: 'jwt',
        user: userResponse,
      };

      (authService.generateJwt as jest.Mock).mockReturnValue(resultMock);

      const result = controller.googleAuthRedirect({
        user: mockUser,
      });

      expect(authService.generateJwt).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(resultMock);
    });
  });

  describe('googleAuthMobile', () => {
    it('deve autenticar via Google', async () => {
      const resultMock = {
        token: 'jwt',
        user: userResponse,
      };

      (authService.loginGoogleMobile as jest.Mock).mockResolvedValue(
        resultMock,
      );

      const result = await controller.googleAuthMobile('token');

      expect(authService.loginGoogleMobile).toHaveBeenCalledWith('token');
      expect(result).toEqual(resultMock);
    });
  });

  describe('register', () => {
    it('deve criar usuário local', async () => {
      const dto: RegisterDto = {
        email: 'teste@email.com',
        firstName: 'João',
        lastName: 'Silva',
        password: '123456',
      };

      (usersService.createLocalUser as jest.Mock).mockResolvedValue(mockUser);

      const result = await controller.register(dto);

      expect(usersService.createLocalUser).toHaveBeenCalledWith(dto);
      expect(result).toBe(mockUser);
    });
  });

  describe('login', () => {
    it('deve fazer login', async () => {
      const dto: LoginDto = {
        email: 'teste@email.com',
        password: '123456',
      };

      const resultMock = {
        token: 'jwt',
        user: userResponse,
      };

      (authService.login as jest.Mock).mockResolvedValue(resultMock);

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(resultMock);
    });
  });
});
