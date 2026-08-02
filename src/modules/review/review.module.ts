import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { ProductModel, ReviewModel } from 'src/DB/models';
import { SharedAuthenticationModule } from 'src/common/modules';
import { ProductRepository, ReviewRepository } from 'src/DB/Repository';
import { ReviewsListener } from 'src/common/listener';

@Module({
  imports : [ReviewModel , SharedAuthenticationModule , ProductModel ],
  controllers: [ReviewController],
  providers: [ReviewService , ReviewRepository , ReviewsListener , ProductRepository ],
})
export class ReviewModule {}
