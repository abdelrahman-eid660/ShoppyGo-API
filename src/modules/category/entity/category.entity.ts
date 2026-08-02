import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";
import { ICategory, IUser } from "src/common/interface";
import { OneUserResponse } from "src/modules/user/entity";

@ObjectType()
export class OneCategoryResponse implements Partial<ICategory>{
    @Field(()=> ID)
    _id! : Types.ObjectId

    @Field(()=> String)
    name!: string;
    @Field(()=> String , {nullable : true})
    slug?: string | undefined;
    @Field(()=> String , {nullable :true})
    image?: string | undefined;

    @Field(()=> [OneCategoryResponse] , {nullable : true})
    ancestors?: Types.ObjectId[] | ICategory[] | undefined;
    @Field(()=> OneCategoryResponse , {nullable : true})
    parentId?: Types.ObjectId | ICategory | undefined;

    @Field(()=>OneUserResponse)
    createdBy!: IUser | Types.ObjectId;
    @Field(()=>OneUserResponse , {nullable : true})
    updatedBy?: Types.ObjectId | IUser | undefined;

    @Field(()=> String , {nullable : true})
    deletedAt?: Date | undefined;
    @Field(()=> String , {nullable : true})
    restoredAt?: Date | undefined;
    @Field(()=> String , {nullable : true})
    createdAt?: Date | undefined;
    @Field(()=> String , {nullable : true})
    updatedAt?: Date | undefined;
}