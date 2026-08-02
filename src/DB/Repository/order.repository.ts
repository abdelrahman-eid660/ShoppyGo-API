import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { IOrder } from "src/common/interface";
import { InjectModel } from "@nestjs/mongoose";
import { Order } from "../models";
import { Model } from "mongoose";

@Injectable()
export class OrderRepository extends BaseRepository<IOrder>{
    constructor(@InjectModel(Order.name) protected readonly model : Model<IOrder>){
        super(model)
    }
}