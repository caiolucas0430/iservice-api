import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, CreateLocalUser } from './entities/user.entity';
import { RolesService } from '../roles/roles.service';
import { DadosPerfilSocial } from './entities/user.entity';
import { RoleName } from '../roles/enums/role.enum';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import { Certificate } from './entities/certificate.entity';
import { PortfolioItem } from './entities/portfolio-item.entity';
import { UploadService } from '../upload/upload.service';
import { ReviewsService } from '../reviews/reviews.service';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { CreatePortfolioItemDto } from './dto/create-portfolio-item.dto';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { Job, JobStatus } from '../jobs/entities/job.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Certificate)
    private certificateRepository: Repository<Certificate>,
    @InjectRepository(PortfolioItem)
    private portfolioItemRepository: Repository<PortfolioItem>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    private rolesService: RolesService,
    private uploadService: UploadService,
    private reviewsService: ReviewsService,
  ) {}

  async buscarOuCriarSocial(perfil: DadosPerfilSocial): Promise<User> {
    let usuario = await this.userRepository.findOne({
      where: { email: perfil.email },
      relations: ['roles', 'profile'],
    });

    if (!usuario) {
      const rolePadrao = await this.rolesService.findByName(RoleName.USER);

      usuario = this.userRepository.create({
        email: perfil.email,
        firstName: perfil.firstName,
        lastName: perfil.lastName,
        picture: perfil.picture,
        provider: perfil.provider,
        roles: rolePadrao ? [rolePadrao] : [],
      });
      usuario = await this.userRepository.save(usuario);
    }

    return usuario;
  }

  async createLocalUser(dados: RegisterDto) {
    const usuarioExistente = await this.userRepository.findOne({
      where: { email: dados.email },
    });

    if (usuarioExistente) {
      throw new ConflictException('Este e-mail já está em uso.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dados.password, saltRounds);

    const rolePadrao = await this.rolesService.findByName(RoleName.USER);

    const novoUsuario = User.createLocal(
      dados as CreateLocalUser,
      hashedPassword,
      rolePadrao ? [rolePadrao] : [],
    );

    const usuarioSalvo = await this.userRepository.save(novoUsuario);

    return UserResponseDto.fromEntity(usuarioSalvo);
  }

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'firstName', 'lastName'],
      relations: ['roles'],
    });

    if (user && user.password) {
      const isMatch = await bcrypt.compare(pass, user.password);

      if (isMatch) {
        delete (user as Partial<User>).password;
        return user;
      }
    }

    return null;
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'profile'],
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile', 'roles'],
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (!user.profile) {
      user.profile = new Profile();
    }

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      user.profile.location = {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude],
      };
    }

    Object.assign(user.profile, dto);

    const jaEProfissional = user.roles.some(
      (role) => (role.name as unknown as RoleName) === RoleName.PROFESSIONAL,
    );

    const temBio = !!user.profile.bio;
    const temLocalizacao = !!user.profile.location;

    if (!jaEProfissional && temBio && temLocalizacao) {
      const roleProfissional = await this.rolesService.findByName(
        RoleName.PROFESSIONAL,
      );

      if (roleProfissional) {
        user.roles.push(roleProfissional);
      }
    }

    await this.userRepository.save(user);

    return UserResponseDto.fromEntity(user);
  }

  async findMe(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'profile'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return UserResponseDto.fromEntity(user);
  }

  async getPortfolio(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile', 'certificates', 'portfolioItems', 'roles'],
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    const reviewsStats = await this.reviewsService.getReviewsByUser(id);
    const completedJobsCount = await this.jobRepository.count({
      where: {
        professional: { id },
        status: JobStatus.COMPLETED,
      },
    });

    const highlights = user.profile?.highlights || {};
    highlights.completedJobs = completedJobsCount;

    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      roleTitle: user.profile?.roleTitle || 'Profissional',
      bio: user.profile?.bio || null,
      avatarUrl: user.profile?.photoUrl || user.picture || null,
      coverUrl: user.profile?.coverUrl || null,
      rating: reviewsStats.averageRating,
      reviewsCount: reviewsStats.totalReviews,
      highlights,
      certificates: user.certificates || [],
      portfolioItems: user.portfolioItems || [],
    };
  }

  async updatePortfolio(
    userId: string,
    dto: UpdatePortfolioDto,
    avatarFile?: any,
    coverFile?: any,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (!user.profile) {
      user.profile = new Profile();
    }

    if (avatarFile) {
      const avatarUrl = await this.uploadService.uploadFile(avatarFile);
      user.profile.photoUrl = avatarUrl;
    }

    if (coverFile) {
      const coverUrl = await this.uploadService.uploadFile(coverFile);
      user.profile.coverUrl = coverUrl;
    }

    if (dto.roleTitle !== undefined) user.profile.roleTitle = dto.roleTitle;
    if (dto.bio !== undefined) user.profile.bio = dto.bio;
    if (dto.highlights !== undefined) user.profile.highlights = dto.highlights;

    await this.userRepository.save(user);

    return this.getPortfolio(userId);
  }

  async addPortfolioItem(
    userId: string,
    dto: CreatePortfolioItemDto,
    image?: any,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['portfolioItems'],
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    let imageUrl = dto.imageUrl;
    if (image) {
      imageUrl = await this.uploadService.uploadFile(image);
    }

    const newItem = this.portfolioItemRepository.create({
      title: dto.title,
      description: dto.description,
      imageUrl,
      user,
    });

    await this.portfolioItemRepository.save(newItem);

    return newItem;
  }

  async addCertificate(userId: string, dto: CreateCertificateDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['certificates'],
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    const newCertificate = this.certificateRepository.create({
      title: dto.title,
      description: dto.description,
      icon: dto.icon,
      user,
    });

    await this.certificateRepository.save(newCertificate);

    return newCertificate;
  }
}
