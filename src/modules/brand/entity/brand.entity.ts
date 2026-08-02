import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";
import { IBrand, IUser } from "src/common/interface";
import { OneUserResponse } from "src/modules/user/entity";

@ObjectType()
export class OneBrandResponse implements Partial<IBrand>{
    @Field(()=> ID , {nullable : true})
    _id! : Types.ObjectId

    @Field(()=> String , {nullable : true})
    name!: string;
    @Field(()=> String , {nullable : true})
    logo! : string;
    @Field(()=> String , {nullable : true})
    slug?: string | undefined;

    @Field(()=>OneUserResponse , {nullable : true})
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
