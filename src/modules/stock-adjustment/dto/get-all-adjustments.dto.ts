import { IsEnum, IsOptional } from "class-validator";
import { PaginationDTO } from "src/common/dto";
import { SharedStatusEnum, StockAdjustmentReasonEnum, StockStatusEnum } from "src/common/enum";

export class GetAllStocksDTO extends PaginationDTO {
    @IsEnum(StockAdjustmentReasonEnum)
    @IsOptional()
    reason? : StockAdjustmentReasonEnum

    @IsEnum(SharedStatusEnum)
    @IsOptional()
    status? : SharedStatusEnum

    @IsEnum(StockStatusEnum)
    @IsOptional()
    stockStatus? : StockStatusEnum
}