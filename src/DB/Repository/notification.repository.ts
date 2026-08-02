import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { INotification } from "src/common/interface";
import { Notification } from '../models';

@Injectable()
export class NotificationRepository extends BaseRepository<INotification>{
    constructor(@InjectModel(Notification.name) protected readonly model : Model<INotification>){
        super(model)
    }
}