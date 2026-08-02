import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateIf, ValidateNested } from 'class-validator';
import { CancelReasonEnum, CashReturnMethodEnum, CurrencyEnum, PaymentMethodEnum, RefundResoneEnum, RefundTypeEnum, RejectionReasonEnum } from 'src/common/enum';
import { Type } from 'class-transformer';
import { AddressDTO } from 'src/common/dto';
import type{ Address, IOrderItem } from 'src/common/interface';
import { Types } from 'mongoose';
import { ArgsType, Field, Float, InputType } from '@nestjs/graphql';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  couponCode?: string;
  @IsEnum(CurrencyEnum)
  @IsOptional()
  currency?: CurrencyEnum;
  @IsEnum(PaymentMethodEnum)
  @IsOptional()
  paymentMethod?: PaymentMethodEnum;
  @ValidateNested()
  @Type(() => AddressDTO)
  @IsOptional()
  @IsNotEmpty()
  shippingAddress?: Address;
}

export class CancelDTO {
  @IsEnum(CancelReasonEnum)
  cancelReason! : CancelReasonEnum
  @ValidateIf((c)=> c.cancelReasone === CancelReasonEnum.OTHER)
  @IsString()
  @IsNotEmpty()
  cancelReasonOther? : string
}
export class RefundItemDTO {
  @IsMongoId()
  variantId!: Types.ObjectId;
  @IsNumber()
  @Min(1)
  refundedQuantity!: number;
}
export class RefundOrderRequestDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayUnique()
  @ArrayNotEmpty()
  @Type(() => RefundItemDTO)
  items!: RefundItemDTO[];

  @IsEnum(RefundResoneEnum)
  refundReason!: RefundResoneEnum;

  @ValidateIf((c)=> c.cancelReasone === RefundResoneEnum.OTHER)
  @IsString()
  @IsOptional()
  refundReasonOther?: string;
}
export class RefundDTO {
  @IsEnum(RefundTypeEnum)
  refundType!: RefundTypeEnum
  @IsNumber()
  @Min(1)
  @ValidateIf((r)=> r.refundType === RefundTypeEnum.PARTIAL)
  refundAmount? : number
  @IsEnum(RefundResoneEnum)
  refundReason! : RefundResoneEnum
  @ValidateIf((c)=> c.cancelReasone === RefundResoneEnum.OTHER)
  @IsString()
  @IsNotEmpty()
  refundReasonOther? : string
  @IsEnum(CashReturnMethodEnum)
  @IsOptional()
  cashMethod?: CashReturnMethodEnum;

  @ValidateIf((con => con.refundType === RefundTypeEnum.PARTIAL))
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  refundItems? : IOrderItem[]

  @IsString()
  @IsOptional()
  receiptUrl?: string;
}
export class RejectRefundDTO {
  @IsEnum(RejectionReasonEnum)
  @IsNotEmpty()
  rejectionReason!: RejectionReasonEnum;
  @IsString()
  @IsNotEmpty()
  @ValidateIf((con) => con.rejectionReason === RefundResoneEnum.OTHER)
  rejectReasonOther? : string
}

@InputType()
export class RefundItemInput {
  @Field()
  variantId!: string;

  @Field(() => Number)
  refundedQuantity!: number;
}

@ArgsType()
export class RefundOrderRequestArgs {
  @Field(() => [RefundItemInput])
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayUnique()
  @ArrayNotEmpty()
  @Type(() => RefundItemInput)
  items!: RefundItemInput[];

  @Field(() => RefundResoneEnum)
  @IsEnum(RefundResoneEnum)
  refundReason!: RefundResoneEnum;

  @Field({ nullable: true })
  @ValidateIf((c) => c.refundReason === RefundResoneEnum.OTHER)
  @IsString()
  @IsOptional()
  refundReasonOther?: string;
}

@InputType()
export class OrderItemInput {
  @Field()
  productId!: string;

  @Field(() => Number)
  quantity!: number;
}
@ArgsType()
export class RefundArgs {

  @Field(() => CashReturnMethodEnum, { nullable: true })
  @IsEnum(CashReturnMethodEnum)
  @IsOptional()
  cashMethod?: CashReturnMethodEnum;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  receiptUrl?: string;
}

@ArgsType()
export class RejectRefundArgs {
  @Field(() => RejectionReasonEnum)
  @IsEnum(RejectionReasonEnum)
  @IsNotEmpty()
  rejectionReason!: RejectionReasonEnum;

  @Field({ nullable: true })
  @ValidateIf((c) => c.rejectionReason === RejectionReasonEnum.OTHER)
  @IsString()
  @IsNotEmpty()
  rejectReasonOther?: string;
}