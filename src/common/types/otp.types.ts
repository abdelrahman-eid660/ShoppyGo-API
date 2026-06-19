import {
  OTPSubjectEnum,
  OTPTitleEnum,
  RedisActionsEnum,
  RedisTypeEnum,
} from '../enum';

// ==================== Types ====================
export type GenerateOtpParams = {
  email: string;
  expiredTime?: number;
  title?: string;
  subject?: (typeof OTPSubjectEnum)[keyof typeof OTPSubjectEnum];
};
export type KeyCheckParams = {
  email: string;
  type?: string | (typeof RedisTypeEnum)[keyof typeof RedisTypeEnum];
  action?: (typeof RedisActionsEnum)[keyof typeof RedisActionsEnum] | undefined;
  blockAction?:
    | (typeof RedisActionsEnum)[keyof typeof RedisActionsEnum]
    | undefined;
};
export type MaxRequestParams = {
  email: string;
  type?: (typeof RedisTypeEnum)[keyof typeof RedisTypeEnum];
  action?: (typeof RedisActionsEnum)[keyof typeof RedisActionsEnum] | undefined;
  blockAction?:
    | (typeof RedisActionsEnum)[keyof typeof RedisActionsEnum]
    | undefined;
  expiredTime?: number;
};
export type VerifyOTPTemplateParams = {
  code: string;
  title?: string;
  expiredTime?: number;
};
export type SendOTPEventPayload = {
  to: string | string[];
  code: string;
  subject?: string;
  title?: string;
  expiredTime?: number;
};
export type VerifyOTP = {
  email: string;
  type: OTPTitleEnum;
  otp: string;
};
