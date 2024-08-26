import { ICompany } from '@shared/types/company.interface';
import { Injectable } from '@angular/core';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { CompanyService } from '@services/company.service';
import { PHONE_PREFIXES } from '@services/constants';
import { EFallback } from '@/app/trudi-send-msg/utils/dynamic-parameter';
import { AbstractControl, FormGroup } from '@angular/forms';
import { TrudiSendMsgFormService } from './trudi-send-msg-form.service';
import { debounceTime, filter, of, switchMap } from 'rxjs';
import {
  IGetDynamicFieldsDataMessageScratchPayload,
  TrudiSendMsgUserService
} from './trudi-send-msg-user.service';
import { TrudiDynamicParameterService } from './trudi-dynamic-paramater.service';
import {
  ISelectedReceivers,
  ISendMsgConfigs
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  formatListNamesDisplay,
  getEmailRecipient,
  isDynamicParameterFallback,
  mapReceiversForInsertDynamicRecipientVar,
  replaceSingleQuotes
} from '@/app/trudi-send-msg/utils/dynamic-parameter-helper-functions';
import { convertUserRole } from '@/app/trudi-send-msg/utils/helper-functions';
import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { EConversationType } from '@/app/shared/enum/conversationType.enum';

const INVALID_STYLE = 'color: var(--danger-500, #fa3939);';

@Injectable()
export class TrudiDynamicParameterDataService {
  public areaCode: string;
  public dateFormatDay = null;
  public currentCompany: ICompany;

  constructor(
    private trudiDynamicParameterService: TrudiDynamicParameterService,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private agencyDateFormatService: AgencyDateFormatService,
    private agencyService: AgencyService,
    private companyService: CompanyService,
    private trudiSendMsgUserService: TrudiSendMsgUserService
  ) {
    this.agencyDateFormatService.dateFormatDayJS$.subscribe(
      (dateFormatDay) => (this.dateFormatDay = dateFormatDay)
    );

    this.companyService.getCurrentCompany().subscribe((company) => {
      this.currentCompany = company;
      this.areaCode = this.agencyService.isRentManagerCRM(company)
        ? PHONE_PREFIXES.US[0]
        : PHONE_PREFIXES.AU[0];
    });
  }

  get sendMsgForm(): FormGroup {
    return this.trudiSendMsgFormService.sendMsgForm;
  }

  get sender(): AbstractControl {
    return this.sendMsgForm?.get('selectedSender');
  }

  get receivers(): AbstractControl {
    return this.sendMsgForm?.get('selectedReceivers');
  }

  get property(): AbstractControl {
    return this.sendMsgForm?.get('property');
  }

  async initDynamicData(
    config: ISendMsgConfigs,
    data?: ITasksForPrefillDynamicData[]
  ) {
    // handle get data at the first time if the property already has value
    const agency = this.currentCompany;
    this.trudiDynamicParameterService.setDynamicParamaterAgency(agency);
    if (this.property?.value) {
      if (data?.length) {
        this.setDynamicParameters(config, data?.[0] || {});
      } else {
        const data = await this.getDataDynamicParams(this.property?.value?.id);
        this.setDynamicParameters(config, data);
      }
    }

    // get dynamic data with appropriate property
    this.property?.valueChanges
      .pipe(
        filter((property) => !!property?.id),
        debounceTime(100),
        switchMap((property) => this.getDataDynamicParams(property?.id))
      )
      .subscribe((res) => {
        this.setDynamicParameters(config, res);
      });
  }

  private setDynamicParameters(config: ISendMsgConfigs, data) {
    const requestSummary =
      this.trudiDynamicParameterService.getRequestSummaryFromActionItem(
        data?.linkedActions?.[0]
      );
    const filesSummary = data?.linkedActions?.[0]?.ticketFiles || [];
    const summary = {
      summaryNote: requestSummary,
      summaryPhotos: filesSummary
    };

    let dynamicParameterData;
    if (this.property?.value) {
      dynamicParameterData = {
        ...data,
        property: {
          ...data?.property,
          shortenStreetline: data?.property?.shortenStreetLine,
          streetline: data?.property?.streetLine
        },
        tenancy: data?.tenancies,
        ownerships: data?.ownerships,
        summary: summary || {}
      };
    } else {
      dynamicParameterData = {
        summary: summary || {}
      };
    }

    this.trudiDynamicParameterService.setDynamicParametersForSendMsgV3(
      dynamicParameterData
    );
  }

  private getDataDynamicParams(propertyId = null, userProperties = []) {
    let payload = {
      propertyId: propertyId,
      userProperties: userProperties
    } as IGetDynamicFieldsDataMessageScratchPayload;
    return this.trudiSendMsgUserService
      .getDynamicFieldsDataMessageScratchApi(payload)
      .pipe(
        switchMap((res) => {
          return of(res);
        })
      )
      .toPromise();
  }

  public getDynamicParamData(param: string) {
    const receivers: ISelectedReceivers[] = this.receivers?.value;
    const isFacebookUser =
      this.receivers?.value?.[0]?.conversationType ===
      EConversationType.MESSENGER;
    const userPropertyId = this.receivers?.value?.[0]?.userPropertyId;
    const userName = this.receivers?.value?.[0]?.name;
    const userFacebookName =
      isFacebookUser && !userPropertyId ? userName : EFallback.UNKNOWN;
    const isSameProperty = (propertyId): boolean =>
      propertyId === this.property?.value?.id;

    // Same property + Supplier/ Other contact -> show all (name, role)
    // First name + full name: belong to other contact -> show original email name
    // First name + full name (create from scratch): external email -> show fallback
    // Role: external email + belong to other contact -> show fallback

    const firstNames = mapReceiversForInsertDynamicRecipientVar(
      receivers,
      isSameProperty,
      (item, isSamePropertyIdOrSupplierOrOtherContact) =>
        isSamePropertyIdOrSupplierOrOtherContact
          ? item?.firstName ||
            (isFacebookUser && !userPropertyId
              ? userFacebookName
              : EFallback.UNKNOWN)
          : getEmailRecipient(item) ||
            (isFacebookUser && !userPropertyId
              ? userFacebookName
              : EFallback.UNKNOWN)
    );
    const fullNames = mapReceiversForInsertDynamicRecipientVar(
      receivers,
      isSameProperty,
      (item, isSamePropertyIdOrSupplierOrOtherContact) =>
        isSamePropertyIdOrSupplierOrOtherContact
          ? ![item?.firstName, item?.lastName].filter(Boolean).length &&
            isFacebookUser &&
            !userPropertyId
            ? [userFacebookName]
            : [item?.firstName, item?.lastName].filter(Boolean)
          : [
              getEmailRecipient(item) ||
                (isFacebookUser && !userPropertyId
                  ? userFacebookName
                  : EFallback.UNKNOWN)
            ]
    );
    const roles = mapReceiversForInsertDynamicRecipientVar(
      receivers,
      isSameProperty,
      (item, isSamePropertyIdOrSupplierOrOtherContact) =>
        isSamePropertyIdOrSupplierOrOtherContact
          ? convertUserRole(
              item?.userPropertyType || item?.type || item?.userType,
              item?.contactType
            )
          : EFallback.UNKNOWN
    );

    const text =
      {
        user_first_name: firstNames || EFallback.UNKNOWN,
        user_full_name: fullNames || EFallback.UNKNOWN,
        user_role: roles
      }[param] || param;

    return text;
  }

  public generateValueToInsert(param?: string) {
    let data, tag;

    switch (param) {
      // special cases
      case 'user_first_name':
      case 'user_role':
      case 'user_full_name':
        data = this.getDynamicParamData(param);
        tag = this.handleRecipientDynamicParameter(data, param);
        break;

      // common cases
      default:
        // if value doesn't exist => get fallback value
        data =
          this.trudiDynamicParameterService.getDynamicValueForSendMsgV3(
            param
          ) || this.trudiDynamicParameterService.checkFallBackVariable(param);

        tag = isDynamicParameterFallback(data)
          ? replaceSingleQuotes(
              `<span style="${INVALID_STYLE}" contenteditable="false" data-param="${
                param ?? 'undefined_param'
              }">${data}</span>`
            )
          : `<span>${data}</span>`;
        break;
    }
    return tag.trim();
  }

  public handleRecipientDynamicParameter(name?, param?) {
    const generateTag = (value) =>
      isDynamicParameterFallback(value)
        ? replaceSingleQuotes(
            `<span style='${INVALID_STYLE}' contenteditable='false' data-param='${
              param ?? 'undefined_param'
            }'>${value}</span>`
          )
        : `<span>${value}</span>`;

    const generateFullNames = (names) =>
      name.length
        ? names.map((item) =>
            item.every(isDynamicParameterFallback)
              ? [generateTag(EFallback.UNKNOWN)]
              : item
                  // remove all fallback value
                  .filter((child) => !isDynamicParameterFallback(child))
                  .map(generateTag)
                  .join(' ')
          )
        : [generateTag(EFallback.UNKNOWN)];

    const generateNames = (names) =>
      names.length ? names.map(generateTag) : [generateTag(EFallback.UNKNOWN)];

    switch (param) {
      case 'user_first_name':
      case 'user_role':
        return formatListNamesDisplay(generateNames(name));
      case 'user_full_name':
        return formatListNamesDisplay(generateFullNames(name));
      default:
        return generateTag(name);
    }
  }
}
