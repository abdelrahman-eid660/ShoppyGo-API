import { ArgsType, Field, InputType, Int, ID } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsMongoId,
} from 'class-validator';
import { AddressDTO } from 'src/common/dto';
import { CurrencyEnum, PaymentMethodEnum } from 'src/common/enum';
import type { Address, IOrder } from 'src/common/interface';
import { Types } from 'mongoose';
export class CreateOrderDto implements Partial<IOrder> {
  @IsOptional()
  @IsString()
  couponCode?: string;
  @IsEnum(CurrencyEnum)
  currency!: CurrencyEnum;
  @IsEnum(PaymentMethodEnum)
  paymentMethod!: PaymentMethodEnum;
  @ValidateNested()
  @Type(() => AddressDTO)
  shippingAddress!: Address;
}
@InputType()
export class AddressInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  governorate?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  country?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  zone?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  postalCode?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  street?: string;
}

@ArgsType()
export class CreateOrderGQLDTO {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  couponCode?: string;
  @Field(() => CurrencyEnum)
  @IsEnum(CurrencyEnum)
  currency!: CurrencyEnum;
  @Field(() => PaymentMethodEnum)
  @IsEnum(PaymentMethodEnum)
  paymentMethod!: PaymentMethodEnum;
  @Field(() => AddressInput)
  @ValidateNested()
  @Type(() => AddressDTO)
  shippingAddress!: Address;
}

@ArgsType()
export class GetOrderGQLDTO {
  @Field(() => ID)
  @IsMongoId()
  orderId!: Types.ObjectId;
}
