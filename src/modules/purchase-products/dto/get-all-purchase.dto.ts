import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDTO } from "src/common/dto";
import {  PurchaseProcessStatusEnum } from 'src/common/enum';

export class AllPurchaseProcess extends PaginationDTO{
    @IsEnum(PurchaseProcessStatusEnum)
    @IsOptional()
    status?: PurchaseProcessStatusEnum | undefined;
}