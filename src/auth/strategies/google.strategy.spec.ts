/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { GoogleStrategy } from './google.strategy';
import { Profile } from 'passport-google-oauth20';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: UsersService,
          useValue: {
            buscarOuCriarSocial: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'GOOGLE_CLIENT_ID') return 'google-client-id';
              if (key === 'GOOGLE_CLIENT_SECRET') return 'google-client-secret';
              if (key === 'GOOGLE_CALLBACK_URL') return 'google-callback-url';
              return null;
            }),
          },
        },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and call done with user on success', async () => {
    const mockProfile: Partial<Profile> = {
      name: { givenName: 'John', familyName: 'Doe' },
      emails: [{ value: 'john.doe@gmail.com', verified: true }],
      photos: [{ value: 'photo-url' }],
    };

    const mockUser = { id: 'user-id', email: 'john.doe@gmail.com' };
    jest
      .spyOn(usersService, 'buscarOuCriarSocial')
      .mockResolvedValue(mockUser as any);

    const done = jest.fn();
    await strategy.validate(
      'accessToken',
      'refreshToken',
      mockProfile as Profile,
      done,
    );

    expect(usersService.buscarOuCriarSocial).toHaveBeenCalledWith({
      email: 'john.doe@gmail.com',
      firstName: 'John',
      lastName: 'Doe',
      picture: 'photo-url',
      provider: 'google',
    });
    expect(done).toHaveBeenCalledWith(null, mockUser);
  });

  it('should call done with error if user creation fails', async () => {
    const mockProfile: Partial<Profile> = {
      name: { givenName: 'John', familyName: 'Doe' },
      emails: [{ value: 'john.doe@gmail.com', verified: true }],
      photos: [{ value: 'photo-url' }],
    };

    const mockError = new Error('Database error');
    jest
      .spyOn(usersService, 'buscarOuCriarSocial')
      .mockRejectedValue(mockError);

    const done = jest.fn();
    await strategy.validate(
      'accessToken',
      'refreshToken',
      mockProfile as Profile,
      done,
    );

    expect(done).toHaveBeenCalledWith(mockError, false);
  });
});
