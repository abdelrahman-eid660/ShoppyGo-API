import { Types } from "mongoose";
import { IUser } from "./user.interface";

export interface IMessage {
  _id: Types.ObjectId;

  chatId: Types.ObjectId;

  senderId: Types.ObjectId;
  
  reciverId: Types.ObjectId | Types.ObjectId[];

  content?: string;

  attachments?: {fileName : string , fileType : string , Key : string}[];

  mentions?: Types.ObjectId[] | IUser[];

  seenBy?: Types.ObjectId[] | IUser[];

  deliveredTo?: Types.ObjectId[] | IUser[];

  replyTo?: Types.ObjectId;

  deletedAt?: Date;

  reactsCount?: number;

  restoredAt?: Date;

  createdAt: Date;

  updatedAt?: Date;
}