import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { IInventoryMovement } from "src/common/interface";
import { InventoryMovement } from '../models';

@Injectable()
export class InventoryMovementRepository extends BaseRepository<IInventoryMovement>{
    constructor(@InjectModel(InventoryMovement.name) protected readonly model : Model<IInventoryMovement>){
        super(model)
    }
}