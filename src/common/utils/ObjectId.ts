import { Types } from "mongoose"

export const TransformToObjectId = (id : string) : Types.ObjectId=>{
    return Types.ObjectId.createFromHexString(id)
}