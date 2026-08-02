import { Types  } from "mongoose";
import { LogActionEnum, ReferenceModelEnum } from "../enum";

export interface IAuditlog {
  actorId?: Types.ObjectId | string;

  isSystem? : boolean

  action: LogActionEnum;

  referenceModel: ReferenceModelEnum;

  referenceId: Types.ObjectId;

  metadata?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}