import { Field, Float, ID, Int, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";
import type{ IBrand, ICategory, IProduct, IProductAttribute, IProductVariant, IUser } from "src/common/interface";
import { OneBrandResponse } from "src/modules/brand/entity";
import { OneCategoryResponse } from "src/modules/category/entity";
import { OneProductVariantsResponse } from "src/modules/product-variant/entities/product-variant.entity";
import { OneUserResponse } from "src/modules/user/entity";


@ObjectType()
export class OneProductAttributeResponse implements Partial<IProductAttribute>{
    @Field(()=> String , {nullable : true})
    key?: string | undefined;
    @Field(()=> String , {nullable : true})
    label?: string | undefined;
    @Field(()=> String , {nullable : true})
    unit?: string | undefined;
    @Field(()=> String , {nullable : true})
    value?: string | undefined;
}

@ObjectType()
export class OneProductResponse implements Partial<IProduct>{
    @Field(()=> ID,{nullable : true})
    _id! : Types.ObjectId

    @Field(()=> String,{nullable : true})
    title!: string;
    @Field(()=> String , {nullable : true})
    description?: string | undefined;
    @Field(()=>[String] , {nullable : true})
    gallery?: string[] | undefined;
    @Field(()=> String , {nullable : true})
    image?: string | undefined;

    @Field(()=> OneBrandResponse,{nullable : true})
    brandId!: Types.ObjectId | IBrand ;
    @Field(()=> OneCategoryResponse,{nullable : true})
    categoryId!: Types.ObjectId | ICategory;
    @Field(()=> OneUserResponse,{nullable : true})
    createdBy!: Types.ObjectId | IUser ;
    @Field(()=> OneUserResponse , {nullable : true})
    updatedBy?: Types.ObjectId | IUser | undefined;

    @Field(()=> Int , {nullable : true})
    reviewCount?: number | undefined;
    @Field(()=> Float ,{nullable : true})
    basePrice!: number;
    @Field(()=> Int , {nullable : true})
    rating?: number | undefined;

    @Field(()=> [OneProductAttributeResponse] , {nullable : true})
    attributes?: IProductAttribute[] | undefined;

    @Field(()=> String , {nullable : true})
    createdAt?: Date | undefined;
    @Field(()=> String , {nullable : true})
    updatedAt?: Date | undefined;
    @Field(()=> String , {nullable : true})
    deletedAt?: Date | undefined;
    @Field(()=> String , {nullable : true})
    restoredAt?: Date | undefined;

}

@ObjectType()
export class PaginationInfo{
    @Field(()=> Int , {nullable : true})
    currentPage?: number | undefined;
    @Field(()=> Int , {nullable : true})
    limit?: number | undefined;
    @Field(()=> Int , {nullable : true})
    totalDocs?: number | undefined;
    @Field(()=> Int , {nullable : true})
    totalPages?: number | undefined;
    @Field(()=> Boolean , {nullable : true})
    hasNextPage?: boolean | null;
    @Field(()=> Boolean , {nullable : true})
    hasPreviousPage?: boolean | null;
}

@ObjectType()
export class PaginationProductsResponse {
    @Field(()=>[OneProductResponse])
    docs!: IProduct[];
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
export class GetProductResponse{
    @Field(()=> OneProductResponse)
    product! : IProduct
    @Field(()=>[OneProductVariantsResponse])
    variants! : IProductVariant[]
}