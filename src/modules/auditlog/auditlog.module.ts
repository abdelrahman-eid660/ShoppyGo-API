import { Module } from '@nestjs/common';
import { AuditlogService } from './auditlog.service';
import { AuditlogController } from './auditlog.controller';
import { AuditlogListenr } from 'src/common/listener';
import { AuditlogModel } from 'src/DB/models';
import { AuditlogRepository } from 'src/DB/Repository';
import { SharedAuthenticationModule } from 'src/common/modules';

@Module({
  imports : [AuditlogModel , SharedAuthenticationModule],
  controllers: [AuditlogController],
  providers: [AuditlogService , AuditlogRepository , AuditlogListenr],
})
export class AuditlogModule {}
