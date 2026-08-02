import { Types } from "mongoose";
import { Address, IUser } from "./user.interface";

export interface ISupplier {
  _id: Types.ObjectId;

  name: string;

  email?: string;
  phone?: string[];

  address?: Address

  isActive: boolean;

  rating?: number;

  createdBy : Types.ObjectId | IUser
  updatedBy : Types.ObjectId | IUser

  createdAt: Date;
  updatedAt: Date;
}