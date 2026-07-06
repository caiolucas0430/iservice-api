import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, Provider } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { Profile } from 'src/users/entities/profile.entity';

// Mock google-auth-library
const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => {
      return {
        verifyIdToken: mockVerifyIdToken,
      };
    }),
  };
});

describe('AuthService', () => {
  let service: AuthService;

  const jwtService = {
    sign: jest.fn().mockReturnValue('token-jwt'),
  } satisfies Partial<JwtService>;

  const usersService: Partial<UsersService> = {
    validateUser: jest.fn(),
    buscarOuCriarSocial: jest.fn(),
  };

  const mockRole: Role = {
    id: '1',
    name: 'ADMIN',
  } as Role;

  const mockProfile = {
    bio: 'bio',
    phoneNumber: '999',
    photoUrl: 'url',
  } satisfies Partial<Profile>;

  const mockUser: Partial<User> = {
    id: '1',
    email: 'teste@email.com',
    firstName: 'João',
    lastName: 'Silva',
    provider: Provider.LOCAL,
    roles: [mockRole],
    profile: mockProfile as Profile,
  };

  const responseDto: UserResponseDto = {
    id: '1',
    email: 'teste@email.com',
    firstName: 'João',
    lastName: 'Silva',
    roles: ['ADMIN'],
    profile: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateJwt', () => {
    it('deve gerar JWT corretamente', () => {
      jwtService.sign.mockReturnValue('token-jwt');

      jest.spyOn(UserResponseDto, 'fromEntity').mockReturnValue(responseDto);

      const result = service.generateJwt(mockUser as User);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: '1',
        email: 'teste@email.com',
        roles: ['ADMIN'],
      });

      expect(result).toEqual({
        token: 'token-jwt',
        user: responseDto,
      });
    });

    it('deve gerar JWT sem roles', () => {
      jwtService.sign.mockReturnValue('token-jwt');

      const userNoRoles: Partial<User> = {
        ...mockUser,
        roles: undefined,
      };

      jest.spyOn(UserResponseDto, 'fromEntity').mockReturnValue(responseDto);

      service.generateJwt(userNoRoles as User);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: '1',
        email: 'teste@email.com',
        roles: [],
      });
    });
  });

  describe('login', () => {
    it('deve autenticar usuário corretamente', async () => {
      (usersService.validateUser as jest.Mock).mockResolvedValue(
        mockUser as User,
      );

      jwtService.sign.mockReturnValue('token-jwt');

      jest.spyOn(UserResponseDto, 'fromEntity').mockReturnValue(responseDto);

      const result = await service.login({
        email: 'teste@email.com',
        password: '123456',
      });

      expect(usersService.validateUser).toHaveBeenCalledWith(
        'teste@email.com',
        '123456',
      );

      expect(result).toEqual({
        token: 'token-jwt',
        user: responseDto,
      });
    });
    it('deve lançar UnauthorizedException se login falhar', async () => {
      (usersService.validateUser as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({
          email: 'teste@email.com',
          password: 'errada',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    describe('loginGoogleMobile', () => {
      const verifyIdToken = jest.fn();

      beforeEach(() => {
        Object.defineProperty(service, 'googleClient', {
          value: {
            verifyIdToken,
          },
        });
      });

      it('deve autenticar via Google com sucesso', async () => {
        verifyIdToken.mockResolvedValue({
          getPayload: () => ({
            email: 'google@email.com',
            given_name: 'Google',
            family_name: 'User',
            picture: 'pic',
          }),
        });

        (usersService.buscarOuCriarSocial as jest.Mock).mockResolvedValue(
          mockUser as User,
        );

        jwtService.sign.mockReturnValue('token-jwt');

        jest.spyOn(UserResponseDto, 'fromEntity').mockReturnValue(responseDto);

        const result = await service.loginGoogleMobile('token-google');

        expect(verifyIdToken).toHaveBeenCalled();
        expect(usersService.buscarOuCriarSocial).toHaveBeenCalledWith({
          email: 'google@email.com',
          firstName: 'Google',
          lastName: 'User',
          picture: 'pic',
          provider: Provider.GOOGLE,
        });

        expect(result).toEqual({
          token: 'token-jwt',
          user: responseDto,
        });
      });

      it('deve lançar erro quando payload for inválido', async () => {
        verifyIdToken.mockResolvedValue({
          getPayload: () => null,
        });

        await expect(service.loginGoogleMobile('token')).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('deve lançar erro quando não houver email', async () => {
        verifyIdToken.mockResolvedValue({
          getPayload: () => ({
            given_name: 'Google',
          }),
        });

        await expect(service.loginGoogleMobile('token')).rejects.toThrow(
          UnauthorizedException,
        );
      });
    });
  });
});
