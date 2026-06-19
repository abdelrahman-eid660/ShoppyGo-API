import { Types } from "mongoose";
import { IUser } from "./user.interface";

export interface ICategory {
  name: string;
  slug: string;

  parentId?: Types.ObjectId | ICategory;
  ancestors?: Types.ObjectId[] | ICategory[];

  image?: string;

  createdAt?: Date;
  updatedAt?: Date;

  createdBy: Types.ObjectId | IUser
  updatedBy?: Types.ObjectId | IUser
  
  deletedAt?: Date;
  restoredAt?: Date;
}