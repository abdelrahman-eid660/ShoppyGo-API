import { Types } from "mongoose"

export const conversationKey = ({senderId  , reciverId} : {senderId : string | Types.ObjectId , reciverId : string | Types.ObjectId | undefined})=>{
    return [senderId , reciverId].sort().join("|")
}