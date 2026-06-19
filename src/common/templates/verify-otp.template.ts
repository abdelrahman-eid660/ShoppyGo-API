import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VerifyOTPTemplateParams } from '../types';

@Injectable()
export class VerifyOTPTemplate {
  private APPLICATION_NAME!: string;
  private FACEBOOK_LINK!: string;
  private INSTAGRAM_LINK!: string;
  private TWITER_LINK!: string;
  constructor(private readonly configService: ConfigService) {
    this.APPLICATION_NAME = this.configService.get<string>(
      'APPLICATION_NAME'
    ) as string;
    this.FACEBOOK_LINK = this.configService.get<string>(
      'FACEBOOK_LINK'
    ) as string;
    this.INSTAGRAM_LINK = this.configService.get<string>(
      'INSTAGRAM_LINK'
    ) as string;
    this.TWITER_LINK = this.configService.get<string>('TWITER_LINK') as string;
  }
  //================ Html template ==============================
  verifyOTPTemplate({
    code,
    title = 'Verify Your Account',
    expiredTime = 10,
  }: VerifyOTPTemplateParams): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title} | ${this.APPLICATION_NAME}</title>
</head>

<body style="margin:0; padding:0; background:#0f172a; font-family:Arial,sans-serif;">

<!-- Background -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a; padding:40px 10px;">
<tr>
<td align="center">

<!-- Container -->
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:16px; overflow:hidden;">

<!-- HEADER -->
<tr>
<td style="background:linear-gradient(135deg,#4f46e5,#7c3aed); padding:30px; text-align:center; color:#fff;">
  <div style="font-size:26px; font-weight:bold;">🛒 ${this.APPLICATION_NAME}</div>
  <div style="margin-top:8px; font-size:14px; opacity:0.9;">${title}</div>
</td>
</tr>

<!-- BODY -->
<tr>
<td style="padding:40px 30px; text-align:center;">

<h2 style="margin:0; color:#111827;">Verify Your Email</h2>

<p style="color:#6b7280; font-size:14px; margin-top:10px;">
Use this OTP code to continue your request
</p>

<!-- OTP BOX -->
<div style="
  margin:30px auto;
  display:inline-block;
  background:#f3f4f6;
  padding:18px 30px;
  font-size:32px;
  letter-spacing:10px;
  font-weight:bold;
  color:#111827;
  border-radius:12px;
  border:1px dashed #c7c7c7;
">
  ${code}
</div>

<p style="font-size:13px; color:#6b7280;">
This code expires in <b style="color:#4f46e5;">${expiredTime} minutes</b>
</p>

<!-- BUTTON -->
<a href="#"
   style="
    display:inline-block;
    margin-top:20px;
    padding:12px 28px;
    background:#4f46e5;
    color:#ffffff;
    text-decoration:none;
    border-radius:8px;
    font-weight:bold;
   ">
  Go to ${this.APPLICATION_NAME}
</a>

<!-- WARNING -->
<p style="margin-top:25px; font-size:12px; color:#9ca3af;">
If you didn't request this email, you can safely ignore it.
</p>

<!-- SOCIAL -->
<div style="margin-top:35px;">
  <p style="font-size:12px; color:#9ca3af;">Follow us</p>

  <a href="https://www.facebook.com/abd.diesel.2025/" target="_blank" style="margin:0 6px;">
    <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" width="28"/>
  </a>

  <a href="${this.INSTAGRAM_LINK}" target="_blank" style="margin:0 6px;">
    <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" width="28"/>
  </a>

  <a href="${this.TWITER_LINK}" target="_blank" style="margin:0 6px;">
    <img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" width="28"/>
  </a>
</div>

</td>
</tr>

<!-- FOOTER -->
<tr>
<td style="background:#f9fafb; text-align:center; padding:20px; font-size:11px; color:#6b7280;">
  © ${new Date().getFullYear()} ${this.APPLICATION_NAME} • All rights reserved
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;
  }
}
