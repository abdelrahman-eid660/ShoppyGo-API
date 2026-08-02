import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({async : false , name : "CheckGte"})
export class CheckGte implements ValidatorConstraintInterface {
    validate(value: number, args: ValidationArguments){
        return value >= (args.object as any)[args.constraints[0]];
    }
    defaultMessage(validationArguments?: ValidationArguments): string {
        return `Can n't accept ${validationArguments?.property} to be less than ${validationArguments?.constraints[0]}`
    }
}
export function IsGte(constraints : string[] = [] , validationOptions? : ValidationOptions){
return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints,
      validator: CheckGte,
    });
  };
}