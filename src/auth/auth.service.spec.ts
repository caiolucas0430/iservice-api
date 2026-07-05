/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import { User, Provider } from '../users/entities/user.entity';

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
  let jwtService: JwtService;
  let usersService: UsersService;

  beforeEach(async () => {
    mockVerifyIdToken.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('signed-token'),
          },
        },
        {
          provide: UsersService,
          useValue: {
            validateUser: jest.fn(),
            buscarOuCriarSocial: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateJwt', () => {
    it('should generate JWT for a user with roles', () => {
      const user = {
        id: 'user-uuid',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: [{ name: 'USER' }],
      } as unknown as User;

      const result = service.generateJwt(user);
      expect(result).toEqual({
        token: 'signed-token',
        user: expect.objectContaining({
          id: 'user-uuid',
          email: 'test@example.com',
        }),
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-uuid',
        email: 'test@example.com',
        roles: ['USER'],
      });
    });

    it('should generate JWT for a user without roles', () => {
      const user = {
        id: 'user-uuid',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: null,
      } as unknown as User;

      const result = service.generateJwt(user);
      expect(result.token).toBe('signed-token');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-uuid',
        email: 'test@example.com',
        roles: [],
      });
    });
  });

  describe('login', () => {
    it('should return token and user if credentials are valid', async () => {
      const user = {
        id: 'user-uuid',
        email: 'test@example.com',
        roles: [],
      } as unknown as User;

      jest.spyOn(usersService, 'validateUser').mockResolvedValue(user);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result.token).toBe('signed-token');
      expect(usersService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password',
      );
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      jest.spyOn(usersService, 'validateUser').mockResolvedValue(null);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(new UnauthorizedException('E-mail ou senha inválidos'));
    });
  });

  describe('loginGoogleMobile', () => {
    it('should successfully login/register with google token', async () => {
      const ticketMock = {
        getPayload: () => ({
          email: 'google@example.com',
          given_name: 'Google',
          family_name: 'User',
          picture: 'photo-url',
        }),
      };
      mockVerifyIdToken.mockResolvedValue(ticketMock);

      const userMock = {
        id: 'google-user-uuid',
        email: 'google@example.com',
        provider: Provider.GOOGLE,
      } as unknown as User;
      jest
        .spyOn(usersService, 'buscarOuCriarSocial')
        .mockResolvedValue(userMock);

      const result = await service.loginGoogleMobile('google-token');
      expect(result.token).toBe('signed-token');
      expect(usersService.buscarOuCriarSocial).toHaveBeenCalledWith({
        email: 'google@example.com',
        firstName: 'Google',
        lastName: 'User',
        picture: 'photo-url',
        provider: Provider.GOOGLE,
      });
    });

    it('should throw UnauthorizedException if ticket payload or email is missing', async () => {
      const ticketMock = {
        getPayload: () => null,
      };
      mockVerifyIdToken.mockResolvedValue(ticketMock);

      await expect(service.loginGoogleMobile('invalid-token')).rejects.toThrow(
        new UnauthorizedException(
          'Token do Google inválido ou sem e-mail associado',
        ),
      );
    });
  });
});
