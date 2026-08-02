import { ObjectType, Field, Float, ID } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { IInventory, IProductVariant, IUser } from 'src/common/interface';
import { OneProductVariantsResponse } from 'src/modules/product-variant/entities/product-variant.entity';
import { OneUserResponse } from 'src/modules/user/entity';

@ObjectType()
export class OneInventoryResponse implements Partial<IInventory>{
    @Field(()=> ID)
    _id! : Types.ObjectId

    @Field(()=> OneProductVariantsResponse)
    productVariantId!: Types.ObjectId | IProductVariant ;
    @Field(()=> OneUserResponse)
    createdBy!: Types.ObjectId | IUser ;
    @Field(()=> OneUserResponse , {nullable : true})
    updatedBy?: Types.ObjectId | IUser | undefined;

    @Field(()=> Number )
    sold!: number;
    @Field(()=> Float )
    quantity!: number;
    @Field(()=> Float )
    reserved!: number;
    @Field(()=> Float )
    availableQuantity!: number;

    @Field(()=> String , {nullable : true})
    createdAt?: Date | undefined;
    @Field(()=> String , {nullable : true})
    updatedAt?: Date | undefined;
}

