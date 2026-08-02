import { ObjectType, Field, Float, ID, Int } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { IBrand, ICategory, IProduct, IProductAttribute, IProductVariant, IUser } from 'src/common/interface';
import { OneBrandResponse } from 'src/modules/brand/entity';
import { OneCategoryResponse } from 'src/modules/category/entity';
import { OneProductAttributeResponse, OneProductResponse, PaginationInfo } from 'src/modules/product/entity/get-all-products';
import { OneUserResponse } from 'src/modules/user/entity';

@ObjectType()
export class PaginationProductVariantsResponse {
    @Field(()=>[OneProductVariantsResponse])
    docs!: IProductVariant[];
    @Field(()=> PaginationInfo)
    pagination!: {
        currentPage?: number | undefined;
        limit: number;
        totalDocs?: number | undefined;
        totalPages?: number | undefined;
        hasNextPage: boolean | null;
        hasPreviousPage: boolean | null;
    };
}

@ObjectType()
export class ProductVariantAttribute {
  @Field(()=>String)
  key! : string
  @Field(()=>String)
  label! : string
  @Field(()=>String)
  value! : string
  @Field(()=>String , {nullable : true})
  unite? : string
}

@ObjectType()
export class OneProductVariantsResponse implements Partial<IProductVariant>{
    @Field(()=> ID, {nullable : true})
    _id! : Types.ObjectId
    @Field(()=> String , {nullable : true})
    slug?: string | undefined;
    @Field(()=> String , {nullable : true})
    sku?: string;
    @Field(()=> String , {nullable : true})
    description?: string | undefined;
    @Field(()=>[String] , {nullable : true})
    images?: string[] | undefined;

    @Field(()=> OneProductResponse , {nullable : true})
    productId!: Types.ObjectId | IProduct ;
    @Field(()=> OneBrandResponse , {nullable : true})
    brandId?: Types.ObjectId | IBrand | undefined;
    @Field(()=> OneCategoryResponse , {nullable : true})
    categoryId?: Types.ObjectId | ICategory | undefined;
    @Field(()=> OneUserResponse , {nullable : true})
    createdBy?: Types.ObjectId | IUser | undefined ;
    @Field(()=> OneUserResponse , {nullable : true})
    updatedBy?: Types.ObjectId | IUser | undefined;

    @Field(()=> Float , {nullable : true} )
    price?: number;

    @Field(()=> [OneProductAttributeResponse] , {nullable : true})
    attributes?: IProductAttribute[] | undefined;

    @Field(()=> Boolean , {nullable : true})
    isPublished?: boolean | undefined;
    @Field(()=> Boolean , {nullable : true})
    isDefualt?: boolean | undefined;

    @Field(()=> String , {nullable : true})
    createdAt?: Date | undefined;
    @Field(()=> String , {nullable : true})
    updatedAt?: Date | undefined;
    @Field(()=> String , {nullable : true})
    deletedAt?: Date | undefined;
    @Field(()=> String , {nullable : true})
    restoredAt?: Date | undefined
    
    @Field(()=> Float , {nullable : true} )
    rating?: number | undefined;
    @Field(()=> Int , {nullable : true} )
    reviewCount?: number | undefined;
    @Field(()=> Int , {nullable : true} )
    stock?: number | undefined;

}

