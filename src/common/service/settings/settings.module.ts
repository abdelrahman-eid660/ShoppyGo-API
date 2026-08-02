import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { MainSettingsService } from "./settings.service";

@Module({
    imports : [HttpModule],
    exports : [MainSettingsService , HttpModule],
    providers : [MainSettingsService],
})
export class SettingsServiceModule{}