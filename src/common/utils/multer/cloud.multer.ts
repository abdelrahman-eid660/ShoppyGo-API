/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import type { Request } from "express"
import { diskStorage, memoryStorage } from "multer"
import { randomUUID } from "node:crypto"
import { tmpdir } from "node:os"
import { StorageApproachEnum } from "../../enum"
import { BadRequestException } from "@nestjs/common"
export const CloudMulter= ({
    storageApproach = StorageApproachEnum.MEMORY ,
    validation = [],
    fileSize = 2
    }:{storageApproach? : StorageApproachEnum , validation? :string[] , fileSize? : number})=>{
     return {
        storage : storageApproach == StorageApproachEnum.MEMORY ? memoryStorage() :  diskStorage({
        destination : function(req : Request , file : Express.Multer.File , cb : (error : Error | null , destination : string) => void) {
            cb(null , tmpdir())
        },
        filename : function(req : Request , file : Express.Multer.File , cb : (error : Error | null , filename : string) => void) {
            cb(null , `${randomUUID()}__${file.originalname}`)
        }
        }),
        fileFilter(req : Request , file : Express.Multer.File , cb : Function){
            if (!validation.includes(file.mimetype)) {
                return cb(new BadRequestException("Invalid formate file"))
            }
            return cb(null , true)
        },
        limits : {fileSize : fileSize * 1024 * 1024 }
     }
}