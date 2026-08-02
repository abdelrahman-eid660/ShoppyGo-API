import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { IAuditlog } from "src/common/interface";
import { Auditlog } from '../models';

@Injectable()
export class AuditlogRepository extends BaseRepository<IAuditlog>{
    constructor(@InjectModel(Auditlog.name) protected readonly model : Model<IAuditlog>){
        super(model)
    }
}