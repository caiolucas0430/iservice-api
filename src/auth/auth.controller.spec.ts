/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            generateJwt: jest.fn(),
            loginGoogleMobile: jest.fn(),
            login: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            createLocalUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleAuth', () => {
    it('should be defined and return void', async () => {
      const result = await controller.googleAuth();
      expect(result).toBeUndefined();
    });
  });

  describe('googleAuthRedirect', () => {
    it('should return JWT token for redirect user', () => {
      const mockUser = { id: 'user-uuid' } as User;
      const expectedResponse = { token: 'jwt-token', user: {} as any };
      jest.spyOn(authService, 'generateJwt').mockReturnValue(expectedResponse);

      const result = controller.googleAuthRedirect({ user: mockUser });
      expect(result).toEqual(expectedResponse);
      expect(authService.generateJwt).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('googleAuthMobile', () => {
    it('should call loginGoogleMobile with the token', async () => {
      const expectedResponse = { token: 'jwt-token', user: {} as any };
      jest
        .spyOn(authService, 'loginGoogleMobile')
        .mockResolvedValue(expectedResponse);

      const result = await controller.googleAuthMobile('google-token');
      expect(result).toEqual(expectedResponse);
      expect(authService.loginGoogleMobile).toHaveBeenCalledWith(
        'google-token',
      );
    });
  });

  describe('register', () => {
    it('should call createLocalUser with RegisterDto', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
      };
      const createdUser = { id: 'new-uuid', email: 'test@example.com' } as any;
      jest
        .spyOn(usersService, 'createLocalUser')
        .mockResolvedValue(createdUser);

      const result = await controller.register(registerDto);
      expect(result).toEqual(createdUser);
      expect(usersService.createLocalUser).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should call login with LoginDto', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };
      const expectedResponse = { token: 'jwt-token', user: {} as any };
      jest.spyOn(authService, 'login').mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto);
      expect(result).toEqual(expectedResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });
});
