import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodType } from 'zod';

@Injectable()
export class CustomeValidationPipe<T = any> implements PipeTransform {
  constructor(private schema: ZodType) {}
  transform(value: T, metadata: ArgumentMetadata) {
    const { success, error } = this.schema.safeParse(value);
    if (!success) {
      throw new BadRequestException({
        message: 'Validation Error',
        cause: {
          issues: error.issues.map((issue) => {
            return { path: issue.path, message: issue.message };
          }),
        },
      });
    }
    return value;
  }
}
