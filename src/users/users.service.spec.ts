import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Certificate } from './entities/certificate.entity';
import { PortfolioItem } from './entities/portfolio-item.entity';
import { RolesService } from '../roles/roles.service';
import { UploadService } from '../upload/upload.service';
import { ReviewsService } from '../reviews/reviews.service';
import { Job } from '../jobs/entities/job.entity';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Certificate), useValue: {} },
        { provide: getRepositoryToken(PortfolioItem), useValue: {} },
        { provide: getRepositoryToken(Job), useValue: {} },
        { provide: RolesService, useValue: {} },
        { provide: UploadService, useValue: {} },
        { provide: ReviewsService, useValue: {} },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
