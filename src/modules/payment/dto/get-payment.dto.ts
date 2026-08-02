import { IsEnum, IsOptional } from "class-validator";
import { PaginationDTO } from "src/common/dto";
import { PaymentMethodEnum, PaymentStatusEnum } from "src/common/enum";

export class GetAllPaymentsDTO extends PaginationDTO{
    @IsOptional()
    @IsEnum(PaymentStatusEnum)
    status? : PaymentStatusEnum
    @IsOptional()
    @IsEnum(PaymentMethodEnum)
    paymentMethodType? : PaymentMethodEnum
}