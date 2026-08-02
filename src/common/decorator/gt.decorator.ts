import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({async : false , name : "CheckGt"})
export class ChcekGt<T = any> implements ValidatorConstraintInterface {
    validate(value: Date, args: ValidationArguments): boolean {
        return new Date(value).getTime() > new Date((args.object as any)[args.constraints[0]]).getTime()
    }
    defaultMessage(validationArguments?: ValidationArguments): string {
        return `End date must to be greater than start date ${validationArguments?.property}`
    }
}
export function IsGt(constraints : string[] = [] , validationOptions? : ValidationOptions){
    return function(object : object , propertyName : string){
        registerDecorator({
            target : object.constructor,
            propertyName,
            options : validationOptions,
            constraints,
            validator: ChcekGt
        })
    }
}