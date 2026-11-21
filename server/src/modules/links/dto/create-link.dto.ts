import { Transform } from 'class-transformer';
import {
  IsString,
  MaxLength,
  ValidateBy,
  ValidationOptions,
  buildMessage,
} from 'class-validator';
import { MAX_URL_LENGTH, isPublicHttpUrl } from '../url-rules';

function IsPublicHttpUrl(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isPublicHttpUrl',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && isPublicHttpUrl(value),
        defaultMessage: buildMessage(
          (prefix) =>
            `${prefix}$property must be an http(s) URL on a public domain`,
          options,
        ),
      },
    },
    options,
  );
}

export class CreateLinkDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(MAX_URL_LENGTH)
  @IsPublicHttpUrl()
  url!: string;
}
