import { Module } from '@nestjs/common';
import { FinancialReviewService } from './financial-review.service';
import { FinancialReviewController } from './financial-review.controller';
import { FinancialReviewModel } from 'src/DB/models';
import { SharedAuthenticationModule } from 'src/common/modules';
import { FinancialReviewRepository } from 'src/DB/Repository';
import { FinancialReviewResolver } from './financial-review.resolver';

@Module({
  imports:[FinancialReviewModel , SharedAuthenticationModule],
  controllers: [FinancialReviewController],
  providers: [FinancialReviewService , FinancialReviewResolver , FinancialReviewRepository],
})
export class FinancialReviewModule {}
