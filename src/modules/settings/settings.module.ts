import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { SharedAuthenticationModule } from 'src/common/modules';
import { SettingsModel } from 'src/DB/models';
import { SettingsRepository } from 'src/DB/Repository';
import { S3Service } from 'src/common/service';
import { MainSettingsService } from 'src/common/service';
import { SettingsServiceModule } from 'src/common/service/settings';

@Module({
  imports : [SharedAuthenticationModule , SettingsModel , SettingsServiceModule],
  controllers: [SettingsController],
  providers: [SettingsService , SettingsRepository , S3Service , MainSettingsService ],
})
export class SettingsModule {}
