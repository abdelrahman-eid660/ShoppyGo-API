import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaginationDTO } from 'src/common/dto';
import { NotificationTypeEnum, ReferenceModelEnum } from 'src/common/enum';

export class AllNotificationsDTO extends PaginationDTO {
  @IsEnum(NotificationTypeEnum)
  @IsOptional()
  type?: NotificationTypeEnum;
  @IsBoolean()
  @IsOptional()
  @Transform(({value})=> {
    if(value === "true") return true
    if(value === "false") return false
    return value
  })
  isRead?: boolean;
  @IsEnum(ReferenceModelEnum)
  @IsOptional()
  referenceModel?: ReferenceModelEnum;
}
