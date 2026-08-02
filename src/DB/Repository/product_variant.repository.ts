import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { IProductVariant } from "src/common/interface";
import { InjectModel } from "@nestjs/mongoose";
import { ProductVariant } from "../models";
import { Model } from "mongoose";

@Injectable()
export class ProductVariantRepository extends BaseRepository<IProductVariant>{
    constructor(@InjectModel(ProductVariant.name) protected readonly model : Model<IProductVariant>){
        super(model)
    }
}