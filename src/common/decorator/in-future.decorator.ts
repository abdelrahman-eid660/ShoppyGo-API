import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({async : false , name : "IsFutureDate"})
export class IsFutureDateConstraint implements ValidatorConstraintInterface{
    validate(value: Date, args?: ValidationArguments): boolean {
        if (!(value instanceof Date) || isNaN(value.getTime())) {
            return false;
        }
        return value.getTime() >= Date.now();
    }
    defaultMessage(validationArguments?: ValidationArguments): string {
      return `${validationArguments?.property} cannot be in the past`;
    }
}
export function IsFutureDate(validationOptions? : ValidationOptions){
    return function(object : object , propertyName : string){
        registerDecorator({
            target : object.constructor,
            propertyName,
            options : validationOptions,
            validator : IsFutureDateConstraint
        })
    }
}