import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Provider } from '../users/entities/user.entity';
import { UserResponseDto } from '../users/dto/user-response.dto';

describe('AuthService', () => {
  let service: AuthService;

  const jwtService = {
    sign: jest.fn(),
  };

  const usersService = {
    validateUser: jest.fn(),
    buscarOuCriarSocial: jest.fn(),
  };

  const mockUser: any = {
    id: 1,
    email: 'teste@email.com',
    firstName: 'João',
    lastName: 'Silva',
    picture: '',
    provider: Provider.LOCAL,
    roles: [
      { id: 1, name: 'ADMIN' },
      { id: 2, name: 'USER' },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateJwt', () => {
    it('deve gerar um token JWT com os dados do usuário', () => {
      jwtService.sign.mockReturnValue('jwt-token');

      const dtoSpy = jest
        .spyOn(UserResponseDto, 'fromEntity')
        .mockReturnValue(mockUser);

      const result = service.generateJwt(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'teste@email.com',
        roles: ['ADMIN', 'USER'],
      });

      expect(dtoSpy).toHaveBeenCalledWith(mockUser);

      expect(result).toEqual({
        token: 'jwt-token',
        user: mockUser,
      });
    });

    it('deve gerar token quando usuário não possui roles', () => {
      jwtService.sign.mockReturnValue('jwt-token');

      const user = {
        ...mockUser,
        roles: undefined,
      };

      jest
        .spyOn(UserResponseDto, 'fromEntity')
        .mockReturnValue(user);

      service.generateJwt(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'teste@email.com',
        roles: [],
      });
    });
  });

  describe('login', () => {
    it('deve retornar token quando login for válido', async () => {
      usersService.validateUser.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('jwt-token');

      jest
        .spyOn(UserResponseDto, 'fromEntity')
        .mockReturnValue(mockUser);

      const result = await service.login({
        email: 'teste@email.com',
        password: '123456',
      });

      expect(usersService.validateUser).toHaveBeenCalledWith(
        'teste@email.com',
        '123456',
      );

      expect(result).toEqual({
        token: 'jwt-token',
        user: mockUser,
      });
    });

    it('deve lançar UnauthorizedException quando usuário for inválido', async () => {
      usersService.validateUser.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'teste@email.com',
          password: 'senha-errada',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(usersService.validateUser).toHaveBeenCalled();
    });
  });

  describe('loginGoogleMobile', () => {
    const verifyIdToken = jest.fn();

    beforeEach(() => {
      (service as any).googleClient = {
        verifyIdToken,
      };
    });

    it('deve autenticar usuário Google com sucesso', async () => {
      verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: 'google@email.com',
          given_name: 'Google',
          family_name: 'User',
          picture: 'foto.png',
        }),
      });

      usersService.buscarOuCriarSocial.mockResolvedValue(mockUser);

      jwtService.sign.mockReturnValue('jwt-token');

      jest
        .spyOn(UserResponseDto, 'fromEntity')
        .mockReturnValue(mockUser);

      const result = await service.loginGoogleMobile('google-token');

      expect(verifyIdToken).toHaveBeenCalledWith({
        idToken: 'google-token',
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      expect(usersService.buscarOuCriarSocial).toHaveBeenCalledWith({
        email: 'google@email.com',
        firstName: 'Google',
        lastName: 'User',
        picture: 'foto.png',
        provider: Provider.GOOGLE,
      });

      expect(result).toEqual({
        token: 'jwt-token',
        user: mockUser,
      });
    });

    it('deve lançar UnauthorizedException quando payload for nulo', async () => {
      verifyIdToken.mockResolvedValue({
        getPayload: () => null,
      });

      await expect(
        service.loginGoogleMobile('token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException quando payload não possuir email', async () => {
      verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          given_name: 'Google',
        }),
      });

      await expect(
        service.loginGoogleMobile('token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve preencher campos vazios quando nomes não forem enviados pelo Google', async () => {
      verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: 'google@email.com',
        }),
      });

      usersService.buscarOuCriarSocial.mockResolvedValue(mockUser);

      jwtService.sign.mockReturnValue('jwt-token');

      jest
        .spyOn(UserResponseDto, 'fromEntity')
        .mockReturnValue(mockUser);

      await service.loginGoogleMobile('token');

      expect(usersService.buscarOuCriarSocial).toHaveBeenCalledWith({
        email: 'google@email.com',
        firstName: '',
        lastName: '',
        picture: '',
        provider: Provider.GOOGLE,
      });
    });
  });
});