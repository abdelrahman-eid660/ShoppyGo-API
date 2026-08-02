import Stripe, { Checkout, Coupon, CouponCreateParams, Refund, Response } from 'Stripe';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CurrencyEnum } from '../enum';
import { Request } from 'express';

@Injectable()
export class PaymentService {
  private stripe!: Stripe;
  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') as string
    );
  }
  async chckoutSession({
    customer_email,
    mode,
    success_url,
    cancel_url,
    line_items,
    currency,
    discounts,
    metadata,
    shipping_options,
    expires_at,
  }: Checkout.SessionCreateParams): Promise<Stripe.Checkout.Session> {
    const session = await this.stripe.checkout.sessions.create({
      customer_email,
      mode: mode || 'payment',
      success_url:this.configService.get<string>('SUCCESS_URL'),
      cancel_url: this.configService.get<string>('CANCEL_URL'),
      line_items,
      currency: currency || CurrencyEnum.EGP,
      discounts: discounts || [],
      shipping_options: shipping_options || [],
      metadata,
      expires_at,
    });

    return session;
  }
  async createCoupon(data: CouponCreateParams): Promise<Response<Coupon>> {
    return await this.stripe.coupons.create(data);
  }
  async webhook(req : Request):Promise<Stripe.CheckoutSessionCompletedEvent>{
    const event : Stripe.Event = this.stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'] as string,
        this.configService.get<string>("STRIPE_HOOK_SECRET") as string
    )
    if (event.type === `checkout.session.async_payment_failed`) {
        throw new BadRequestException('Fail to pay')
    }
    if (event.type === `checkout.session.expired`) {
        throw new BadRequestException('Session expired')
    }
    if (event.type !== `checkout.session.completed`) {
        throw new BadRequestException('Fail to paid please try again')
    }
    return event
  }
  async refund(intentId: string , amount? : number): Promise<Response<Refund>> {
    const params: Stripe.RefundCreateParams = { payment_intent: intentId};
    if (amount) {
      params.amount = Math.round(amount * 100);
    }
    return await this.stripe.refunds.create(params);
  }
}
