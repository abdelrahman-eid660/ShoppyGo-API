import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { IBrand } from "src/common/interface";
import { Brand } from '../models';

@Injectable()
export class BrandRepository extends BaseRepository<IBrand>{
    constructor(@InjectModel(Brand.name) protected readonly model : Model<IBrand>){
        super(model)
    }
}