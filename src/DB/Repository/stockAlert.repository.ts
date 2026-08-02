import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { IStockAlert } from "src/common/interface";
import { InjectModel } from "@nestjs/mongoose";
import { StockAlert } from "../models";
import { Model } from "mongoose";

@Injectable()
export class StockAlertRepository extends BaseRepository<IStockAlert>{
    constructor(@InjectModel(StockAlert.name) protected readonly model : Model<IStockAlert>){
        super(model)
    }
}