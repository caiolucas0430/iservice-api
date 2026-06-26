import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Job, JobStatus } from '../jobs/entities/job.entity';
import { Repository } from 'typeorm';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../users/entities/user.entity';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewRepository: jest.Mocked<Repository<Review>>;
  let jobRepository: jest.Mocked<Repository<Job>>;

  const mockClient = { id: 'client-1' } as User;
  const mockProfessional = { id: 'professional-1' } as User;
  const mockJob = {
    id: 'job-1',
    status: JobStatus.COMPLETED,
    client: mockClient,
    professional: mockProfessional,
  } as Job;

  const mockReviewRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockJobRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(Review),
          useValue: mockReviewRepository,
        },
        {
          provide: getRepositoryToken(Job),
          useValue: mockJobRepository,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    reviewRepository = module.get(getRepositoryToken(Review));
    jobRepository = module.get(getRepositoryToken(Job));
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReview', () => {
    const createReviewDto = {
      jobId: 'job-1',
      rating: 5,
      comment: 'Excellent work!',
    };

    it('should successfully create a review as a client', async () => {
      jobRepository.findOne.mockResolvedValue(mockJob);
      reviewRepository.findOne.mockResolvedValue(null);
      reviewRepository.create.mockReturnValue({
        ...createReviewDto,
        id: 'review-1',
      } as any);
      reviewRepository.save.mockResolvedValue({
        ...createReviewDto,
        id: 'review-1',
      } as any);

      const result = await service.createReview(createReviewDto, mockClient.id);

      expect(result).toEqual({ ...createReviewDto, id: 'review-1' });
      expect(reviewRepository.create).toHaveBeenCalledWith({
        rating: 5,
        comment: 'Excellent work!',
        job: { id: mockJob.id },
        reviewer: { id: mockClient.id },
        reviewee: { id: mockProfessional.id },
      });
    });

    it('should successfully create a review as a professional', async () => {
      jobRepository.findOne.mockResolvedValue(mockJob);
      reviewRepository.findOne.mockResolvedValue(null);
      reviewRepository.create.mockReturnValue({
        ...createReviewDto,
        id: 'review-2',
      } as any);
      reviewRepository.save.mockResolvedValue({
        ...createReviewDto,
        id: 'review-2',
      } as any);

      const result = await service.createReview(
        createReviewDto,
        mockProfessional.id,
      );

      expect(result).toEqual({ ...createReviewDto, id: 'review-2' });
      expect(reviewRepository.create).toHaveBeenCalledWith({
        rating: 5,
        comment: 'Excellent work!',
        job: { id: mockJob.id },
        reviewer: { id: mockProfessional.id },
        reviewee: { id: mockClient.id },
      });
    });

    it('should throw NotFoundException if job is not found', async () => {
      jobRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createReview(createReviewDto, mockClient.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if job is not completed', async () => {
      const incompleteJob = { ...mockJob, status: JobStatus.SEARCHING };
      jobRepository.findOne.mockResolvedValue(incompleteJob as any);

      await expect(
        service.createReview(createReviewDto, mockClient.id),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException if user is not part of the job', async () => {
      jobRepository.findOne.mockResolvedValue(mockJob);

      await expect(
        service.createReview(createReviewDto, 'unauthorized-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if review already exists', async () => {
      jobRepository.findOne.mockResolvedValue(mockJob);
      reviewRepository.findOne.mockResolvedValue({ id: 'existing-review' } as any);

      await expect(
        service.createReview(createReviewDto, mockClient.id),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getReviewsByUser', () => {
    it('should return 0 average and empty array if no reviews found', async () => {
      reviewRepository.find.mockResolvedValue([]);

      const result = await service.getReviewsByUser('user-1');

      expect(result).toEqual({
        averageRating: 0,
        totalReviews: 0,
        reviews: [],
      });
    });

    it('should calculate average rating correctly and map reviews', async () => {
      const mockReviews = [
        {
          id: '1',
          rating: 4,
          comment: 'Good',
          createdAt: new Date('2026-01-01'),
          reviewer: {
            id: 'rev-1',
            firstName: 'John',
            lastName: 'Doe',
            picture: 'pic1.jpg',
          },
        },
        {
          id: '2',
          rating: 5,
          comment: 'Great',
          createdAt: new Date('2026-01-02'),
          reviewer: {
            id: 'rev-2',
            firstName: 'Jane',
            lastName: 'Smith',
            picture: 'pic2.jpg',
          },
        },
      ];
      reviewRepository.find.mockResolvedValue(mockReviews as any);

      const result = await service.getReviewsByUser('user-1');

      expect(result.totalReviews).toBe(2);
      expect(result.averageRating).toBe(4.5); // (4+5)/2
      expect(result.reviews).toHaveLength(2);
      expect(result.reviews[0].reviewer.firstName).toBe('John');
    });
  });
});
