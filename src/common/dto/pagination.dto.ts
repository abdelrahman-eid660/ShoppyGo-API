import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Min } from "class-validator";
import { SortEnum } from "src/common/enum";

export class PaginationDTO {
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
}