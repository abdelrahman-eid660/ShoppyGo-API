import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import {Filter} from 'bad-words'
const arabicBadWords = [
    'نصاب' , 'حرامية' , 'غشاشين' , 'كدابين' ,
    'نصابين' , 'حرامية' , 'حراميه' , "كلاب" , "زباله",
    "حيوانات" , "كلاب" , "كدب"
]
const filter = new Filter({placeHolder : "*"})
filter.addWords(...arabicBadWords)

@ValidatorConstraint({name : "IsBadWord" , async : false})
export class CheckBadWord implements ValidatorConstraintInterface {
    validate(value: string, args?: ValidationArguments): boolean {
        if (typeof value !== 'string' || !value.trim()) return false;
        const [extraWords] = args?.constraints || [];
        const allBadWords = [...arabicBadWords, ...(Array.isArray(extraWords) ? extraWords : []),];
        const normalizedValue = value.toLowerCase();
        const hasArabicBadWord = allBadWords.some((word) => normalizedValue.includes(word.toLowerCase()));
        if (hasArabicBadWord) return false;
        return !filter.isProfane(value)
    }
    defaultMessage(args?: ValidationArguments): string {
        return `Field ${args?.property} contains disallowed or inappropriate language!`
    }
}

export function IsBadWord(constraints : string[] = [] , validationOptions? : ValidationOptions){
    return function(object : object , propertyName : string){
        registerDecorator({
            name: 'IsBadWord',
            propertyName : propertyName,
            constraints : [constraints],
            options : validationOptions,
            target : object.constructor,
            validator : CheckBadWord
        })
    }
}