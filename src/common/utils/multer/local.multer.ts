import { IFile } from './../../interface';
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { diskStorage } from "multer"
import type{  Request } from "express"
import { randomUUID } from "node:crypto"
import { BadRequestException } from "@nestjs/common"
import { resolve } from "node:path"
import { existsSync, mkdirSync } from "node:fs"
export const localMulter = ({validation = [] ,folder = "publice" ,fileSize = 5}:{fileSize? : number , folder? : string , validation : string[]})=>{
    return {
        storage : diskStorage({
            destination(req : Request , file : Express.Multer.File , cb : Function){
                const fullPath = resolve(`./uploads/${folder}`)
                if (!existsSync(fullPath)) {
                    mkdirSync(fullPath , {recursive : true})
                }
                return cb(null , fullPath)},
            filename(req : Request , file : IFile , cb : Function){
                const uniqueFileName = randomUUID()+"_"+req.file?.originalname
                file.finalPath = `uploads/${folder}`
                return cb(null , uniqueFileName)
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