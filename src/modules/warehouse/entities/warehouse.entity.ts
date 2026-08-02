import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import type{ Address, IUser, IWareHouse } from 'src/common/interface';
import { OneAddressResponse, OneUserResponse } from 'src/modules/user/entity';

@ObjectType()
export class OneWarehouseResponse implements Partial<IWareHouse> {
  @Field(() => ID, { nullable: true })
  _id?: Types.ObjectId;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  slug?: string;

  @Field(() => String, { nullable: true })
  coverImage?: string;

  @Field(() => String, { nullable: true })
  code?: string;

  @Field(() => [String], { nullable: true })
  phone?: string[];

  @Field(() => String, { nullable: true })
  notes?: string;

  @Field(() => OneAddressResponse, { nullable: true })
  address?: Address;

  @Field(() => OneUserResponse, { nullable: true })
  manager?: Types.ObjectId | IUser;

  @Field(() => OneUserResponse, { nullable: true })
  createdBy?: Types.ObjectId | IUser;

  @Field(() => OneUserResponse, { nullable: true })
  updatedBy?: Types.ObjectId | IUser;

  @Field(() => Boolean, { nullable: true })
  isActive?: boolean;

  @Field(() => Boolean, { nullable: true })
  isMain?: boolean;

  @Field(() => String, { nullable: true })
  createdAt?: Date;

  @Field(() => String, { nullable: true })
  updatedAt?: Date;
}