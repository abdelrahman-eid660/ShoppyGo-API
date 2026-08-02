import { IsEnum, IsOptional } from "class-validator";
import { PaginationDTO } from "src/common/dto";
import { SharedStatusEnum } from "src/common/enum";

export class PaginationWareHouseTransformDTO extends PaginationDTO{
    @IsEnum(SharedStatusEnum)
    @IsOptional()
    status? : SharedStatusEnum
}