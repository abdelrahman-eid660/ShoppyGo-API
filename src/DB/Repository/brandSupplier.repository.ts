import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { IBrandSupplier } from "src/common/interface";
import { BrandSupplier } from '../models';

@Injectable()
export class BrandSupplierRepository extends BaseRepository<IBrandSupplier>{
    constructor(@InjectModel(BrandSupplier.name) protected readonly model : Model<IBrandSupplier>){
        super(model)
    }
}