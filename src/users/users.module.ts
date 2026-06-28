import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { RolesModule } from '../roles/roles.module';
import { Profile } from './entities/profile.entity';
import { Certificate } from './entities/certificate.entity';
import { PortfolioItem } from './entities/portfolio-item.entity';
import { UploadModule } from '../upload/upload.module';
import { ReviewsModule } from '../reviews/reviews.module';

import { Job } from '../jobs/entities/job.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile, Certificate, PortfolioItem, Job]),
    RolesModule,
    UploadModule,
    ReviewsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
