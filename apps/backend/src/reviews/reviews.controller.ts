import { Controller, Get, Post, Body, Param, Delete, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/review.dto';
import { ReviewsQueryDto } from './dto/reviews-query.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Add a review for an event' })
  async create(@GetUser('id') userId: string, @Body() createReviewDto: CreateReviewDto) {
    const review = await this.reviewsService.create(userId, createReviewDto);
    return { success: true, message: 'Review submitted successfully', data: review };
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get reviews for an event' })
  async findByEvent(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Query() query: ReviewsQueryDto,
  ) {
    const data = await this.reviewsService.findByEvent(eventId, query);
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete a review' })
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string
  ) {
    await this.reviewsService.remove(id, userId, userRole);
    return { success: true, message: 'Review deleted successfully' };
  }
}
