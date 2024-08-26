import { EOptionType, EUserPropertyType } from '@shared/enum';
import { EFallback } from './dynamic-parameter';
import { ISelectedReceivers } from './trudi-send-msg.interface';
import { convertUserRole } from './helper-functions';

export const isSupplierOrOtherContact = (type): boolean =>
  [EUserPropertyType.SUPPLIER, EUserPropertyType.OTHER].includes(type);

export const isDynamicParameterFallback = (item): boolean =>
  [EFallback.UNKNOWN, EFallback.UNAVAILABLE].includes(item);

export const getEmailRecipient = (receiver: ISelectedReceivers): string =>
  receiver?.name ||
  receiver?.originalEmailName ||
  receiver?.secondaryEmail?.originalEmailName ||
  receiver?.firstName;

export const formatListNamesDisplay = (names): string =>
  names &&
  (!Array.isArray(names) || (Array.isArray(names) && names.length === 1))
    ? names.join('')
    : names.slice(0, names.length - 1).join(', ') +
      ' and ' +
      names.slice(-1)[0];

export const mapReceiversForInsertDynamicRecipientVar = (
  participants: ISelectedReceivers[],
  isSamePropertyFn: (propertyId) => boolean,
  callback
) =>
  participants?.map((item) => {
    const isSamePropertyOrSupplierOrOtherContact =
      isSamePropertyFn(item.propertyId) ||
      isSupplierOrOtherContact(
        item?.userPropertyType || item?.type || item?.userType
      );
    return callback(item, isSamePropertyOrSupplierOrOtherContact);
  });

export const replaceSingleQuotes = (string: string) => {
  return string.replace(/'/g, '"');
};

// Same property + Supplier/ Other contact -> show all (name, role)
// First name + full name: belong to other contact -> show original email name
// First name + full name (create from scratch): external email -> show fallback
// Role: external email + belong to other contact -> show fallback
export const getTextFromDynamicRecipientVariable = (
  recipients = [],
  propertyId
) => {
  const isSameProperty = (inputPropertyId): boolean => {
    return inputPropertyId === propertyId;
  };
  const firstNames = mapReceiversForInsertDynamicRecipientVar(
    recipients,
    isSameProperty,
    (item, isSamePropertyIdOrSupplierOrOtherContact) =>
      isSamePropertyIdOrSupplierOrOtherContact
        ? item?.firstName || EFallback.UNKNOWN
        : getEmailRecipient(item) || EFallback.UNKNOWN
  );
  const fullNames = mapReceiversForInsertDynamicRecipientVar(
    recipients,
    isSameProperty,
    (item, isSamePropertyIdOrSupplierOrOtherContact) =>
      isSamePropertyIdOrSupplierOrOtherContact
        ? [item?.firstName, item?.lastName].filter(Boolean).join(' ').trim() ||
          EFallback.UNKNOWN
        : [getEmailRecipient(item) || EFallback.UNKNOWN]
  );
  const roles = mapReceiversForInsertDynamicRecipientVar(
    recipients,
    isSameProperty,
    (item, isSamePropertyIdOrSupplierOrOtherContact) =>
      isSamePropertyIdOrSupplierOrOtherContact
        ? convertUserRole(
            item?.userPropertyType || item?.type || item?.userType,
            item?.contactType
          )
        : EFallback.UNKNOWN
  );
  return {
    firstNames: formatListNamesDisplay(firstNames),
    fullNames: formatListNamesDisplay(fullNames),
    roles: formatListNamesDisplay(roles)
  };
};
