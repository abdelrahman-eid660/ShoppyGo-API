import { Types } from "mongoose";
import { governorateEnum } from "../enum";
import { IUser } from "./user.interface";

export interface IShippingZone {
  governorate: governorateEnum;
  price: number;
  mainCost : number
  isActive : boolean
  estimatedDays : number
  createdBy : Types.ObjectId | IUser
  updatedBy: Types.ObjectId | IUser
  createdAt : Date
  updatedAt: Date
}