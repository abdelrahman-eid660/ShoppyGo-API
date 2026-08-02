import { Types } from "mongoose"
import { Address, IUser } from "./user.interface"

export interface IWareHouse {
   _id : Types.ObjectId

   name : string
   slug? : string
   coverImage? : string
   code : string
   phone : string[]
   notes? : string

   address : Address

   manager : Types.ObjectId | IUser
   createdBy : Types.ObjectId | IUser
   updatedBy? : Types.ObjectId | IUser

   isActive : boolean
   isMain : boolean

   createdAt : Date
   updatedAt? : Date
}