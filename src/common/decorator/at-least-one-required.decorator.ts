/* eslint-disable @typescript-eslint/no-wrapper-object-types */
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function AtLeastOneRequired(
  otherProperty: string,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'atLeastOneRequired',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [otherProperty],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];

          // الشرط: لازم القيمة الحالية أو قيمة الحقل التاني يكونوا موجودين
          // لو الاتنين مش موجودين (فارغين)، الـ validation هيفشل
          const isValuePresent =
            value !== undefined && value !== null && value !== '';
          const isRelatedValuePresent =
            relatedValue !== undefined &&
            relatedValue !== null &&
            relatedValue !== '';

          return isValuePresent || isRelatedValuePresent;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `At least one of the fields [${args.property}] or [${relatedPropertyName}] must be provided.`;
        },
      },
    });
  };
}
