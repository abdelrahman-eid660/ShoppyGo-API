import { Controller, Get, Param, Query } from '@nestjs/common';
import { FinancialReviewService, IAllFinancialReviews } from './financial-review.service';
import { Auth, PermissionsDecorator } from 'src/common/decorator';
import { PermissionEnum, RoleEnum } from 'src/common/enum';
import { AllReviewsDTO } from '../review/dto';
import { ObjectIdPipe } from 'src/common/pipe';
import { GetFinancialDTO } from './dto';

@Auth({roles : [RoleEnum.SUPERADMIN]})
@PermissionsDecorator(PermissionEnum.FINANCIAL_MANAGE)
@Controller('financial-review')
export class FinancialReviewController {
  constructor(private readonly financialReviewService: FinancialReviewService) {}
  @Get('all-financial-review')
  async findAll(@Query() query : AllReviewsDTO):Promise<IAllFinancialReviews> {
    return await this.financialReviewService.findAll(query);
  }

  @Get(':financialId')
  async findOne(@Param('financialId' , ObjectIdPipe) financialId: GetFinancialDTO) {
    return await this.financialReviewService.findOne(financialId);
  }

}
