import { Controller, Get, Param, Delete, Query } from '@nestjs/common';
import { AuditlogService } from './auditlog.service';
import { Types } from 'mongoose';
import { ObjectIdPipe } from 'src/common/pipe';
import { Auth, PermissionsDecorator, User } from 'src/common/decorator';
import { AllLogsDTO, RemoveReferenceDTO } from './dto';
import { PermissionEnum, RoleEnum } from 'src/common/enum';
import { IAuditlog, IPagination } from 'src/common/interface';

@Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
@Controller('auditlog')
export class AuditlogController {
  constructor(private readonly auditlogService: AuditlogService) {}
  
  
  @Get('all-audit-logs')
  @PermissionsDecorator(PermissionEnum.AUDIT_LOG_VIEW)
  async findAll(@Query() query  : AllLogsDTO):Promise<IPagination<IAuditlog>> {
    return await this.auditlogService.findAll(query);
  }
  
  @Get(':logId')
  @PermissionsDecorator(PermissionEnum.AUDIT_LOG_VIEW)
  async findOne(@Param('logId' , ObjectIdPipe) logId: Types.ObjectId) : Promise<IAuditlog> {
    return await this.auditlogService.findOne(logId);
  }
  
  @Delete('remove-referance')
  @PermissionsDecorator(PermissionEnum.AUDIT_LOG_REMOVE)
  async removeReferance(@Query() query : RemoveReferenceDTO) : Promise<string> {
    return await this.auditlogService.removeReferance(query);
  }
  
  @Delete('remove/:logId')
  @PermissionsDecorator(PermissionEnum.AUDIT_LOG_REMOVE)
  async remove(@Param('logId' , ObjectIdPipe) logId: Types.ObjectId) : Promise<string> {
    return await this.auditlogService.remove(logId);
  }

}
