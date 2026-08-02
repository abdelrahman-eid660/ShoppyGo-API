import { IsEnum, IsOptional } from "class-validator";
import { PaginationDTO } from "src/common/dto";
import { ReferenceModelEnum } from "src/common/enum";

export class AllLogsDTO extends PaginationDTO {
    @IsEnum(ReferenceModelEnum)
    @IsOptional()
    referenceModel? : ReferenceModelEnum
}
export class RemoveReferenceDTO {
    @IsEnum(ReferenceModelEnum)
    referenceModel! : ReferenceModelEnum
}