import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: {
    id: string;
    roles: string[];
  };
}

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  create(@Body() createReviewDto: CreateReviewDto, @Req() req: AuthRequest) {
    return this.reviewsService.createReview(createReviewDto, req.user.id);
  }

  @Get('recent')
  getRecentReviews() {
    return this.reviewsService.getRecentReviews();
  }

  @Get('user/:userId')
  getReviewsByUser(@Param('userId') userId: string) {
    return this.reviewsService.getReviewsByUser(userId);
  }
}
