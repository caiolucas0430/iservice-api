import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if the route is public', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const context = {
      getHandler: () => {},
      getClass: () => {},
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should call super.canActivate if the route is not public', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = {
      getHandler: () => {},
      getClass: () => {},
    } as unknown as ExecutionContext;

    const superCanActivateSpy = jest
      .spyOn(AuthGuard('jwt').prototype, 'canActivate')
      .mockImplementation(() => true);

    expect(guard.canActivate(context)).toBe(true);
    expect(superCanActivateSpy).toHaveBeenCalledWith(context);
    superCanActivateSpy.mockRestore();
  });

  describe('handleRequest', () => {
    it('should throw UnauthorizedException if error or user not present', () => {
      expect(() => guard.handleRequest(null, false)).toThrow(
        new UnauthorizedException('Usuário não autenticado.'),
      );
      expect(() => guard.handleRequest(new Error('err'), false)).toThrow(
        new Error('err'),
      );
    });

    it('should return user if present and no error', () => {
      const user = { id: '1', email: 'test@test.com' };
      expect(guard.handleRequest(null, user)).toBe(user);
    });
  });
});
