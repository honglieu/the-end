import { EUserPropertyType } from '@shared/enum/user.enum';
import { EContactTitle } from './trudi-send-msg.enum';
import { ECountryName } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import {
  PHONE_NUMBER_START_GROUP_1,
  PHONE_NUMBER_START_GROUP_2,
  PHONE_NUMBER_START_GROUP_3,
  PHONE_NUMBER_START_GROUP_4,
  PHONE_PREFIXES,
  UserType
} from '@services/constants';

export function htmlContactCard(contacts, market) {
  if (!contacts || contacts.length === 0) return '';
  return `<div id="contact-cards-container" style="margin-top: 10px;">
            ${contacts
              .map((contact) => createHtmlCardItem(contact, market))
              .join('')}
          </div>`;
}

export function createHtmlCardItem(contact, market) {
  const titleName = getTileByType({ ...contact });
  const phoneNumber = getMaskPhoneNumber(contact?.phoneNumber, market);
  const email =
    contact?.email?.length > 32
      ? contact?.email?.slice(0, 32) + '...'
      : contact?.email;
  const landingPage =
    contact?.landingPage?.length > 32
      ? contact?.landingPage?.slice(0, 32) + '...'
      : contact?.landingPage;
  const urlLandingPage = validateAndFormatURL(contact?.landingPage);
  return ` <div class="card" style="border: 1px solid #ccc; padding: 12px; width: 278px; border-radius: 8px; margin: 12px 0px;box-sizing: border-box; user-select: none;pointer-events: none;" contenteditable="false" data-role="contact-card" data-id="${
    contact.id
  }">
              <div class="card-header" style="margin-bottom: 8px;">
                <table style="border-collapse: collapse;" cellpadding="0">
                  <tr>
                    <td style="padding-bottom: 4px;">
                      <div style="max-width: 246px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #202020; font-size: 11pt; line-height: normal; font-weight: 600;" data-role="full-name">
                        ${contact.firstName} ${contact.lastName}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span data-role="contact-type" style="
                        background-color: ${
                          contact.type === EUserPropertyType.LANDLORD ||
                          contact.type === EUserPropertyType.LANDLORD_PROSPECT
                            ? '#DEF8F5'
                            : contact.type === EUserPropertyType.TENANT ||
                              contact.type ===
                                EUserPropertyType.TENANT_PROPERTY ||
                              contact.type ===
                                EUserPropertyType.TENANT_PROSPECT ||
                              contact.type === EUserPropertyType.TENANT_UNIT
                            ? '#FEFAD7'
                            : contact.type === EUserPropertyType.LEAD
                            ? '#D8EDFF'
                            : contact.type === EUserPropertyType.OTHER
                            ? '#FFE1E7'
                            : '#F0E3FF'
                        };
                        color: ${
                          contact.type === EUserPropertyType.LANDLORD ||
                          contact.type === EUserPropertyType.LANDLORD_PROSPECT
                            ? '#28AD99'
                            : contact.type === EUserPropertyType.TENANT ||
                              contact.type ===
                                EUserPropertyType.TENANT_PROPERTY ||
                              contact.type ===
                                EUserPropertyType.TENANT_PROSPECT ||
                              contact.type === EUserPropertyType.TENANT_UNIT
                            ? '#E2AB10'
                            : contact.type === EUserPropertyType.LEAD
                            ? '#1570EF'
                            : contact.type === EUserPropertyType.OTHER
                            ? '#E1024F'
                            : '#7F56D9'
                        };
                        font-size: 12px;
                        line-height: 16px;
                        font-weight: 500;
                        border-radius: 24px;
                        padding: 2px 8px;
                        display: inline-block;
                        max-width: 236px;
                        white-space: nowrap;
                        overflow: hidden !important;
                        text-overflow: ellipsis;">
                          ${titleName}
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
              <div class="card-body" style="color: #61646C; font-size: 12px; line-height: 16px; font-weight: 500;word-break: normal;">
                <table>
                  <tr style="display: table-row; vertical-align: middle;">
                    <td style="width: 16px;">
                      <img src="https://cdn.prod.trulet.com/icon/call.png" alt="Phone" style="width: 16px; height: 16px; vertical-align: middle">
                    </td>
                    <td>
                      <div data-role="phone-number" style="${
                        contact.phoneNumber
                          ? 'font-style: normal; font-weight: 500;'
                          : 'font-style: italic; font-weight: 400;'
                      }
                        color: #61646C; font-size: 12px; line-height: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 232px; vertical-align: middle">${
                          contact.phoneNumber
                            ? phoneNumber
                            : '(no phone number)'
                        }
                      </div>
                    </td>
                  </tr>
                  <tr style="display: ${
                    contact.type === EUserPropertyType.SUPPLIER ||
                    contact.type === EUserPropertyType.LEAD
                      ? 'none'
                      : 'table-row; vertical-align: middle'
                  };">
                    <td style="width: 16px;">
                      <img src="https://cdn.prod.trulet.com/icon/map-pin.png" alt="Location" style="width: 16px; height: 16px; vertical-align: middle">
                    </td>
                    <td>
                      <div data-role="address" style="${
                        contact.address
                          ? 'font-style: normal; font-weight: 500;'
                          : 'font-style: italic; font-weight: 400;'
                      }
                      color: #61646C; font-size: 12px; line-height: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 232px; vertical-align: middle">${
                        contact.address ? contact.address : '(no property)'
                      }</div>
                    </td>
                  </tr>
                  <tr style="display: table-row; vertical-align: middle;">
                    <td style="width: 16px;">
                      <img src="https://cdn.prod.trulet.com/icon/mail.png" alt="Email" style="width: 16px; height: 16px; vertical-align: middle">
                    </td>
                    <td>
                    ${
                      contact.email
                        ? `<a href="mailto:${contact.email}"
                              style="text-decoration: none; color: #61646C; font-size: 12px; line-height: 16px; font-style: normal; font-weight: 500; vertical-align: middle" data-role="email">${email}</a>`
                        : `<div style="color: #61646C; font-size: 12px; line-height: 16px; font-style: italic; font-weight: 400;" data-role="email">(no email)</div>`
                    }
                    </td>
                  </tr>
                  <tr style="display: ${
                    !contact.landingPage &&
                    contact.type !== EUserPropertyType.SUPPLIER
                      ? 'none'
                      : 'table-row; vertical-align: middle'
                  };">
                    <td style="width: 16px;">
                      <img src="https://cdn.prod.trulet.com/icon/global.png" alt="Global" style="width: 16px; height: 16px; vertical-align: middle">
                    </td>
                    <td>
                      ${
                        contact.landingPage
                          ? `
                          <span style="white-space: nowrap ; overflow: hidden; text-overflow: ellipsis; max-width: 210px; vertical-align: middle;">
                            <a href="${urlLandingPage}" style="text-decoration: none; color: #61646C; font-size: 12px; line-height: 16px; font-style: normal; font-weight: 500; vertical-align: middle;" data-role="landing-page">${landingPage}</a>
                          </span>
                          <a href="${urlLandingPage}"
                            style="margin-left: 4px; vertical-align: middle;">
                            <img src="https://cdn.prod.trulet.com/icon/navigate.png" alt="Navigate" style="width: 12px; height: 12px; vertical-align: middle;">
                          </a>
                          `
                          : `<div style="color: #61646C; font-size: 12px; line-height: 16px; font-style: italic; font-weight: 400;" data-role="landing-page">(no website)</div>`
                      }
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          `;
}

export function createHtmlCardItemForMessenger(contact, market, index) {
  const titleName = getTileByType({ ...contact });
  const phoneNumber = getMaskPhoneNumber(contact?.phoneNumber, market);
  const email =
    contact?.email?.length > 32
      ? contact?.email?.slice(0, 32) + '...'
      : contact?.email;
  const landingPage =
    contact?.landingPage?.length > 32
      ? contact?.landingPage?.slice(0, 32) + '...'
      : contact?.landingPage;
  const isHiddenPropertyAddress = [
    EUserPropertyType.SUPPLIER,
    EUserPropertyType.LEAD,
    EUserPropertyType.OTHER
  ].includes(contact.type);
  const isHiddenLandingPage =
    !contact.landingPage && contact.type !== EUserPropertyType.SUPPLIER;
  const urlLandingPage = validateAndFormatURL(contact?.landingPage);
  const styleDiv = `white-space: nowrap; color: #333741; font-size: 14px; line-height: 20px; font-weight: 400; text-transform: capitalize;`;
  const styleNoContent = `color: #61646C; text-transform: none; font-size: 14px; line-height: 20px; font-style: italic; font-weight: 400;`;
  const propertyLine = `<span style="${styleDiv}">
  ${
    contact.address
      ? contact.address
      : `<span style="${styleNoContent}">(no property)</span>`
  }</span> <br>`;
  const websiteLine = `
  ${
    contact.landingPage
      ? `
      <span style="white-space: nowrap ; overflow: hidden; max-width: 210px; vertical-align: middle;">
        <a href="${urlLandingPage}" style="color: blue; font-size: 14px; line-height: 16px; font-style: normal; font-weight: 400; vertical-align: middle;" data-role="landing-page">${landingPage}</a>
      </span>
      `
      : `<span style="color: #61646C; font-size: 14px; line-height: 20px; font-style: italic; font-weight: 400;" data-role="landing-page">(no website)</span>`
  }<br>`;
  return `<span data-id="${contact.id}">
  ${index ? '<br>' : ''}
  <span style="${styleDiv}">
    ${contact.firstName} ${contact.lastName}
  </span><br>
  <span style="${styleDiv}">
    ${titleName}
  </span><br>
  <span style="${styleDiv}">
  ${
    contact.phoneNumber
      ? phoneNumber
      : `<span style="${styleNoContent}">(no phone number)</span>`
  }
  </span><br>
  ${!isHiddenPropertyAddress ? propertyLine : ''}
  <span>
  ${
    contact.email
      ? `<span
            style="text-decoration: none; color: #333741; font-size: 14px; line-height: 20px; font-style: normal; font-weight: 400; vertical-align: middle" data-role="email">${email}</span>`
      : `<span style="color: #61646C; font-size: 14px; line-height: 16px; font-style: italic; font-weight: 400;" data-role="email">(no email)</span>`
  }
  </span><br>
  ${!isHiddenLandingPage ? websiteLine : ''}
</span>`;
}

function getTileByType({ title, userTitle, type }) {
  switch (title as EContactTitle) {
    case EContactTitle.OTHER:
      return 'Other contact';
    case EContactTitle.LEAD:
      return userTitle;
    default:
      return titleCase(title) || getTileByUserType(type);
  }
}

function getTileByUserType(type) {
  switch (type) {
    case UserType.SUPPLIER:
      return 'Supplier';
    default:
      return '';
  }
}

function titleCase(value: string): string {
  if (!value) return '';

  let words = value.split('_').join(' ');
  words = words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();

  let wordsArray = words.split(' - ');
  wordsArray = wordsArray.map((word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  words = wordsArray.join(' - ');

  return words;
}

function getMaskPhoneNumber(phoneNumber: string, market): string {
  if (!phoneNumber) {
    return phoneNumber;
  }

  const reFormattedPhone = phoneNumber.replace(/\D/g, '');
  const isNumber = /^\d+$/.test(phoneNumber);
  const isPhoneAUValid = /^\+61\d+$/.test(phoneNumber);
  const isPhoneUSValid = /^\+1\d+$/.test(phoneNumber);
  let countryCode: string;

  switch (market) {
    case ECountryName.AUSTRALIA:
      countryCode = PHONE_PREFIXES.AU[0];
      if (isPhoneAUValid) {
        let group = getPhoneNumberGroup(
          phoneNumber.length,
          reFormattedPhone.slice(2)
        );
        if (group) {
          return `(${countryCode}) ${reFormattedPhone
            .slice(2)
            .replace(group, '$1 $2 $3')}`;
        }
      } else if (phoneNumber.length === 10 && isNumber) {
        if (phoneNumber.startsWith('1300') || phoneNumber.startsWith('04')) {
          return reFormattedPhone.replace(
            PHONE_NUMBER_START_GROUP_4,
            '$1 $2 $3'
          );
        }
        return reFormattedPhone.replace(PHONE_NUMBER_START_GROUP_2, '$1 $2 $3');
      }
      break;

    case ECountryName.UNITED_STATES:
      countryCode = PHONE_PREFIXES.US[0];
      if (isPhoneUSValid && phoneNumber.length === 12) {
        return `(${countryCode}) ${reFormattedPhone
          .slice(1)
          .replace(PHONE_NUMBER_START_GROUP_3, '($1) $2-$3')}`;
      } else if (phoneNumber.length === 10 && isNumber) {
        return reFormattedPhone.replace(
          PHONE_NUMBER_START_GROUP_3,
          '($1) $2-$3'
        );
      }
      break;
  }

  return phoneNumber;
}

function getPhoneNumberGroup(length, reFormattedPhone) {
  switch (length) {
    case 12:
      return PHONE_NUMBER_START_GROUP_1;
    case 13:
      if (
        reFormattedPhone.startsWith('1300') ||
        reFormattedPhone.startsWith('04')
      ) {
        return PHONE_NUMBER_START_GROUP_4;
      }
      return PHONE_NUMBER_START_GROUP_2;
    default:
      return '';
  }
}

function validateAndFormatURL(url) {
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  return url;
}
