import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RoleName } from '../roles/enums/role.enum';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { CreatePortfolioItemDto } from './dto/create-portfolio-item.dto';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { IFile } from '../common/interfaces/file.interface';

/**
 * Testes de Unidade - US02: garante que o controller expõe as rotas de
 * manutenção de perfil e delega corretamente ao serviço.
 */
describe('UsersController', () => {
  let controller: UsersController;

  const usersService = {
    updateProfile: jest.fn(),
    switchRole: jest.fn(),
    findMe: jest.fn(),
    getPortfolio: jest.fn(),
    updatePortfolio: jest.fn(),
    addPortfolioItem: jest.fn(),
    addCertificate: jest.fn(),
    updateStatus: jest.fn(),
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

  describe('US02 - Manter Perfil', () => {
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

    it('PATCH /users/me/status delega updateStatus', async () => {
      usersService.updateStatus.mockResolvedValue({ message: 'ok', isOnline: true });

      await controller.updateStatus(req, { isOnline: true });

      expect(usersService.updateStatus).toHaveBeenCalledWith('u1', true);
    });
  });

  /**
   * Testes de Unidade - US06: garante que o controller expõe as rotas de
   * busca de serviços e gestão de portfólio, delegando corretamente ao serviço.
   * Suporte aos testes de aceitação TA04.01 e TA04.04.
   */
  describe('US06 - Rotas de Radar e Portfólio', () => {
    it('GET /users/me - busca o perfil logado', async () => {
      usersService.findMe.mockResolvedValue({ id: 'u1' });
      await controller.getMe(req);
      expect(usersService.findMe).toHaveBeenCalled();
    });

    it('GET /users/professionals/:id/portfolio - busca portfólio público', async () => {
      usersService.getPortfolio.mockResolvedValue({});
      await controller.getPortfolio('u2');
      expect(usersService.getPortfolio).toHaveBeenCalled();
    });

    it('PATCH /users/me/portfolio - atualiza dados do portfólio', async () => {
      await controller.updatePortfolio(
        req,
        {} as unknown as UpdatePortfolioDto,
        { avatar: [{} as IFile], cover: [{} as IFile] },
      );
      expect(usersService.updatePortfolio).toHaveBeenCalled();
    });

    it('PATCH /users/me/portfolio - atualiza dados do portfólio sem arquivos', async () => {
      await controller.updatePortfolio(
        req,
        {} as unknown as UpdatePortfolioDto,
        {} as unknown as { avatar?: IFile[]; cover?: IFile[] },
      );
      expect(usersService.updatePortfolio).toHaveBeenCalled();
    });

    it('POST /users/me/portfolio/items - adiciona item ao portfólio', async () => {
      await controller.addPortfolioItem(
        req,
        {} as unknown as CreatePortfolioItemDto,
        {} as unknown as IFile,
      );
      expect(usersService.addPortfolioItem).toHaveBeenCalled();
    });

    it('POST /users/me/certificates - adiciona novo certificado', async () => {
      await controller.addCertificate(
        req,
        {} as unknown as CreateCertificateDto,
      );
      expect(usersService.addCertificate).toHaveBeenCalled();
    });
  });
});
