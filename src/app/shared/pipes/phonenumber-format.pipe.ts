import { Pipe, PipeTransform } from '@angular/core';
import {
  PHONE_NUMBER_START_GROUP_1,
  PHONE_NUMBER_START_GROUP_2,
  PHONE_NUMBER_START_GROUP_3,
  PHONE_NUMBER_START_GROUP_4,
  PHONE_PREFIXES
} from '@services/constants';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import {
  ECRMSystem,
  ECountryName
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';

@Pipe({ name: 'phoneNumberFormat' })
export class PhoneNumberFormatPipe implements PipeTransform {
  constructor(private agencyService: AgencyService) {}

  transform(phoneNumber: string): string {
    if (!phoneNumber) {
      return phoneNumber;
    }
    const sanitizedPhoneNumber = this.sanitizePhoneNumber(phoneNumber);
    const market =
      this.agencyService.environment.value === ECRMSystem.RENT_MANAGER
        ? ECountryName.UNITED_STATES
        : ECountryName.AUSTRALIA;
    const reFormattedPhone = sanitizedPhoneNumber.replace(/\D/g, '');
    const isNumber = /^\d+$/.test(sanitizedPhoneNumber);
    const isPhoneAUValid = /^\+61\d+$/.test(sanitizedPhoneNumber);
    const isPhoneUSValid = /^\+1\d+$/.test(sanitizedPhoneNumber);
    let countryCode: string;

    switch (market) {
      case ECountryName.AUSTRALIA:
        countryCode = PHONE_PREFIXES.AU[0];
        if (isPhoneAUValid) {
          let group = this.getPhoneNumberGroup(
            sanitizedPhoneNumber.length,
            reFormattedPhone.slice(2)
          );
          if (group) {
            return `(${countryCode}) ${reFormattedPhone
              .slice(2)
              .replace(group, '$1 $2 $3')}`;
          }
        } else if (sanitizedPhoneNumber.length === 10 && isNumber) {
          if (
            sanitizedPhoneNumber.startsWith('1300') ||
            sanitizedPhoneNumber.startsWith('04') ||
            sanitizedPhoneNumber.startsWith('1800')
          ) {
            return reFormattedPhone.replace(
              PHONE_NUMBER_START_GROUP_4,
              '$1 $2 $3'
            );
          }
          return reFormattedPhone.replace(
            PHONE_NUMBER_START_GROUP_2,
            '$1 $2 $3'
          );
        }
        break;

      case ECountryName.UNITED_STATES:
        countryCode = PHONE_PREFIXES.US[0];
        if (isPhoneUSValid && sanitizedPhoneNumber.length === 12) {
          return `(${countryCode}) ${reFormattedPhone
            .slice(1)
            .replace(PHONE_NUMBER_START_GROUP_3, '($1) $2-$3')}`;
        } else if (sanitizedPhoneNumber.length === 10 && isNumber) {
          return reFormattedPhone.replace(
            PHONE_NUMBER_START_GROUP_3,
            '($1) $2-$3'
          );
        }
        break;
    }

    return sanitizedPhoneNumber;
  }

  getPhoneNumberGroup(length, reFormattedPhone) {
    switch (length) {
      case 12:
        return PHONE_NUMBER_START_GROUP_1;
      case 13:
        if (
          reFormattedPhone.startsWith('1300') ||
          reFormattedPhone.startsWith('04') ||
          reFormattedPhone.startsWith('1800')
        ) {
          return PHONE_NUMBER_START_GROUP_4;
        }
        return PHONE_NUMBER_START_GROUP_2;
      default:
        return '';
    }
  }

  sanitizePhoneNumber(phoneNumber: string) {
    // Remove any non-printable or directional characters
    return phoneNumber.replace(/[\u202A-\u202E\u200E\u200F]/g, '');
  }
}
