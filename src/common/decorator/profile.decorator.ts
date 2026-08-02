import { SetMetadata } from "@nestjs/common"

export const profileName = "profileCache"
export const Profile = (value : boolean = false)=>{
    return SetMetadata(profileName,value)
}