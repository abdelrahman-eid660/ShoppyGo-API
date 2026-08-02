import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { SortEnum } from "src/common/enum";

export class InventroyPaginationDTO {
@IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit? : number;

    @IsOptional()
    @IsEnum(SortEnum)
    sort?: SortEnum;

    @IsOptional()
    @IsString()
    productTitleSnapshot?: string;

    @IsOptional()
    @IsString()
    skuSnapshot?: string;
}