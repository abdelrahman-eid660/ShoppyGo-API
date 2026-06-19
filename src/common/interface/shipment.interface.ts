import { Types } from "mongoose";
import { ShipmentStatusEnum } from "../enum";

export interface IShipment {
  _id: Types.ObjectId;

  orderId: Types.ObjectId;

  trackingNumber: string;

  carrier: string;

  status: ShipmentStatusEnum;

  shippedAt?: Date;

  deliveredAt?: Date;
}