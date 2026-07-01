import { IsString, Matches, MinLength, MaxLength } from 'class-validator';

export class LinkWhatsappDto {
  /**
   * Phone number in international format. May include a leading "+",
   * spaces or dashes; it will be normalized to digits-only on the server.
   * e.g. "+91 98765 43210" -> "919876543210"
   */
  @IsString()
  @MinLength(8)
  @MaxLength(25)
  @Matches(/^[+]?[0-9\s-]+$/, {
    message:
      'phoneNumber must contain only digits, spaces, dashes and an optional leading +',
  })
  phoneNumber: string;
}
