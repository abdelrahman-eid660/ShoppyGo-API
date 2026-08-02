import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { IWareHouse } from "src/common/interface";
import { WareHouse } from '../models';

@Injectable()
export class WareHouseRepository extends BaseRepository<IWareHouse>{
    constructor(@InjectModel(WareHouse.name) protected readonly model : Model<IWareHouse>){
        super(model)
    }
}