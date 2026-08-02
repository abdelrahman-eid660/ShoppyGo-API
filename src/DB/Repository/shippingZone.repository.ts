import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { IShippingZone } from "src/common/interface";
import { InjectModel } from "@nestjs/mongoose";
import { ShippingZone } from "../models";
import { Model } from "mongoose";

@Injectable()
export class ShippingZoneRepository extends BaseRepository<IShippingZone>{
    constructor(@InjectModel(ShippingZone.name) protected readonly model : Model<IShippingZone>){
        super(model)
    }
}