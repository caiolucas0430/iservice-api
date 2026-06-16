import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobStatus } from './entities/job.entity';
import { UsersService } from 'src/users/users.service';
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {
  private readonly DEFAULT_SEARCH_RADIUS_METERS = 10000;

  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    private userRepository: UsersService,
  ) {}

  async create(createJobDto: CreateJobDto, userId: string) {
    const user = await this.userRepository.findById(userId);

    const job = this.jobRepository.create({
      description: createJobDto.description,
      location: {
        type: 'Point',
        coordinates: [createJobDto.longitude, createJobDto.latitude],
      },
      client: user,
    });

    return this.jobRepository.save(job);
  }

  async findByClient(userId: string) {
    return this.jobRepository.find({
      where: { client: { id: userId } },
      relations: ['client', 'professional'],
      order: { createdAt: 'DESC' },
    });
  }

  async findNearbyJobs(
    latitude: number,
    longitude: number,
    radius?: string | number,
  ) {
    const radiusInMeters = radius
      ? Number(radius)
      : this.DEFAULT_SEARCH_RADIUS_METERS;

    return this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.client', 'client')
      .where('job.status = :status', { status: JobStatus.SEARCHING })
      .andWhere(
        'ST_DWithin(job.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography, :radius)',
        {
          longitude,
          latitude,
          radius: radiusInMeters,
        },
      )
      .orderBy('job.createdAt', 'DESC')
      .getMany();
  }

  private validateJobStatusForCancellation(status: JobStatus) {
    const invalidStatuses = [JobStatus.COMPLETED, JobStatus.CANCELED];
    if (invalidStatuses.includes(status)) {
      throw new ConflictException(`Cannot cancel a job in ${status} state`);
    }
  }

  private validateJobOwnershipForCancellation(job: Job, userId: string) {
    const isClient = job.client.id === userId;
    const isProfessional = job.professional?.id === userId;

    if (!isClient && !isProfessional) {
      throw new ForbiddenException(
        'You do not have permission to cancel this job',
      );
    }

    return { isClient, isProfessional };
  }

  async cancelJob(jobId: string, userId: string) {
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
      relations: ['client', 'professional'],
    });

    if (!job) throw new NotFoundException('Job not found');

    this.validateJobStatusForCancellation(job.status);
    const { isClient, isProfessional } =
      this.validateJobOwnershipForCancellation(job, userId);

    job.status = isClient ? JobStatus.CANCELED : JobStatus.SEARCHING;
    job.professional = isProfessional ? null : job.professional;

    return this.jobRepository.save(job);
  }
}
