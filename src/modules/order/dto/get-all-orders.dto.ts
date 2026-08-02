import { ArgsType, Field } from "@nestjs/graphql";
import { Transform } from "class-transformer";
import { IsEnum, IsOptional } from "class-validator";
import { PaginationDTO, PaginationGQLDTO } from "src/common/dto";
import { OrderStatusEnum, PaymentMethodEnum, PaymentStatusEnum } from "src/common/enum";

@ArgsType()
export class AllOrdersDTO extends PaginationGQLDTO {
  @Field(() => OrderStatusEnum, { nullable: true })
  @IsOptional()
  @IsEnum(OrderStatusEnum)
  status?: OrderStatusEnum;

  @Field(() => PaymentStatusEnum, { nullable: true })
  @IsOptional()
  @IsEnum(PaymentStatusEnum)
  paymentStatus?: PaymentStatusEnum;

  @Field(() => PaymentMethodEnum, { nullable: true })
  @IsOptional()
  @IsEnum(PaymentMethodEnum)
  paymentMethod?: PaymentMethodEnum;
}