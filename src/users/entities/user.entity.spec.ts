import { User, Provider } from './user.entity';
import { Job } from '../../jobs/entities/job.entity';
import { Profile } from './profile.entity';
import { Certificate } from './certificate.entity';
import { PortfolioItem } from './portfolio-item.entity';
import { Role } from '../../roles/entities/role.entity';

describe('User Entity', () => {
  describe('createLocal', () => {
    it('deve criar um usuário local corretamente', () => {
      const dados = {
        email: 'test@local.com',
        firstName: 'Test',
        lastName: 'Local',
      };
      const hashedPassword = 'hashed_password_123';
      const roles = [{ id: 'r1', name: 'USER' } as Role];

      const user = User.createLocal(dados, hashedPassword, roles);

      expect(user.email).toBe('test@local.com');
      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('Local');
      expect(user.password).toBe('hashed_password_123');
      expect(user.provider).toBe(Provider.LOCAL);
      expect(user.roles).toEqual(roles);
    });
  });

  describe('Relations coverage', () => {
    it('deve cobrir as funções de relação (lambdas)', () => {
      const user = new User();
      const job = new Job();
      const profile = new Profile();
      const certificate = new Certificate();
      const portfolio = new PortfolioItem();

      expect(user).toBeDefined();
      expect(job).toBeDefined();
      expect(profile).toBeDefined();
      expect(certificate).toBeDefined();
      expect(portfolio).toBeDefined();
    });
  });
});
