import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { ISupplier } from "src/common/interface";
import { Supplier } from '../models';

@Injectable()
export class SupplierRepository extends BaseRepository<ISupplier>{
    constructor(@InjectModel(Supplier.name) protected readonly model : Model<ISupplier>){
        super(model)
    }
}