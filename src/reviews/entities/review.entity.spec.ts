import { Review } from './review.entity';
import { User } from '../../users/entities/user.entity';
import { Job } from '../../jobs/entities/job.entity';

describe('Review Entity', () => {
  it('should be defined and instantiate correctly', () => {
    const review = new Review();
    const reviewer = new User();
    const reviewee = new User();
    const job = new Job();

    expect(review).toBeDefined();

    review.rating = 5;
    review.comment = 'Excellent service';
    review.reviewer = reviewer;
    review.reviewee = reviewee;
    review.job = job;

    expect(review.rating).toBe(5);
    expect(review.comment).toBe('Excellent service');
    expect(review.reviewer).toBe(reviewer);
    expect(review.reviewee).toBe(reviewee);
    expect(review.job).toBe(job);
  });
});
