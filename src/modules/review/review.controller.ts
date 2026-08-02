import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ReviewService } from './review.service';
import { AllReviewsDTO, CreateReviewDto, RejectReviewDTO, UpdateReviewDto } from './dto';
import { Auth, User } from 'src/common/decorator';
import { ObjectIdPipe } from 'src/common/pipe';
import { Types } from 'mongoose';
import type{ HUserDocument } from 'src/DB/models';
import { IPagination, IReview } from 'src/common/interface';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Auth({})
  @Post()
  async create(@Body() data: CreateReviewDto , @User() user : HUserDocument) : Promise<IReview> {
    return await this.reviewService.create(data , user);
  }

  @Get('all-reviews')
  async findAll(@Query() query : AllReviewsDTO) : Promise<IPagination<IReview>> {
    return await this.reviewService.findAll(query);
  }

  @Get(':reviewId')
  async findOne(@Param('reviewId' , ObjectIdPipe) reviewId: Types.ObjectId) : Promise<IReview> {
    return await this.reviewService.findOne(reviewId);
  }

  @Auth({})
  @Patch(':reviewId/approve')
  async approve(@Param('reviewId' , ObjectIdPipe) reviewId: Types.ObjectId , @User() user : HUserDocument) : Promise<string> {
    return await this.reviewService.approve(reviewId , user);
  }
  
  @Auth({})
  @Patch(':reviewId/reject')
  async reject(@Param('reviewId' , ObjectIdPipe) reviewId: Types.ObjectId, @Body() data: RejectReviewDTO , @User() user : HUserDocument) : Promise<string> {
    return await this.reviewService.reject(reviewId , user , data);
  }

  @Auth({})
  @Patch(':reviewId/update')
  async update(@Param('reviewId' , ObjectIdPipe) reviewId: Types.ObjectId, @Body() data: UpdateReviewDto , @User() user : HUserDocument) : Promise<IReview> {
    return await  this.reviewService.update(reviewId, data , user);
  }

  @Auth({})
  @Delete(':reviewId/remove')
  async remove(@Param('reviewId' , ObjectIdPipe) reviewId: Types.ObjectId , @User() user : HUserDocument) : Promise<string> {
    return await  this.reviewService.remove(reviewId , user);
  }
}
