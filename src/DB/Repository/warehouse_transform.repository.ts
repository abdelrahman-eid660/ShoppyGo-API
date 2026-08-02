import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { IWareHouseTransform } from "src/common/interface";
import { WareHouseTransform } from '../models';

@Injectable()
export class WareHouseTransformRepository extends BaseRepository<IWareHouseTransform>{
    constructor(@InjectModel(WareHouseTransform.name) protected readonly model : Model<IWareHouseTransform>){
        super(model)
    }
}