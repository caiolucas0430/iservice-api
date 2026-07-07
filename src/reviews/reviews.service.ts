import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { Job, JobStatus } from '../jobs/entities/job.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async createReview(createReviewDto: CreateReviewDto, reviewerId: string) {
    const job = await this.jobRepository.findOne({
      where: { id: createReviewDto.jobId },
      relations: ['client', 'professional'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== JobStatus.COMPLETED) {
      throw new ConflictException('Can only review completed jobs');
    }

    const isClient = job.client.id === reviewerId;
    const isProfessional = job.professional?.id === reviewerId;

    if (!isClient && !isProfessional) {
      throw new ForbiddenException('You are not part of this job');
    }

    const revieweeId = isClient ? job.professional!.id : job.client.id;

    const existingReview = await this.reviewRepository.findOne({
      where: {
        job: { id: job.id },
        reviewer: { id: reviewerId },
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this job');
    }

    const review = this.reviewRepository.create({
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
      job: { id: job.id },
      reviewer: { id: reviewerId },
      reviewee: { id: revieweeId },
    });

    return this.reviewRepository.save(review);
  }

  async getReviewsByUser(userId: string) {
    const reviews = await this.reviewRepository.find({
      where: { reviewee: { id: userId } },
      relations: ['reviewer', 'reviewer.profile'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        reviews: [],
      };
    }

    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = sum / reviews.length;

    return {
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews: reviews.length,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        reviewer: {
          id: r.reviewer.id,
          firstName: r.reviewer.firstName,
          lastName: r.reviewer.lastName,
          picture: r.reviewer.picture,
        },
      })),
    };
  }

  async getRecentReviews() {
    return await this.reviewRepository.find({
      order: {
        createdAt: 'DESC',
      },
      take: 3,
    });
  }
}
