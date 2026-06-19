import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { IProduct } from "src/common/interface";
import { InjectModel } from "@nestjs/mongoose";
import { Product } from "../models";
import { Model } from "mongoose";

@Injectable()
export class ProductRepository extends BaseRepository<IProduct>{
    constructor(@InjectModel(Product.name) protected readonly model : Model<IProduct>){
        super(model)
    }
}