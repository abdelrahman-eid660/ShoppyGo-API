import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { IPayment } from "src/common/interface";
import { Payment } from '../models';

@Injectable()
export class PaymentRepository extends BaseRepository<IPayment>{
    constructor(@InjectModel(Payment.name) protected readonly model : Model<IPayment>){
        super(model)
    }
}