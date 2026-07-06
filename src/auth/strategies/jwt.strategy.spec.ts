import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { RoleName } from '../../roles/enums/role.enum';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return user details from payload', () => {
    const payload = {
      sub: 123,
      email: 'test@example.com',
      roles: [RoleName.USER],
    };

    const result = strategy.validate(payload);
    expect(result).toEqual({
      id: 123,
      email: 'test@example.com',
      roles: [RoleName.USER],
    });
  });
});
