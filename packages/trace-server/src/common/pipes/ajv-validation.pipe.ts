import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { ValidateFunction } from 'ajv';
import { ajv } from '../ajv/ajv.instance';

@Injectable()
export class AjvValidationPipe implements PipeTransform {
  private validateFunction: ValidateFunction;

  constructor(schema: object) {
    this.validateFunction = ajv.compile(schema);
  }

  transform(value: any): any {
    const valid = this.validateFunction(value);

    if (!valid) {
      const error = this.validateFunction.errors?.[0];
      let message = 'Validation failed';

      if (error) {
        const field = error.instancePath.replace('/', '.');
        const fieldName = field || error.params?.additionalProperty || 'unknown';

        switch (error.keyword) {
          case 'required':
            message = `Missing required field: ${error.params.missingProperty}`;
            break;
          case 'minLength':
            message = `Field ${fieldName} must be at least ${error.params.limit} characters`;
            break;
          case 'maxLength':
            message = `Field ${fieldName} exceeds maximum length of ${error.params.limit}`;
            break;
          case 'minimum':
            message = `Field ${fieldName} must be greater than or equal to ${error.params.limit}`;
            break;
          case 'maximum':
            message = `Field ${fieldName} must be less than or equal to ${error.params.limit}`;
            break;
          case 'enum':
            message = `Field ${fieldName} must be one of: ${error.params.allowedValues.join(', ')}`;
            break;
          case 'type':
            message = `Field ${fieldName} must be of type ${error.params.type}`;
            break;
          case 'additionalProperties':
            message = `Unknown field: ${fieldName}`;
            break;
          default:
            message = error.message || message;
        }
      }

      throw new BadRequestException(message);
    }

    return value;
  }
}
