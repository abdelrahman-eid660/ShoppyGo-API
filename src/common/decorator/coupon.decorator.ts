import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { CouponTypeEnum } from "../enum";

@ValidatorConstraint({async : false , name : "ValidValue"})
export class CouponValidate implements ValidatorConstraintInterface{
    validate(value: number, args: ValidationArguments): boolean {
        if ((args.object as any)['type'] as CouponTypeEnum === CouponTypeEnum.PERCENT && value > 100){
            return false
        }else{
            return true
        }
    }
    defaultMessage(validationArguments?: ValidationArguments): string {
        return `Can't accept value percenteg greater than 100%`
    }
}

export function IsValidCoupon(constraints : string[] = [] , validationOptions? : ValidationOptions){
    return function(object : object , propertyName : string){
        registerDecorator({
            propertyName,
            target : object.constructor,
            options : validationOptions,
            constraints,
            validator : CouponValidate
        })
    }
}