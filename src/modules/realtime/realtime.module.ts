import { Module } from "@nestjs/common";
import { RealtimeGetway } from "./realtime.getway";
import { SharedAuthenticationModule } from "src/common/modules";

@Module({
    imports : [SharedAuthenticationModule],
    providers : [RealtimeGetway]
})
export class RealtimeModule{}