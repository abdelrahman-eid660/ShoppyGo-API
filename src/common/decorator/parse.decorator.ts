import { SetMetadata } from "@nestjs/common"

export const parseName = 'parseName'
export const Parse = (value : boolean = true)=>{
   return SetMetadata(parseName,value)
}