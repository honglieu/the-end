import { EMAIL_PATTERN } from '@services/constants';
import { EUserPropertyType } from '@shared/enum';
import { SUFFIX_INVALID_EMAIL_ID } from '@/app/trudi-send-msg/components/confirm-recipient-modal/send-email-to.service';

export const hasInvalidEmail = (array) => {
  return array?.some(
    (item) =>
      ((item instanceof String || typeof item === 'string') &&
        item?.endsWith(SUFFIX_INVALID_EMAIL_ID)) ||
      (item?.type === EUserPropertyType.UNIDENTIFIED && item?.isInvalid)
  );
};
