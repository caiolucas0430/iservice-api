import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let service: jest.Mocked<ReviewsService>;

  const mockReviewsService = {
    createReview: jest.fn(),
    getReviewsByUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: mockReviewsService,
        },
      ],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
    service = module.get(ReviewsService);
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.createReview with correct parameters', async () => {
      const createReviewDto: CreateReviewDto = {
        jobId: 'job-1',
        rating: 5,
        comment: 'Great job',
      };
      const mockReq = { user: { id: 'user-1' } } as any;
      const expectedResult = { id: 'review-1', ...createReviewDto };

      service.createReview.mockResolvedValue(expectedResult as any);

      const result = await controller.create(createReviewDto, mockReq);

      expect(service.createReview).toHaveBeenCalledWith(
        createReviewDto,
        'user-1',
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getReviewsByUser', () => {
    it('should call service.getReviewsByUser with correct user id', async () => {
      const expectedResult = {
        averageRating: 5,
        totalReviews: 1,
        reviews: [],
      };

      service.getReviewsByUser.mockResolvedValue(expectedResult);

      const result = await controller.getReviewsByUser('target-user-id');

      expect(service.getReviewsByUser).toHaveBeenCalledWith('target-user-id');
      expect(result).toEqual(expectedResult);
    });
  });
});
