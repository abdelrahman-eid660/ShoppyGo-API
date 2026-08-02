import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { IInventory } from "src/common/interface";
import { Inventory } from '../models';

@Injectable()
export class InventoryRepository extends BaseRepository<IInventory>{
    constructor(@InjectModel(Inventory.name) protected readonly model : Model<IInventory>){
        super(model)
    }
}