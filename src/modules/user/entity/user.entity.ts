import { Field, ID, ObjectType, registerEnumType } from "@nestjs/graphql";
import { Types } from "mongoose";
import { GenderEnum, LanguageEnum, PermissionEnum, ProviderEnum, RoleEnum } from "src/common/enum";
import { Address, IUser } from "src/common/interface";

registerEnumType(GenderEnum , {name : "Gender"})
registerEnumType(ProviderEnum , {name : "Provider"})
registerEnumType(LanguageEnum , {name : "Language"})
registerEnumType(RoleEnum , {name : "Role"})
registerEnumType(PermissionEnum , {name : "Permissions"})

@ObjectType()
export class OneAddressResponse implements Partial<Address>{
    @Field(()=> String , {nullable : true})
    governorate?: string | undefined;
    @Field(()=> String , {nullable : true})
    country?: string | undefined;
    @Field(()=> String , {nullable : true})
    zone?: string | undefined;
    @Field(()=> Number , {nullable : true})
    postalCode?: number | undefined;
    @Field(()=> String , {nullable : true})
    street?: string | undefined;
}

@ObjectType()
export class OneUserResponse implements Partial<IUser>{
    @Field(()=> ID)
    _id! : Types.ObjectId

    @Field(()=> String , {nullable : true})
    DOB?: Date | undefined;
    @Field(()=> String , {nullable : true})
    email?: string | undefined;
    @Field(()=> String , {nullable : true})
    firstName?: string | undefined;
    @Field(()=> String , {nullable : true})
    lastName?: string | undefined;
    @Field(()=> String , {nullable : true})
    phone?: string | undefined;
    @Field(()=> String , {nullable : true})
    profileImage?: string | undefined;
    @Field(()=> String , {nullable : true})
    userName?: string | undefined
    @Field(()=> OneAddressResponse , {nullable : true})
    address?: Address | undefined;

    @Field(()=> OneUserResponse , {nullable : true})
    createdBy?: IUser | undefined;
    @Field(()=> OneUserResponse , {nullable : true})
    updatedBy?: IUser | undefined;

    @Field(()=>GenderEnum , {nullable : true})
    gender?: GenderEnum | undefined;
    @Field(()=>LanguageEnum , {nullable : true})
    lang?: LanguageEnum | undefined;
    @Field(()=>RoleEnum , {nullable : true})
    role?: RoleEnum | undefined;
    @Field(()=>ProviderEnum , {nullable : true})
    provider?: ProviderEnum | undefined;
    @Field(()=>[PermissionEnum] , {nullable : true})
    permissions?: PermissionEnum[] | undefined;

    @Field(()=> String , {nullable : true})
    createdAt?: Date | undefined;
    @Field(()=> String , {nullable : true})
    updatedAt?: Date | undefined;
    @Field(()=> String , {nullable : true})
    deletedAt?: Date | undefined;
    @Field(()=> String , {nullable : true})
    restoredAt?: Date | undefined;

}