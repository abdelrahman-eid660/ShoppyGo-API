import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { ICart } from "src/common/interface";
import { Cart } from '../models';

@Injectable()
export class CartRepository extends BaseRepository<ICart>{
    constructor(@InjectModel(Cart.name) protected readonly model : Model<ICart>){
        super(model)
    }
}