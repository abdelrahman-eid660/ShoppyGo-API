import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
@ValidatorConstraint({ name: 'MatchedBetweenFields', async: false })
export class MatchBetweenFields<
  T = any,
> implements ValidatorConstraintInterface {
  validate(value: T, args?: ValidationArguments): Promise<boolean> | boolean {
    const targetField = (args?.object as any)[args?.constraints[0]];
    return value === targetField;
  }
  defaultMessage(args?: ValidationArguments): string {
    return `${args?.property} must match ${args?.constraints[0]}`;
  }
}
export function IsMatch<T = any>(
  property: string,
  validateOptions?: ValidationOptions
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validateOptions,
      constraints: [property],
      validator: MatchBetweenFields<T>,
    });
  };
}
