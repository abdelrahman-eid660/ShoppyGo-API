import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { IStockAdjustment } from "src/common/interface";
import { StockAdjustment } from '../models';

@Injectable()
export class StockAdjustmentRepository extends BaseRepository<IStockAdjustment>{
    constructor(@InjectModel(StockAdjustment.name) protected readonly model : Model<IStockAdjustment>){
        super(model)
    }
}