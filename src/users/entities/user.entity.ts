import {
  Column,
  Entity,
  ManyToMany,
  JoinTable,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Role } from '../../roles/entities/role.entity';
import { Profile } from './profile.entity';
import { Job } from '../../jobs/entities/job.entity';
import { Certificate } from './certificate.entity';
import { PortfolioItem } from './portfolio-item.entity';

export enum Provider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

export interface CreateLocalUser {
  email: string;
  firstName: string;
  lastName: string;
}

export interface DadosPerfilSocial {
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  provider: Provider;
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  password?: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  picture?: string;

  @Column({ type: 'enum', enum: Provider, default: Provider.LOCAL })
  provider: Provider;

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'users_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  profile: Profile;

  static createLocal(
    dados: CreateLocalUser,
    hashedPassword: string,
    roles: Role[],
  ): User {
    const user = new User();
    user.email = dados.email;
    user.firstName = dados.firstName;
    user.lastName = dados.lastName;
    user.password = hashedPassword;
    user.provider = Provider.LOCAL;
    user.roles = roles;

    return user;
  }

  @OneToMany(() => Job, (job) => job.client)
  requestedJobs: Job[];

  @OneToMany(() => Job, (job) => job.professional)
  acceptedJobs: Job[];

  @OneToMany(() => Certificate, (certificate) => certificate.user, { cascade: true })
  certificates: Certificate[];

  @OneToMany(() => PortfolioItem, (portfolioItem) => portfolioItem.user, { cascade: true })
  portfolioItems: PortfolioItem[];
}
