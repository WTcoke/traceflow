import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import Ajv, { ValidateFunction } from 'ajv';

const ajv = new Ajv({
  strict: false,
  allErrors: false,
  coerceTypes: true,
  removeAdditional: true,
});

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

        if (error.keyword === 'required') {
          message = `Missing required field: ${error.params.missingProperty}`;
        } else if (error.keyword === 'minLength') {
          message = `Field ${fieldName} must be at least ${error.params.limit} characters`;
        } else if (error.keyword === 'maxLength') {
          message = `Field ${fieldName} exceeds maximum length of ${error.params.limit}`;
        } else if (error.keyword === 'minimum') {
          message = `Field ${fieldName} must be greater than or equal to ${error.params.limit}`;
        } else if (error.keyword === 'maximum') {
          message = `Field ${fieldName} must be less than or equal to ${error.params.limit}`;
        } else if (error.keyword === 'enum') {
          message = `Field ${fieldName} must be one of: ${error.params.allowedValues.join(', ')}`;
        } else if (error.keyword === 'type') {
          message = `Field ${fieldName} must be of type ${error.params.type}`;
        } else if (error.keyword === 'additionalProperties') {
          message = `Unknown field: ${fieldName}`;
        } else {
          message = error.message || message;
        }
      }

      throw new BadRequestException(message);
    }

    return value;
  }
}
