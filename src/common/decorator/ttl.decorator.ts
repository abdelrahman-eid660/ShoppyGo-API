import { SetMetadata } from "@nestjs/common"

export const ttlName = "ttlName"
export const TTL = (value : number = 10)=>{
    return SetMetadata(ttlName , value)
}