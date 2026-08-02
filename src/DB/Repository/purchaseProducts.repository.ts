import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { IPurchaseProducts } from "src/common/interface";
import { PurchaseProducts } from '../models';

@Injectable()
export class PurchaseProductsRepository extends BaseRepository<IPurchaseProducts>{
    constructor(@InjectModel(PurchaseProducts.name) protected readonly model : Model<IPurchaseProducts>){
        super(model)
    }
}