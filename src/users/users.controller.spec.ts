import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RoleName } from '../roles/enums/role.enum';

/**
 * Testes de Unidade - US02: garante que o controller expõe as rotas de
 * manutenção de perfil e delega corretamente ao serviço.
 */
describe('UsersController - US02', () => {
  let controller: UsersController;

  const usersService = {
    updateProfile: jest.fn(),
    switchRole: jest.fn(),
    findMe: jest.fn(),
  };

  const req = { user: { id: 'u1', email: 'ismael@teste.com' } };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('PATCH /users/profile delega updateProfile (TA02.01)', async () => {
    usersService.updateProfile.mockResolvedValue({ message: 'ok' });

    await controller.update(req, { bio: 'Eletricista' });

    expect(usersService.updateProfile).toHaveBeenCalledWith('u1', {
      bio: 'Eletricista',
    });
  });

  it('PATCH /users/me/role delega switchRole (TA02.02)', async () => {
    usersService.switchRole.mockResolvedValue({ message: 'ok' });

    await controller.switchRole(req, { role: RoleName.PROFESSIONAL });

    expect(usersService.switchRole).toHaveBeenCalledWith(
      'u1',
      RoleName.PROFESSIONAL,
    );
  });
});
