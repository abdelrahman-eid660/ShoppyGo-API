import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { IReview } from "src/common/interface";
import { Review } from '../models';

@Injectable()
export class ReviewRepository extends BaseRepository<IReview>{
    constructor(@InjectModel(Review.name) protected readonly model : Model<IReview>){
        super(model)
    }
}