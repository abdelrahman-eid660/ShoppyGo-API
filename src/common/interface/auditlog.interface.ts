import { Types  } from "mongoose";

export interface IAuditLog {
  userId: Types.ObjectId;

  action: string;

  entity: string;

  entityId: string;

  metadata?: Record<string, unknown>;

  createdAt: Date;
}