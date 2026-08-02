import { SetMetadata } from "@nestjs/common"

export const CacheKeyName = "CacheKey"
export const CacheKey = (key : string)=>{
    return SetMetadata(CacheKeyName , key)
}