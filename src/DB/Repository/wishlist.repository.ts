import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { IWishlist } from "src/common/interface";
import { Wishlist } from '../models';

@Injectable()
export class WishlistRepository extends BaseRepository<IWishlist>{
    constructor(@InjectModel(Wishlist.name) protected readonly model : Model<IWishlist>){
        super(model)
    }
}