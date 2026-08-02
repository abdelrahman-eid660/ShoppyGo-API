import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { ICurrencyRate } from "src/common/interface";
import { CurrencyRate } from '../models';

@Injectable()
export class CurrencyRateRepository extends BaseRepository<ICurrencyRate>{
    constructor(@InjectModel(CurrencyRate.name) protected readonly model : Model<ICurrencyRate>){
        super(model)
    }
}