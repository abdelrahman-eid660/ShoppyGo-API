import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { IProductSupplier } from "src/common/interface";
import { ProductSupplier } from '../models';

@Injectable()
export class ProductSupplierRepository extends BaseRepository<IProductSupplier>{
    constructor(@InjectModel(ProductSupplier.name) protected readonly model : Model<IProductSupplier>){
        super(model)
    }
}