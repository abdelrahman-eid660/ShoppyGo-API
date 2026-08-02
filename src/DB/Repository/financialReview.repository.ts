import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { IFinancialReview } from "src/common/interface";
import { FinancialReview } from '../models';

@Injectable()
export class FinancialReviewRepository extends BaseRepository<IFinancialReview>{
    constructor(@InjectModel(FinancialReview.name) protected readonly model : Model<IFinancialReview>){
        super(model)
    }
}