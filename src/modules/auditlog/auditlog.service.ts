import { AuditlogRepository } from './../../DB/Repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AllLogsDTO, RemoveReferenceDTO } from './dto';
import { IAuditlog, IPagination } from 'src/common/interface';
import { SharedSortEnum, SortEnum } from 'src/common/enum';

@Injectable()
export class AuditlogService {
constructor(private readonly auditlogRepository : AuditlogRepository){}
  async findAll(query : AllLogsDTO):Promise<IPagination<IAuditlog>> {
    const { page = 1 , limit = 4 , sort = SortEnum.NEWEST , referenceModel } = query || {};
    const sortOption = SharedSortEnum[sort] || SharedSortEnum[SortEnum.NEWEST]
    const auditLogs = await this.auditlogRepository.paginate({filter : {...(referenceModel && {referenceModel})} , 
      limit , page , sort : sortOption, options : {populate : [{path : "actorId" , select : "firstName lastName role profileImage email"},{path : "referenceId"}]}})
      return auditLogs;
  }

  async findOne(logId: Types.ObjectId) : Promise<IAuditlog> {
    const auditlog = await this.auditlogRepository.findOne({filter : {_id : logId} , options : {populate : [{path : "actorId" , select : "firstName lastName role profileImage email"},{path : "referenceId"}]}})
    if(!auditlog) throw new NotFoundException(`This audit-log not found`)
    return auditlog
  }

  async removeReferance({referenceModel} : RemoveReferenceDTO):Promise<string> {
    const removeReferance = await this.auditlogRepository.deleteMany({filter : {referenceModel}})
    if(!removeReferance.deletedCount) throw new NotFoundException(`These audit-log of ${referenceModel} not found`)
    return `Audit log deleted successfuly`
  }

  async remove(logId: Types.ObjectId):Promise<string> {
    const auditlog = await this.auditlogRepository.findOneAndDelete({filter : {_id : logId}})
    if(!auditlog) throw new NotFoundException(`This audit-log not found`)
    return `Audit log deleted successfuly`
  }
}
