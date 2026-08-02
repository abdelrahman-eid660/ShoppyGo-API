import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { ICoupon } from "src/common/interface";
import { Coupon } from '../models';

@Injectable()
export class CouponRepository extends BaseRepository<ICoupon>{
    constructor(@InjectModel(Coupon.name) protected readonly model : Model<ICoupon>){
        super(model)
    }
}