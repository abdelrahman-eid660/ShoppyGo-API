import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { ISettings } from "src/common/interface";
import { InjectModel } from "@nestjs/mongoose";
import { Settings } from "../models";
import { Model } from "mongoose";

@Injectable()
export class SettingsRepository extends BaseRepository<ISettings>{
    constructor(@InjectModel(Settings.name) protected readonly model : Model<ISettings>){
        super(model)
    }
}