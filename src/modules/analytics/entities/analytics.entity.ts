import {
  ObjectType,
  Field,
  Int,
  ID,
  Float,
  GraphQLISODateTime,
} from '@nestjs/graphql';
import { Types } from 'mongoose';

@ObjectType()
export class GetProductsBySalesResponse {
  @Field(() => ID)
  _id!: Types.ObjectId;
  @Field(() => ID)
  variantId!: Types.ObjectId;
  @Field(() => Number)
  totalQuantitySold!: number;
  @Field(() => Float)
  totalRevenue!: number;
  @Field(() => String)
  skuSnapshot!: string;
  @Field(() => String, { nullable: true })
  imageSnapshot?: string | undefined;
  @Field(() => Float)
  currentPrice!: number;
}

@ObjectType()
export class GetZeroSalesProductsResponse {
  @Field(() => ID)
  _id!: Types.ObjectId;
  @Field(() => String)
  sku!: string;
  @Field(() => Float)
  price!: number;
  @Field(() => Int)
  totalQuantitySold!: number;
}

@ObjectType()
export class GetCustomersByActivityResponse {
  @Field(() => ID)
  userId!: Types.ObjectId;
  @Field(() => Int)
  totalOrdersCount!: number;
  @Field(() => Int)
  totalSpent!: number;
  @Field(() => GraphQLISODateTime)
  lastOrderDate!: Date;
  @Field(() => String)
  firstName!: string;
  @Field(() => String)
  lastName!: string;
  @Field(() => String)
  email!: string;
  @Field(() => String)
  phone!: string;
}

@ObjectType()
export class getUsersWithZeroOrdersResponse {
  @Field(() => ID)
  _id!: Types.ObjectId;
  @Field(() => String)
  firstName!: string;
  @Field(() => String)
  lastName!: string;
  @Field(() => String)
  email!: string;
  @Field(() => String)
  phone!: string;
  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}

@ObjectType()
export class GetSalesOverviewMetricsResponse {
  @Field(() => Int)
  monthlyOrdersCount!: number;
  @Field(() => Float)
  monthlyRevenue!: number;
  @Field(() => Int)
  todayOrdersCount!: number;
  @Field(() => Float)
  todayRevenue!: number;
  @Field(() => Float)
  monthlyAOV!: number;
}

@ObjectType()
export class GetCategoriesDemandMetricsResponse {
  @Field(()=> ID)
  categoryId!: Types.ObjectId;
  @Field(()=> String)
  name!: string;
  @Field(()=> String)
  image!: string;
  @Field(() => Int)
  quantitySold!: number;
  @Field(() => Float)
  revenue!: number;
}
@ObjectType()
export class GetBrandsDemandMetricsResponse {
  @Field(()=> ID)
  brandId!: Types.ObjectId;
  @Field(()=> String)
  name!: string;
  @Field(()=> String)
  image!: string;
  @Field(() => Int)
  quantitySold!: number;
  @Field(() => Float)
  revenue!: number;
}
