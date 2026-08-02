import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationDTO } from "src/common/dto";
import {  InventoryMovementType } from "src/common/enum";

export class GetAllInvMovementDTO extends PaginationDTO {
    @IsString()
    @IsOptional()
    name? : string
    @IsString()
    @IsOptional()
    sku? : string
    @IsEnum(InventoryMovementType)
    @IsOptional()
    type? : InventoryMovementType
}