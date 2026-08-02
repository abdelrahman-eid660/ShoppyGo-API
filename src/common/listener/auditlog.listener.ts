import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { AuditlogRepository } from "src/DB/Repository";
import type{ IAuditlog } from "../interface";
import { ClientSession } from "mongoose";

@Injectable()
export class AuditlogListenr{
    private readonly logger = new Logger(AuditlogListenr.name);
    constructor(private readonly auditlogRepository : AuditlogRepository){}
    @OnEvent(`audit-log.create` , {async : true})
    async handleAuditlogEvent(payload : Partial<IAuditlog> & {session? : ClientSession}){
        try{
            await this.auditlogRepository.createOne({data : {
                action : payload.action,
                actorId : payload.actorId,
                isSystem : payload.isSystem,
                metadata : payload.metadata,
                referenceId : payload.referenceId,
                referenceModel : payload.referenceModel
            },options : payload.session ? {session : payload.session} : {}})
        }catch(error : any){
            this.logger.error(`Failed to create audit log for action ${payload.action}`, error.stack);
        }
    }
}