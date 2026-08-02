import { Types } from 'mongoose';
import {
  ReferenceModelEnum,
  NotificationTypeEnum,
  PermissionEnum,
  PurchaseProcessStatusEnum,
  RoleEnum,
} from '../enum';

export interface INotification {
  senderId?: Types.ObjectId;
  isSystem?: boolean;
  recipientId: Types.ObjectId;
  title: string;
  body: string | Record<string, any>;
  type: NotificationTypeEnum;
  referenceId: Types.ObjectId;
  referenceModel: ReferenceModelEnum;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPurchaseEventPayload {
  purchaseProductId: Types.ObjectId;
  supplierNameSnapshot: string;
  totalCost?: number;
  status?: PurchaseProcessStatusEnum;
  actorId?: Types.ObjectId;
  receivedBy?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  confirmedBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  cancelledBy?: Types.ObjectId;
  items?: any[];
}
export interface INotificationPayload {
  permission: PermissionEnum;
  title: string;
  body: string;
  referenceId: Types.ObjectId;
  eventName: string;
  payload: Record<string, any>;
  type: NotificationTypeEnum;
  referenceModel: ReferenceModelEnum;
  roles: RoleEnum[];
  recipientId?: Types.ObjectId;
}
export interface IOrderDashboardNotificationPayload {
  permission: PermissionEnum;
  title: string;
  body: string;
  referenceId: Types.ObjectId | string;
  eventName: string;
  payload: any;
}

export interface IUserOrderNotificationPayload {
  userId: string;
  title: string;
  body: string;
  referenceId: Types.ObjectId | string;
  eventName: string;
  payload: any;
}
export interface ISendToUserNotification {
  recipientId: string;
  senderId?: string;
  title: string;
  body: string | Record<string, any>;
  type: NotificationTypeEnum;
  referenceId: string;
  referenceModel: ReferenceModelEnum;
  isSystem?: boolean;
  fcmToken?: string;
}
export interface ISendToRoleNotification {
  role: RoleEnum;
  title: string;
  body: string;
  type: NotificationTypeEnum;
  referenceId: string;
  referenceModel: ReferenceModelEnum;
  recipientsUserIds: string[];
}
export interface ISendToPermissionNotification {
  permission: PermissionEnum;
  title: string;
  body: string;
  type: NotificationTypeEnum;
  referenceId: string;
  referenceModel: ReferenceModelEnum;
  recipientsUserIds: string[];
}
