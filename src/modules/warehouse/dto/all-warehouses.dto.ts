import { IsBoolean, IsOptional } from "class-validator";
import { PaginationDTO } from "src/common/dto";

export class WareHousePaginationDTO extends PaginationDTO{
    @IsBoolean()
    @IsOptional()
    status : boolean | undefined
}