import { ICompany } from '@shared/types/company.interface';
import { Injectable } from '@angular/core';
import dayjs from 'dayjs';
import { Subject } from 'rxjs';
import { ArrearsType } from '@/app/breach-notice/utils/breach-notice.enum';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { CompanyService } from '@services/company.service';
import {
  PHONE_NUMBER_START_3_GROUP_4,
  PHONE_PREFIXES,
  TIME_FORMAT
} from '@services/constants';
import { SharedService } from '@services/shared.service';
import { EEventType } from '@shared/enum/calendar.enum';
import { EConfirmContactType } from '@shared/enum/contact-type';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import { TrudiTitleCasePipe } from '@shared/pipes/title-case.pipe';
import {
  IConversationFiles,
  IDataApplicationShortlistVariable
} from '@shared/types/task.interface';
import { FrequencyRental } from '@shared/types/trudi.interface';
import {
  BankAccount,
  Personal,
  TargetFromFormMessage
} from '@shared/types/user.interface';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import {
  EEntityType,
  RMWidgetDataField
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { CHECK_BILLS } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { ERecurringCharge } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';
import { ITaskLinkCalendarEvent } from '@/app/task-detail/modules/steps/communication/interfaces/calendar-event.interface';
import {
  EPaymentType,
  Efrequency,
  FREQUENCY_CHECK,
  PeriodTypeString,
  TypeCompliance,
  WEEKLY_CHECK
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { ICalendarEvent } from '@/app/task-detail/modules/steps/utils/schedule-reminder.interface';
import { ESyncStatus, TypeVacate } from '@/app/task-detail/utils/functions';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  formatFrequencyName,
  getValuesForContactCardVariables,
  mapWorkingHoursLabel
} from '@/app/trudi-send-msg/utils/helper-functions';
import { IDataContactCardVariable } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  DynamicParameter,
  DynamicParameterFallBack,
  EFallback
} from './../utils/dynamic-parameter';
import { getTextFromDynamicRecipientVariable } from '@/app/trudi-send-msg/utils/dynamic-parameter-helper-functions';
import { cloneDeep } from 'lodash-es';
import { Property } from '@/app/shared/types/property.interface';
import { EOptionType } from '@shared/enum/optionType.enum';
import { mapTicketToDisplayItem } from '@/app/dashboard/modules/inbox/modules/facebook-view/utils/function';

const INSPECTION_DATE_FORMAT = {
  TIME: 'h:mm A',
  TIME_V2: 'hh:mm A',
  DATE: 'DD/MM/YYYY',
  DATE_TIME: 'h:mm A DD/MM/YYYY'
};

@Injectable({
  providedIn: 'root'
})
export class TrudiDynamicParameterService {
  public dynamicParameters: Map<string, string> = cloneDeep(DynamicParameter);
  public areaCode: string;
  public inlineDynamicParameters: Map<string, string> = new Map(
    DynamicParameter
  );
  private resetKeys: Set<string> = new Set([
    'calendar_event_date',
    'calendar_event_time',
    'contact_name',
    'contact_address',
    'contact_email_address',
    'contact_phone_number',
    'contact_information',
    'file_name',
    'schedule_time',
    'schedule_date',
    'event_date',
    'event_time',
    'form_name',
    'local_file_name',
    'rei_form_name',
    'PM_name',
    'breach_reason',
    'remedy_date',
    'entry_reason',
    'entry_date',
    'entry_time',
    'custom_event_time',
    'custom_event_date',
    'custom_event_name'
  ]);
  private template: string = null;
  private listOfFile;

  // Triger event prefill parameters
  public triggerPrefillParameter: Subject<boolean> = new Subject();
  public EventTypeAllowToPrefillStartTime = [
    EEventType.ENTRY_NOTICE,
    EEventType.ISSUE,
    EEventType.CUSTOM_EVENT,
    EEventType.INGOING_INSPECTION,
    EEventType.OUTGOING_INSPECTION,
    EEventType.ROUTINE_INSPECTION
  ];
  public dateFormatDay = null;
  public currentCompany: ICompany;

  constructor(
    private titleCasePipe: TrudiTitleCasePipe,
    private sharedService: SharedService,
    private agencyDateFormatService: AgencyDateFormatService,
    private phoneNumberFormat: PhoneNumberFormatPipe,
    private agencyService: AgencyService,
    private companyService: CompanyService
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

  public setTemplate(template: string) {
    this.resetDynamicParameters(this.resetKeys);
    this.template = template;
  }

  public resetTemplate() {
    this.template = null;
  }

  get getFileFromDynamicParameters() {
    return this.listOfFile;
  }

  public setGlobalDynamicParameters(data) {
    if (!data) return;
    this.setDynamicParamaterAgency(data?.company);
    this.setDynamicParamaterProperty(data?.property);
    this.setDynamicParamaterRecipient();
    this.setDynamicParametersLandlord(data?.peopleList?.ownerships?.[0]);
    this.setDynamicParameterTrustAccount(data?.bankAccount);
  }

  public setDynamicParametersForSendMsgV3(data) {
    if (!data) return;
    this.setDynamicParametersRequestSummary(data.summary);
    this.setDynamicParamaterProperty(data.property);
    this.setDynamicParametersTenancy(data.tenancy);
    this.setDynamicParametersLandlord(data.ownerships);
    this.setDynamicParameterTrustAccount(data.bankAccount);
  }

  public setDynamicParamaterProperty(property: Partial<Property>) {
    if (!property) return;
    const {
      shortenStreetline,
      streetline,
      keyNumber,
      keyDescription,
      nextInspectionDate,
      nextInspectionEndTime,
      nextInspectionStartTime,
      expenditureLimit,
      authorityStartDate,
      authorityEndDate
    } = property || {};
    this.dynamicParameters.set('short_property_address', shortenStreetline);
    this.dynamicParameters.set('full_property_address', streetline);
    this.dynamicParameters.set(
      'property_region',
      property.region?.name || property['regionName']
    );
    this.dynamicParameters.set('key_number', keyNumber);
    this.dynamicParameters.set('key_description', keyDescription);

    let format = INSPECTION_DATE_FORMAT.TIME;
    if (
      this.formatDate(nextInspectionStartTime) !==
      this.formatDate(nextInspectionEndTime)
    ) {
      format = INSPECTION_DATE_FORMAT.DATE_TIME;
    }
    this.dynamicParameters.set(
      'next_inspection_date',
      nextInspectionDate ? this.formatDate(nextInspectionDate) : null
    );
    this.dynamicParameters.set(
      'next_inspection_start_time',
      nextInspectionStartTime
        ? this.formatDate(nextInspectionStartTime, format)
        : null
    );
    this.dynamicParameters.set(
      'next_inspection_end_time',
      nextInspectionEndTime
        ? this.formatDate(nextInspectionEndTime, format)
        : null
    );
    this.dynamicParameters.set(
      '$maintenance_expenditure_limit',
      !isNaN(parseFloat(expenditureLimit))
        ? `$${this._formatAmount(expenditureLimit)}`
        : null
    );
    this.dynamicParameters.set(
      'authority_start_date',
      authorityStartDate ? this.formatDate(authorityStartDate) : null
    );
    this.dynamicParameters.set(
      'authority_end_date',
      authorityEndDate ? this.formatDate(authorityEndDate) : null
    );
  }

  public setDynamicParameterTrustAccount(bankAccount: BankAccount) {
    if (!bankAccount) return;
    this.dynamicParameters.set('company_BSB', bankAccount.bsb);
    this.dynamicParameters.set(
      'company_account_number',
      bankAccount.accountNumber
    );
    this.dynamicParameters.set('company_account_name', bankAccount.accountName);
  }

  public setDynamicParamaterAgency(company: ICompany) {
    const tz = this.agencyDateFormatService.getCurrentTimezone();
    if (!company) return;
    const phoneNumber = company.phoneNumber
      ? `${this.areaCode}${company.phoneNumber}`
      : '';

    this.dynamicParameters.set('company_name', company.name);
    this.dynamicParameters.set('company_address', company.address);
    this.dynamicParameters.set(
      'company_phone_number',
      this.phoneNumberFormat.transform(phoneNumber.replace(/\s/g, ''))
    );
    this.dynamicParameters.set(
      'company_link',
      company?.websiteUrl
        ? `<a href="${company.websiteUrl}">${company.websiteUrl}</a>`
        : ''
    );
    this.dynamicParameters.set(
      'company_working_hours',
      mapWorkingHoursLabel(company?.regionWorkingHours, tz)
    );
    if (company.agencies?.length === 1) {
      this.dynamicParameters.set(
        'company_BSB',
        company.bankAccounts?.[0]?.['bsb']
      );
      this.dynamicParameters.set(
        'company_account_number',
        company.bankAccounts?.[0]?.['accountNumber']
      );
      this.dynamicParameters.set(
        'company_account_name',
        company.bankAccounts?.[0]?.['accountName']
      );
    }
  }

  public setDynamicParamaterPm(selectedSender: TargetFromFormMessage) {
    this.dynamicParameters.set('PM_name', selectedSender?.name);
    this.dynamicParameters.set('sender_name', selectedSender?.name);
    this.dynamicParameters.set('sender_role', selectedSender?.title);
  }

  public setDynamicParamaterRecipient() {
    this.dynamicParameters.set('user_first_name', '{user_first_name}');
    this.dynamicParameters.set('user_full_name', '{user_full_name}');
    this.dynamicParameters.set('user_role', '{user_role}');
  }

  public setDynamicParametersCalendarEventWidget(
    event: ITaskLinkCalendarEvent | ICalendarEvent = null
  ) {
    if (event?.eventType === EEventType.BREACH_REMEDY) {
      this.dynamicParameters.set(
        'breach_reason',
        event.eventName?.replace('Breach remedy due  - ', '')
      );
      this.dynamicParameters.set(
        'remedy_date',
        !!event.eventDate && this.formatDate(event.eventDate)
      );
    } else if (event?.eventType === EEventType.ENTRY_NOTICE) {
      this.dynamicParameters.set(
        'entry_reason',
        event.eventName?.replace('Property entry - ', '')
      );
      this.dynamicParameters.set(
        'entry_date',
        !!event.eventDate && this.formatDate(event.eventDate)
      );
      this.dynamicParameters.set(
        'entry_time',
        !!event.eventDate && this.formatTime(event.eventDate)
      );
    } else if (event?.eventType === EEventType.CUSTOM_EVENT) {
      this.dynamicParameters.set('custom_event_name', event.eventName);
      this.dynamicParameters.set(
        'custom_event_date',
        !!event.eventDate && this.formatDate(event.eventDate)
      );
      this.dynamicParameters.set(
        'custom_event_time',
        !!event.eventDate && this.formatTime(event.eventDate)
      );
    }
  }

  public setDynamicParametersTenancy(tenancy: Personal) {
    if (tenancy) {
      this.dynamicParameters.set('tenancy_name', tenancy.name);
      this.dynamicParameters.set('tenant_name', tenancy.name);
      this.dynamicParameters.set('tenancy_id', tenancy?.idCRMSystem);
      this.dynamicParameters.set('tenant_id', tenancy?.idCRMSystem);
      tenancy.userPropertyGroupLeases?.[0]?.startDate &&
        this.dynamicParameters.set(
          'lease_start',
          this.formatDate(tenancy.userPropertyGroupLeases?.[0]?.startDate)
        );
      tenancy.userPropertyGroupLeases?.[0]?.endDate &&
        this.dynamicParameters.set(
          'lease_end',
          this.formatDate(tenancy.userPropertyGroupLeases?.[0]?.endDate)
        );
      const rentAmount = !isNaN(
        parseFloat(tenancy.userPropertyGroupLeases?.[0]?.rentAmount)
      )
        ? `$${this._formatAmount(
            tenancy.userPropertyGroupLeases?.[0]?.rentAmount
          )} ${formatFrequencyName(
            tenancy.userPropertyGroupLeases?.[0]?.frequency
          )}`
        : null;
      const effectiveArrearsAmount = !isNaN(
        parseFloat(
          tenancy?.arrears?.filter(
            (item) => item.type === ArrearsType.RENT
          )?.[0]?.effectiveArrearsAmount
        )
      )
        ? `$${this._formatAmount(
            tenancy?.arrears?.filter(
              (item) => item.type === ArrearsType.RENT
            )?.[0]?.effectiveArrearsAmount
          )}`
        : null;

      const bondAmountRequired = tenancy?.bondAmountRequired
        ? `$${this._formatAmount(tenancy?.bondAmountRequired)}`
        : null;
      const nextRentAmount = tenancy?.nextRentAmount
        ? `$${this._formatAmount(tenancy?.nextRentAmount)}`
        : null;
      const totalOutStandingInvoice = tenancy?.totalOutStandingInvoice
        ? `$${this._formatAmount(tenancy?.totalOutStandingInvoice)}`
        : null;

      const frequencyValue = formatFrequencyName(
        tenancy?.userPropertyGroupLeases?.[0]?.frequency
      );

      this.dynamicParameters.set(
        '$rent_amount',
        rentAmount ? `${rentAmount}` : null
      );
      this.dynamicParameters.set(
        '$effective_rent_arrears_amount',
        effectiveArrearsAmount ? `${effectiveArrearsAmount}` : null
      );
      this.dynamicParameters.set(
        'lease_period',
        tenancy.userPropertyGroupLeases?.[0]?.leasePeriod
      );
      this.dynamicParameters.set(
        'period_type',
        tenancy.userPropertyGroupLeases?.[0]?.leasePeriodType
      );

      this.dynamicParameters.set(
        '$bond_amount_required',
        bondAmountRequired ? `${bondAmountRequired}` : null
      );
      this.dynamicParameters.set(
        '$next_rent_amount',
        nextRentAmount ? `${nextRentAmount} ${frequencyValue}` : null
      );
      this.dynamicParameters.set(
        'tenant_next_rent_review',
        this.formatDate(tenancy.nextRentReviewDate)
      );
      this.dynamicParameters.set(
        'day_rent_in_arrears',
        tenancy?.dayRentInArrears ? `${tenancy?.dayRentInArrears}` : null
      );
      tenancy?.rentPaidToDate &&
        this.dynamicParameters.set(
          'effective_rent_paid_to_date',
          this.formatDate(tenancy?.rentPaidToDate)
        );
      tenancy?.movingOutDate &&
        this.dynamicParameters.set(
          'moving_out_date',
          this.formatDate(tenancy?.movingOutDate)
        );
      this.dynamicParameters.set(
        '$total_outstanding_invoices',
        totalOutStandingInvoice ? `${totalOutStandingInvoice}` : null
      );

      this.dynamicParameters.set(
        'rent_period',
        tenancy.userPropertyGroupLeases?.[0]?.frequency &&
          FREQUENCY_CHECK[tenancy.userPropertyGroupLeases?.[0]?.frequency]
      );
      this.dynamicParameters.set(
        'due_day',
        !isNaN(Number(tenancy.userPropertyGroupLeases?.[0]?.dueDay))
          ? this._getDueDate(
              tenancy.userPropertyGroupLeases?.[0]?.frequency,
              tenancy.userPropertyGroupLeases?.[0]?.dueDay
            )
          : null
      );
      this.dynamicParameters.set(
        'tenant_charge',
        this._getDynamicRecurringCharges(
          tenancy?.recurringCharges || [],
          EEntityType.TENANT
        )
      );
    } else {
      const resetKeys = new Set([
        'tenancy_name',
        'tenancy_id',
        'tenant_name',
        'tenant_id',
        'lease_start',
        'lease_end',
        '$rent_amount',
        '$effective_rent_arrears_amount',
        'lease_period',
        'period_type',
        'rent_period',
        'due_day',
        'tenant_charge'
      ]);
      this.resetDynamicParameters(resetKeys);
    }
  }

  public setDynamicParametersLandlord(owners: Personal) {
    this.dynamicParameters.set('owner_name', owners?.name);
  }

  public setDynamicParametersRequestSummary(summary) {
    this.dynamicParameters.set(
      'request_summary',
      summary?.summaryNote || summary?.summaryContent
    );
    this.inlineDynamicParameters.set(
      'request_summary_photos',
      JSON.stringify(summary?.summaryPhotos || summary?.propertyDocuments)
    );
  }

  public setDynamicParametersAttachment(formName: string) {
    this.dynamicParameters.set('form_name', formName);
  }

  public setDynamicParametersScheduleReminder(eventData, scheduleDateTime) {
    const { eventDate, eventName } = eventData || {};
    const { scheduleDate, scheduleTime } = scheduleDateTime || {};
    let eventTime = this.getDataEventTimeData(eventData);
    this.dynamicParameters.set(
      'event_name',
      this.titleCasePipe.transform(eventName)
    );
    this.dynamicParameters.set(
      'event_date',
      !!eventDate && this.formatDate(eventDate)
    );
    this.dynamicParameters.set('event_time', eventTime);

    this.dynamicParameters.set(
      'schedule_time',
      !!scheduleTime && this.formatTime(scheduleTime)
    );
    this.dynamicParameters.set(
      'schedule_date',
      !!scheduleDate && this.formatDate(scheduleDate)
    );
  }

  public setDynamicParametersPreScreen(data) {
    // TODO
  }

  public setDynamicParametersKey(obj: Record<string, string>) {
    for (const key in obj) {
      this.dynamicParameters.set(key, obj[key]);
    }
  }

  public setDynamicParametersConversationFiles(data: IConversationFiles) {
    if (!data) return;
    this.dynamicParameters.set('file_name', data.file_name ?? '');
    this.dynamicParameters.set('file_sender_name', data.file_sender_name ?? '');
  }

  public setDynamicParametersContactCard(
    listContactCard: IDataContactCardVariable[]
  ) {
    const result: IDataContactCardVariable =
      getValuesForContactCardVariables(listContactCard);

    this.dynamicParameters.set('contact_name', result.name);
    this.dynamicParameters.set('contact_address', result.address);
    this.dynamicParameters.set('contact_email_address', result.emailAddress);
    this.dynamicParameters.set('contact_phone_number', result.phoneNumber);
    this.dynamicParameters.set('contact_information', result.information);
  }

  public setDynamicParametersCalendarEvent(data) {
    let { eventDate, eventName, startTime, endTime } = data || {};

    let eventTime = this.getDataEventTimeData(data);

    this.dynamicParameters.set(
      'calendar_event_name',
      this.titleCasePipe.transform(eventName)
    );
    this.dynamicParameters.set(
      'calendar_event_date',
      this.formatDate(eventDate)
    );
    if (!!eventTime) {
      this.dynamicParameters.set('calendar_event_time', eventTime);
    }
    this.dynamicParameters.set(
      'routine_inspection_date',
      this.formatDate(eventDate)
    );
    this.dynamicParameters.set(
      'routine_inspection_start_time',
      this.formatTime(startTime)
    );
    this.dynamicParameters.set(
      'routine_inspection_end_time',
      this.formatTime(endTime)
    );
    this.dynamicParameters.set(
      'via this link',
      "<a href='{via_this_link}' data-action='via_link'>via this link</a>"
    );
  }

  private getDataEventTimeData(data) {
    let { eventDate, startTime, endTime, eventType } = data || {};

    let startTimeModified;

    if (this.EventTypeAllowToPrefillStartTime.includes(eventType)) {
      startTimeModified = startTime || eventDate;
    }
    let eventTime = '';
    if (
      !!endTime ||
      (!!startTimeModified &&
        !dayjs(startTimeModified)
          .startOf('day')
          .isSame(dayjs(startTimeModified)))
    ) {
      const arr = [];
      if (startTimeModified) {
        arr.push(this.formatTime(startTimeModified));
      } else if (startTimeModified && endTime) {
        arr.push(this.formatTime(startTimeModified, true));
        arr.push(this.formatTime(endTime));
      } else {
        arr.push(this.formatTime(endTime));
      }
      eventTime = arr.join(' - ');
    }
    if (!startTime && !endTime) {
      return 'All day';
    }
    return eventTime;
  }

  public setDynamicParamaterPTWidget(type, data) {
    if (!data) return;

    const formatVacateType = TypeVacate?.find(
      (item) => item?.value === data?.tenantVacateType || data?.vacateType
    );

    const formatComplianceType = TypeCompliance?.find(
      (item) => item?.value === data?.authorityForm
    );

    switch (type) {
      case PTWidgetDataField.NOTES:
        this.dynamicParameters.set('note_description', data?.description);
        break;
      case PTWidgetDataField.CREDITOR_INVOICES:
        this.dynamicParameters.set(
          'creditor_name',
          this.sharedService.displayName(
            data?.supplier?.firstName,
            data?.supplier?.lastName
          )
        );
        this.dynamicParameters.set(
          'creditor_invoice_description',
          data?.creditorInvoice?.description
        );
        this.dynamicParameters.set(
          '$creditor_invoice_amount',
          !isNaN(parseFloat(data?.creditorInvoice?.amount))
            ? `$${data?.creditorInvoice?.amount}`
            : null
        );
        this.dynamicParameters.set(
          'creditor_due_date',
          data?.creditorInvoice?.dueDate
            ? this.formatDate(data?.creditorInvoice?.dueDate)
            : null
        );
        this.dynamicParameters.set(
          'creditor_invoice_status',
          data?.creditorInvoice?.status
        );
        this.dynamicParameters.set(
          'creditor_invoice_reference',
          data?.creditorInvoice?.creditorReference
        );
        this.dynamicParameters.set(
          'linked_tenancy_invoice_description',
          data?.tenancyInvoice?.description
        );
        this.dynamicParameters.set(
          '$linked_tenancy_invoice_amount',
          !isNaN(parseFloat(data?.tenancyInvoice?.amount))
            ? `$${data?.tenancyInvoice?.amount}`
            : null
        );
        this.dynamicParameters.set(
          'linked_tenancy_due_date',
          data?.tenancyInvoice?.dueDate
            ? this.formatDate(data?.tenancyInvoice?.dueDate)
            : null
        );
        this.dynamicParameters.set(
          'linked_tenancy_invoice_status',
          data?.tenancyInvoice?.status
        );
        this.dynamicParameters.set(
          'linked_tenancy_name_invoice',
          data?.tenancyInvoice?.tenancyName
        );
        break;
      case PTWidgetDataField.TENANCY_INVOICES:
        this.dynamicParameters.set(
          'tenancy_invoice_description',
          data?.tenancyInvoice?.description
        );
        this.dynamicParameters.set(
          '$tenancy_invoice_amount',
          !isNaN(parseFloat(data?.tenancyInvoice?.amount))
            ? `$${data?.tenancyInvoice?.amount}`
            : null
        );
        this.dynamicParameters.set(
          'tenancy_due_date',
          data?.tenancyInvoice?.dueDate
            ? this.formatDate(data?.tenancyInvoice?.dueDate)
            : null
        );
        this.dynamicParameters.set(
          'tenancy_invoice_status',
          data?.tenancyInvoice?.status
        );
        this.dynamicParameters.set(
          'tenancy_name_invoice',
          data?.tenancyInvoice?.tenancyName
        );
        this.dynamicParameters.set(
          'account_name',
          data?.tenancyInvoice?.account?.name
        );
        break;
      case PTWidgetDataField.MAINTENANCE_REQUEST:
        this.dynamicParameters.set('maintenance_summary', data?.summary);
        break;
      case PTWidgetDataField.MAINTENANCE_INVOICE:
        this.dynamicParameters.set(
          'maintenance_creditor_name',
          this.sharedService.displayName(
            data?.supplier?.firstName,
            data?.supplier?.lastName
          )
        );
        this.dynamicParameters.set(
          'maintenance_invoice_description',
          data?.data?.invoice?.creditorInvoice?.invoiceDescription
        );
        this.dynamicParameters.set(
          'maintenance_invoice_reference',
          data?.data?.invoice?.creditorInvoice?.creditorReference
        );
        !isNaN(parseFloat(data?.data?.invoice?.creditorInvoice?.amount)) &&
          !isNaN(parseFloat(data?.data?.invoice?.creditorInvoice?.gstAmount)) &&
          this.dynamicParameters.set(
            '$maintenance_invoice_amount',
            `$${
              data?.data?.invoice?.creditorInvoice?.amount +
              data?.data?.invoice?.creditorInvoice?.gstAmount
            }`
          );
        this.dynamicParameters.set(
          'maintenance_due_date',
          data?.data?.invoice?.creditorInvoice?.dueDate
            ? this.formatDate(data?.data?.invoice?.creditorInvoice?.dueDate)
            : null
        );
        break;
      case PTWidgetDataField.ROUTINE_INSPECTION:
        this.dynamicParameters.set(
          'routine_inspection_date',
          data?.startTime ? this.formatDate(data?.startTime) : null
        );
        this.dynamicParameters.set(
          'routine_inspection_start_time',
          data?.startTime ? this.formatTime(data?.startTime) : null
        );
        this.dynamicParameters.set(
          'routine_inspection_end_time',
          data?.endTime ? this.formatTime(data?.endTime) : null
        );
        this.dynamicParameters.set(
          'routine_tenant_notes',
          data?.notes?.tenant_notes
        );
        this.dynamicParameters.set(
          'routine_tenant_actions',
          data?.notes?.tenant_actions
        );
        this.dynamicParameters.set(
          'routine_owner_notes',
          data?.notes?.owner_notes
        );
        this.dynamicParameters.set(
          'routine_follow_up_items',
          data?.notes?.owner_followup_items
        );
        this.dynamicParameters.set(
          'via this link',
          "<a href='{via_this_link}' data-action='via_link'>via this link</a>"
        );
        break;
      case PTWidgetDataField.OUTGOING_INSPECTION:
        this.dynamicParameters.set(
          'outgoing_inspection_date',
          data?.startTime ? this.formatDate(data?.startTime) : null
        );
        this.dynamicParameters.set(
          'outgoing_inspection_start_time',
          data?.startTime ? this.formatTime(data?.startTime) : null
        );
        this.dynamicParameters.set(
          'outgoing_inspection_end_time',
          data?.endTime ? this.formatTime(data?.endTime) : null
        );
        this.dynamicParameters.set(
          'outgoing_tenant_notes',
          data?.notes?.tenant_notes
        );
        this.dynamicParameters.set(
          'outgoing_tenant_actions',
          data?.notes?.tenant_actions
        );
        this.dynamicParameters.set(
          'outgoing_owner_notes',
          data?.notes?.owner_notes
        );
        this.dynamicParameters.set(
          'outgoing_follow_up_items',
          data?.notes?.owner_followup_items
        );
        break;
      case PTWidgetDataField.INGOING_INSPECTION:
        this.dynamicParameters.set(
          'ingoing_inspection_date',
          data?.startTime ? this.formatDate(data?.startTime) : null
        );
        this.dynamicParameters.set(
          'ingoing_inspection_start_time',
          data?.startTime ? this.formatTime(data?.startTime) : null
        );
        this.dynamicParameters.set(
          'ingoing_inspection_end_time',
          data?.endTime ? this.formatTime(data?.endTime) : null
        );
        this.dynamicParameters.set(
          'ingoing_tenant_notes',
          data?.notes?.tenant_notes
        );
        this.dynamicParameters.set(
          'ingoing_tenant_actions',
          data?.notes?.tenant_actions
        );
        this.dynamicParameters.set(
          'ingoing_owner_notes',
          data?.notes?.owner_notes
        );
        this.dynamicParameters.set(
          'ingoing_follow_up_items',
          data?.notes?.owner_followup_items
        );
        break;
      case PTWidgetDataField.LEASE_RENEWAL:
        this.dynamicParameters.set(
          'pt_lease_start',
          data?.startDate ? this.formatDate(data?.startDate) : null
        );
        this.dynamicParameters.set(
          'pt_lease_end',
          data?.endDate ? this.formatDate(data?.endDate) : null
        );
        this.dynamicParameters.set(
          '$rent_change_amount',
          !isNaN(parseFloat(data?.rent)) ? `$${data?.rent}` : null
        );
        this.dynamicParameters.set(
          'lease_period_type',
          data?.frequency && FREQUENCY_CHECK[data?.frequency]
        );
        this.dynamicParameters.set(
          'rent_change_effective_date',
          data?.effectiveDate ? this.formatDate(data?.effectiveDate) : null
        );
        this.dynamicParameters.set(
          'signed_lease_document_name',
          data?.file && data?.file?.map((item) => item?.fileName).join(', ')
        );
        break;
      case PTWidgetDataField.TENANT_VACATES:
        this.dynamicParameters.set('vacate_type', formatVacateType?.text);
        this.dynamicParameters.set(
          'notice_date',
          data?.noticeDate ? this.formatDate(data?.noticeDate) : null
        );
        this.dynamicParameters.set(
          'vacate_date',
          data?.vacateDate ? this.formatDate(data?.vacateDate) : null
        );
        this.dynamicParameters.set(
          'termination_date',
          data?.terminationDate ? this.formatDate(data?.terminationDate) : null
        );
        this.dynamicParameters.set(
          'charge_to_date',
          data?.chargeToDate ? this.formatDate(data?.chargeToDate) : null
        );
        this.dynamicParameters.set('vacate_description', data?.description);
        break;
      case PTWidgetDataField.LEASING:
        this.dynamicParameters.set(
          'leasing_tenancy_name',
          data?.data?.tenancyName
        );
        this.dynamicParameters.set(
          'leasing_original_lease_start',
          data?.data?.originalLeaseStartDate
            ? this.formatDate(data?.data?.originalLeaseStartDate)
            : null
        );
        this.dynamicParameters.set(
          'leasing_lease_start',
          data?.data?.leaseStartDate
            ? this.formatDate(data?.data?.leaseStartDate)
            : null
        );
        this.dynamicParameters.set(
          'leasing_lease_end',
          data?.data?.leaseEndDate
            ? this.formatDate(data?.data?.leaseEndDate)
            : null
        );
        this.dynamicParameters.set(
          'leasing_lease_period',
          data?.data?.leasePeriod
        );
        this.dynamicParameters.set(
          'leasing_period_type',
          PeriodTypeString[data?.data?.leasePeriodType]
        );
        this.dynamicParameters.set(
          '$leasing_rent_amount',
          !isNaN(parseFloat(data?.data?.rentAmount))
            ? `$${data?.data?.rentAmount}`
            : null
        );
        this.dynamicParameters.set(
          'leasing_payment_period',
          EPaymentType[data?.data?.paymentPeriod]
        );
        this.dynamicParameters.set(
          'rent_start_date',
          data?.data?.rentStartDate
            ? this.formatDate(data?.data?.rentStartDate)
            : null
        );
        this.dynamicParameters.set(
          'rent_description',
          data?.data?.rentDescription
        );
        this.dynamicParameters.set(
          'next_rent_review',
          data?.data?.nextRentReview
            ? this.formatDate(data?.data?.nextRentReview)
            : null
        );
        this.dynamicParameters.set(
          'bond_account_name',
          data?.data?.securityDeposit?.accountName
        );
        this.dynamicParameters.set(
          '$bond_required_amount',
          !isNaN(parseFloat(data?.data?.securityDeposit?.amount))
            ? `$${data?.data?.securityDeposit?.amount}`
            : null
        );
        this.dynamicParameters.set(
          '$bond_amount_lodged_direct',
          !isNaN(parseFloat(data?.data?.securityDeposit?.amountLodgedDirect))
            ? `$${data?.data?.securityDeposit?.amountLodgedDirect}`
            : null
        );
        break;
      case PTWidgetDataField.COMPLIANCES:
        this.dynamicParameters.set(
          'compliance_item',
          data?.complianceCategory?.name
        );
        this.dynamicParameters.set('item_managed_by', data?.managedBy);
        this.dynamicParameters.set(
          'item_serviced_by',
          data?.contactInfo &&
            this.sharedService.displayName(
              data?.contactInfo?.firstName,
              data?.contactInfo?.lastName
            )
        );
        this.dynamicParameters.set(
          'authority_form_received_state',
          data?.contactInfo ? formatComplianceType?.text : ''
        );
        this.dynamicParameters.set(
          'expiry_date',
          data?.expiryDate ? this.formatDate(data?.expiryDate) : null
        );
        this.dynamicParameters.set(
          'last_service_date',
          data?.lastServiceDate ? this.formatDate(data?.lastServiceDate) : null
        );
        this.dynamicParameters.set(
          'next_service_date',
          data?.nextServiceDate ? this.formatDate(data?.nextServiceDate) : null
        );
        break;
      default:
        break;
    }
  }

  public setDynamicParamaterRMWidget(type, data) {
    if (!data) return;

    switch (type) {
      case RMWidgetDataField.LEASE_RENEWAL:
        this.dynamicParameters.set(
          'lease_renewal_start',
          data?.startDate ? this.formatDate(data?.startDate) : null
        );
        this.dynamicParameters.set(
          'lease_renewal_end',
          data?.endDate ? this.formatDate(data?.endDate) : null
        );
        this.dynamicParameters.set(
          'lease_renewal_term',
          data?.leaseTermName || ''
        );
        this.dynamicParameters.set(
          'lease_rent_period',
          data?.frequency && FREQUENCY_CHECK[data?.frequency]
        );
        this.dynamicParameters.set(
          'lease_renewal_sign',
          data?.leaseSign ? this.formatDate(data?.leaseSign) : null
        );
        this.dynamicParameters.set(
          'lease_due_day',
          !isNaN(Number(data?.source?.rentDueDay))
            ? this.formatDueDayLeaseRenewal(
                data.source.rentDueDay,
                data?.frequency
              )
            : null
        );
        this.dynamicParameters.set(
          'lease_property_charge',
          this._getDynamicRecurringCharges(
            data?.recurringCharges || [],
            EEntityType.PROPERTY
          )
        );
        this.dynamicParameters.set(
          'lease_unit_charge',
          this._getDynamicRecurringCharges(
            data?.recurringCharges || [],
            EEntityType.UNIT
          )
        );
        this.dynamicParameters.set(
          'lease_unit_type_charge',
          this._getDynamicRecurringCharges(
            data?.recurringCharges || [],
            EEntityType.UNITTYPE
          )
        );
        this.dynamicParameters.set(
          'lease_tenant_charge',
          this._getDynamicRecurringCharges(
            data?.recurringCharges || [],
            EEntityType.TENANT
          )
        );
        break;
      case RMWidgetDataField.RM_ISSUES:
        this.dynamicParameters.set('issue_title', data?.title);
        this.dynamicParameters.set(
          'issue_schedule_date',
          data?.scheduleDate ? this.formatDate(data?.scheduleDate) : null
        );
        this.dynamicParameters.set(
          'issue_due_date',
          data?.dueDate ? this.formatDate(data?.dueDate) : null
        );
        this.dynamicParameters.set(
          'issue_open_date',
          data?.openDate ? this.formatDate(data?.openDate) : null
        );
        this.dynamicParameters.set(
          'issue_open_time',
          data?.openDate ? this.formatTime(data?.openDate) : null
        );
        this.dynamicParameters.set(
          'issue_close_date',
          data?.closeDate ? this.formatDate(data?.closeDate) : null
        );
        this.dynamicParameters.set(
          'issue_close_time',
          data?.closeDate ? this.formatTime(data?.closeDate) : null
        );
        this.dynamicParameters.set(
          'issue_status',
          data?.details.serviceManagerStatus?.name
            ? `${data?.details.serviceManagerStatus?.name.replace(/<|>/g, '')}`
            : null
        );
        this.dynamicParameters.set(
          'issue_category',
          data?.details?.serviceManagerCategory?.name
            ? `${data?.details?.serviceManagerCategory?.name.replace(
                /<|>/g,
                ''
              )}`
            : null
        );
        this.dynamicParameters.set(
          'issue_priority',
          data?.details?.serviceManagerPriority?.name
            ? `${data?.details?.serviceManagerPriority?.name.replace(
                /<|>/g,
                ''
              )}`
            : null
        );
        this.dynamicParameters.set(
          'issue_project',
          data?.details?.serviceManagerProject?.name
        );
        this.dynamicParameters.set(
          'issue_vendor',
          data?.details?.user?.lastName
        );
        this.dynamicParameters.set(
          'issue_job',
          data?.details?.serviceManagerJob?.name
        );
        this.dynamicParameters.set(
          'issue_description',
          data?.details?.description
        );
        this.dynamicParameters.set(
          'issue_resolution',
          data?.details?.resolution
        );
        this.dynamicParameters.set(
          'inventory_item',
          this.formaInventoryItem(data?.workOrder)
        );
        this.dynamicParameters.set(
          'checklist_description',
          this.formatDescription(data?.checklist)
        );
        this.dynamicParameters.set(
          'issue_note_description',
          this.formatDescription(data?.historyNotes)
        );
        break;
      case RMWidgetDataField.RM_INSPECTIONS:
        this.dynamicParameters.set(
          'inspection_tenant',
          data?.userPropertyGroup?.name
        );
        this.dynamicParameters.set(
          'inspection_status',
          data?.inspectionStatus?.name
        );
        this.dynamicParameters.set(
          'inspection_type',
          data?.inspectionType?.name
        );
        this.dynamicParameters.set(
          'inspection_date',
          data.inspectionDate ? this.formatDate(data.inspectionDate) : null
        );
        this.dynamicParameters.set(
          'scheduled_inspection_date',
          data.scheduledDate ? this.formatDate(data.scheduledDate) : null
        );
        this.dynamicParameters.set('inspection_description', data?.description);
        this.dynamicParameters.set('inspection_notes', data?.notes);
        this.dynamicParameters.set(
          'inspection_item_details',
          this.formatInspectionItemDetail(data?.inspectionAreas)
        );
        this.dynamicParameters.set(
          'inspection_item',
          this.flattenInspectionItems(data?.inspectionAreas)
            .map((item) => item.name)
            .join(', ')
        );
        this.dynamicParameters.set(
          'inspection_area',
          data?.inspectionAreas.map((item) => item.name).join(', ')
        );
        break;
      case RMWidgetDataField.RM_NOTES:
        this.dynamicParameters.set('note_description', data?.description);
        break;
      case RMWidgetDataField.VACATE_DETAIL:
        this.dynamicParameters.set('vacate_tenant', data?.tenancy?.name);
        this.dynamicParameters.set(
          'move_in_date',
          data?.moveInDate ? this.formatDate(data?.moveInDate) : null
        );
        this.dynamicParameters.set(
          'move_out_date',
          data?.vacateDate ? this.formatDate(data?.vacateDate) : null
        );
        this.dynamicParameters.set(
          'notice_date',
          data?.noticeDate ? this.formatDate(data?.noticeDate) : null
        );
        this.dynamicParameters.set(
          'expected_move_out',
          data?.expectedMoveOutDate
            ? this.formatDate(data?.expectedMoveOutDate)
            : null
        );
        break;
      case RMWidgetDataField.NEW_TENANT:
        const {
          firstName,
          lastName,
          addresses,
          subsidyTenants,
          deposit,
          settings,
          lease,
          contacts,
          charges,
          recurringCharges,
          userDefinedValues
        } = data.data || {};
        const { amount, transactionDate, chargeType } = deposit || {};
        const { defaultTaxTypeName, rentPeriod, rentDueDay } = settings || {};
        const {
          moveInDate,
          vacateDate,
          noticeDate,
          expectedMoveOutDate,
          startDate,
          endDate,
          source,
          leaseTermName
        } = lease || {};
        this.dynamicParameters.set('new_tenant_first_name', firstName);
        this.dynamicParameters.set('new_tenant_last_name', lastName);
        this.dynamicParameters.set(
          'new_tenant_address',
          this._getNewAddressValue(addresses)
        );
        this.dynamicParameters.set(
          'tenant_move_in_date',
          this._formatDate(moveInDate)
        );
        this.dynamicParameters.set(
          'tenant_move_out_date',
          this._formatDate(vacateDate)
        );
        this.dynamicParameters.set(
          'tenant_notice_date',
          this._formatDate(noticeDate)
        );
        this.dynamicParameters.set(
          'tenant_expected_move_out',
          this._formatDate(expectedMoveOutDate)
        );
        this.dynamicParameters.set(
          'tenant_lease_start',
          this._formatDate(startDate)
        );
        this.dynamicParameters.set(
          'tenant_lease_end',
          this._formatDate(endDate)
        );
        this.dynamicParameters.set(
          'tenant_lease_sign',
          this._formatDate(source?.leaseSign)
        );
        this.dynamicParameters.set('tenant_lease_term', leaseTermName);
        this.dynamicParameters.set(
          'tenant_contact_name',
          this._getNewTenantContactValue(contacts)
        );
        this.dynamicParameters.set(
          'deposit_type',
          deposit ? `${chargeType?.name} - ${chargeType?.description}` : null
        );
        this.dynamicParameters.set(
          'deposit_amount',
          amount ? `$${this._formatAmount(amount)}` : null
        );
        this.dynamicParameters.set(
          'deposit_date',
          this._formatDate(transactionDate)
        );
        this.dynamicParameters.set('tenant_rent_period', rentPeriod);
        this.dynamicParameters.set(
          'tenant_due_day',
          this._getDueDate(rentPeriod, rentDueDay)
        );
        this.dynamicParameters.set('tax_type_ID', defaultTaxTypeName);
        this.dynamicParameters.set(
          'tenant_subsidies',
          this._getSubsidiesValue(subsidyTenants)
        );
        this.dynamicParameters.set(
          'property_charge_of_new_tenant',
          this._getPropertyChangeValue(recurringCharges, EEntityType.PROPERTY)
        );
        this.dynamicParameters.set(
          'unit_charge_of_new_tenant',
          this._getPropertyChangeValue(recurringCharges, EEntityType.UNIT)
        );
        this.dynamicParameters.set(
          'unit_type_charge_of_new_tenant',
          this._getPropertyChangeValue(recurringCharges, EEntityType.UNITTYPE)
        );
        this.dynamicParameters.set(
          'tenant_charge_of_new_tenant',
          this._getPropertyChangeValue(recurringCharges, EEntityType.TENANT)
        );
        this.dynamicParameters.set(
          'one_time_charges',
          this._getOneTimeChangeValue(charges)
        );
        this.dynamicParameters.set(
          'user_defined_fields',
          this._getUserDefinedFieldValue(userDefinedValues)
        );
        break;
      default:
        break;
    }
  }

  flattenInspectionItems(originalItems) {
    if (!originalItems?.length) return [];
    return originalItems.flatMap((area) =>
      area.inspectionAreaItems.map((item) => ({
        status: item.status,
        note: item.note,
        name: item.name
      }))
    );
  }

  private formatInspectionItemDetail(inspection) {
    if (!inspection?.length) return '';
    let temInspection = this.flattenInspectionItems(inspection);

    const result = temInspection
      .map((is) => {
        const infos = [];
        if (is.status) {
          infos.push(`<li>Status: ${is.status}</li>`);
        }
        if (is.note) {
          infos.push(`<li>Note: ${is.note}</li>`);
        }
        return `<li>${
          is.name
        }<br data-mce-bogus="1"></li><ul style="list-style-type: disc;" data-mce-style="list-style-type: disc;">${infos.join(
          ''
        )}</ul>`;
      })
      .join('');
    return `<ol style="list-style-type: circle;" data-mce-style="list-style-type: circle;">${result}</ol>`;
  }

  private _formatDate(date) {
    return date
      ? dayjs(date).format(
          this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS
        )
      : null;
  }

  private _getDueDate(rentPeriod, rentDueDay) {
    if (rentPeriod?.toUpperCase() !== Efrequency.WEEKLY) return rentDueDay;
    return WEEKLY_CHECK[rentDueDay];
  }

  private _getNewTenantContactValue(contacts) {
    const list = contacts.map((item, i) => {
      const displayName = this.sharedService.displayName(
        item?.firstName,
        item?.lastName
      );
      const contactInfo = [
        contacts?.length === 1
          ? `<li>- Name: ${displayName}</li>`
          : `<li>${i + 1}. Name: ${displayName}</li>`,
        item?.contactType ? `<li>- Contact type: ${item.contactType}</li>` : '',
        item?.email ? `<li>- Email address: ${item.email}</li>` : '',
        item?.phoneNumber
          ? `<li>- Phone number: ${this._formatPhoneNumber(
              item.phoneNumber
            )}</li>`
          : '',
        item?.applicantType
          ? `<li>- Applicant type: ${
              item.applicantType === 'Applicant'
                ? 'Primary'
                : item.applicantType
            }</li>`
          : ''
      ]
        .filter(Boolean)
        .join('');

      return `<ul style="padding-inline-start: 0;">${contactInfo}</ul>`;
    });

    return list.join('');
  }

  private _getSubsidiesValue(subsidyTenants) {
    let resultHTML;
    if (subsidyTenants.length === 1) {
      resultHTML = `<li>- ${
        subsidyTenants[0]?.name || subsidyTenants[0]?.subsidy?.name
      }</li>`;
    } else {
      resultHTML = subsidyTenants
        .map((item) => `<li>- ${item?.name || item?.subsidy?.name}</li>`)
        .join('');
    }
    return resultHTML
      ? `<ul style="padding-inline-start: 0;">${resultHTML}</ul>`
      : null;
  }

  private _getOneTimeChangeValue(charges) {
    const list = charges.map((item, i) => {
      const changeTypeDisplay = `${item.chargeType?.name} - ${item.chargeType?.description}`;
      const itemList = [
        charges.length === 1 ? `<li>- ${changeTypeDisplay}</li>` : '',
        charges.length > 1 ? `<li>${i + 1}. ${changeTypeDisplay}</li>` : '',
        item.amount
          ? `<li>- Amount: $${this._formatAmount(item.amount)}</li>`
          : '',
        item.transactionDate
          ? `<li>- Date: ${this._formatDate(item.transactionDate)}</li>`
          : '',
        item.reference ? `<li>- Reference: ${item.reference}</li>` : '',
        item.comment ? `<li>- Comment: ${item.comment}</li>` : ''
      ]
        .filter(Boolean)
        .join('');

      return `<ul style="padding-inline-start: 0;">${itemList}</ul>`;
    });

    return list.join('');
  }

  private _getPropertyChangeValue(charges, type: EEntityType) {
    const chargeType = charges.filter(
      (charge) => !charge?.isException && charge?.entityType === type
    );
    const list = chargeType.map((item, i) => {
      const itemList = [
        chargeType.length === 1
          ? `<li>- ${item.chargeType?.description}</li>`
          : '',
        chargeType.length > 1
          ? `<li>${i + 1}. ${item.chargeType?.description}</li>`
          : '',
        item?.amount || item?.amount === 0
          ? `<li>- Amount: $${this._formatAmount(item.amount)}</li>`
          : '',
        item?.fromDate
          ? `<li>- From date: ${this._formatDate(item.fromDate)}</li>`
          : '',
        item?.toDate
          ? `<li>- To date: ${this._formatDate(item.toDate)}</li>`
          : '',
        item?.frequency ? `<li>- Frequency: ${item?.frequency}</li>` : ''
      ]
        .filter(Boolean)
        .join('');

      return `<ul style="padding-inline-start: 0;">${itemList}</ul>`;
    });

    return list.join('');
  }

  private _getUserDefinedFieldValue(userDefinedValues) {
    const list = userDefinedValues.map((item, i) => {
      const { fieldName, attachment, value } = item || {};
      const valueReplace = value?.split(',')?.join(', ');
      const userDefine = `<li>- ${fieldName}: ${
        attachment ? attachment.fileName : valueReplace
      }</li>`;

      return `<ul style="padding-inline-start: 0;">${userDefine}</ul>`;
    });

    return list.join('');
  }

  private _getNewAddressValue(addresses) {
    if (!addresses) return null;
    const list = addresses.map((item) =>
      item.address
        ? `<li>- ${item?.addressType?.name} address: ${item.address}</li>`
        : ''
    );
    const data = list.join('');
    return data ? `<ul style="padding-inline-start: 0;">${data}</ul>` : null;
  }

  private _formatPhoneNumber(phoneNumber) {
    const digits = phoneNumber.replace(/\D/g, '');
    const formattedNumber = digits.replace(
      PHONE_NUMBER_START_3_GROUP_4,
      '$1 $2 $3 $4 $5 $6'
    );

    return formattedNumber;
  }

  private _formatAmount(value): string {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      return value;
    }
    const fixedValue = numericValue.toFixed(2);
    const formattedValue = fixedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return formattedValue.indexOf('.') === -1
      ? `${formattedValue}.00`
      : formattedValue;
  }

  private formatDueDayLeaseRenewal(dueDay, frequency) {
    switch (frequency) {
      case FrequencyRental.MONTHLY:
        return dueDay;
      case FrequencyRental.WEEKLY:
        return WEEKLY_CHECK[dueDay];
      default:
        break;
    }
  }

  private formatDescription(list) {
    if (!list?.length) return '';

    const result = list
      .map((rc) => {
        const infos = [];
        if (rc.description) {
          list.length === 1
            ? infos.push(`${rc.description}`)
            : infos.push(`<li>${rc.description}</li>`);
        }
        if (rc.note) {
          list.length === 1
            ? infos.push(`${rc.note}`)
            : infos.push(`<li>${rc.note}</li>`);
        }

        if (list.length === 1) return `${infos.join('')}`;

        return `<ul style="padding-inline-start: 0;"><li style="list-style-type: none;"><ul style="list-style-type: disc;" data-mce-style="list-style-type: disc;">${infos.join(
          ''
        )}</ul></li></ul>`;
      })
      .join('');

    return `${result}`;
  }

  private formaInventoryItem(workOrder) {
    if (!workOrder?.length) return '';

    const result = workOrder
      .map((rc) => {
        const inventoryItem = rc?.serviceManagerInventoryItem?.name
          ? rc?.serviceManagerInventoryItem?.name
          : '';
        const infos = [];
        if (rc.description) {
          infos.push(`<li>Description: ${rc.description}</li>`);
        }
        if (rc.quantity) {
          infos.push(`<li>Quantity: ${rc.quantity}</li>`);
        }
        if (rc.cost) {
          infos.push(`<li>Cost: $${rc.cost}</li>`);
        }
        if (rc.salePrice) {
          infos.push(`<li>Sale price: $${rc.salePrice}</li>`);
        }
        if (rc.totalPrice) {
          infos.push(`<li>Total: $${rc.totalPrice}</li>`);
        }
        if (rc.bills) {
          const prefillBill = rc.bills
            ?.filter(Boolean)
            .map((item) => CHECK_BILLS[item.type]);
          infos.push(`<li>Linked: ${prefillBill.join(' ')}</li>`);
        }
        if (workOrder.length === 1)
          return `<ul style="padding-inline-start: 0;"><li style="list-style-type: none;"><ul style="list-style-type: disc;" data-mce-style="list-style-type: disc;"><li>Inventory item: ${inventoryItem}</li>${infos.join(
            ''
          )}</ul></li></ul>`;

        return `<li>Inventory item: ${inventoryItem}<br data-mce-bogus="1"></li><ul style="padding-inline-start: 0;"><li style="list-style-type: none;"><ul style="list-style-type: disc;" data-mce-style="list-style-type: disc;">${infos.join(
          ''
        )}</ul></li></ul>`;
      })
      .join('');

    if (workOrder.length === 1) return `<div>${result}</div>`;

    return `<ol style="list-style-type: decimal;" data-mce-style="list-style-type: decimal;">${result}</ol>`;
  }

  private _getDynamicRecurringCharges(
    recurringCharges: ERecurringCharge[],
    type: EEntityType
  ) {
    if (!recurringCharges.length) return null;
    return this.formatDynamicRecurringCharges(
      recurringCharges.filter((charge) => charge.entityType === type)
    );
  }

  private formatDynamicRecurringCharges(recurringCharges: ERecurringCharge[]) {
    if (!recurringCharges?.length) return '';
    const listOrder = {
      [EEntityType.PROPERTY]: 1,
      [EEntityType.UNIT]: 2,
      [EEntityType.UNITTYPE]: 3,
      [EEntityType.TENANT]: 4
    };

    const result = recurringCharges
      .reverse()
      .sort((a, b) => {
        const entityTypeA = listOrder[a?.entityType] || 0;
        const entityTypeB = listOrder[b?.entityType] || 0;

        // sort by entityType
        if (entityTypeA !== entityTypeB) {
          return entityTypeA - entityTypeB;
        }

        // If entityType is the same, then sort by createdAt
        const dateA = new Date(a?.createdAt)?.getTime();
        const dateB = new Date(b?.createdAt)?.getTime();
        if (dateA !== dateB) {
          return dateA - dateB;
        }

        return a.amount - b.amount;
      })
      .map((rc) => {
        const chargeType =
          typeof rc.chargeType === 'string'
            ? rc.chargeType
            : rc.chargeType?.description;
        const infos = [];

        infos.push(`<li>Amount: $${this._formatAmount(rc?.amount || 0)}</li>`);

        if (rc.fromDate) {
          infos.push(`<li>From date: ${this.formatDate(rc.fromDate)}</li>`);
        }
        if (rc.toDate) {
          infos.push(`<li>To date: ${this.formatDate(rc.toDate)}</li>`);
        }
        if (rc.frequency) {
          infos.push(`<li>Frequency: ${rc.frequency}</li>`);
        }
        if (recurringCharges.length === 1)
          return `<ul style="padding-inline-start: 0;"><li style="list-style-type: none;"><ul style="list-style-type: disc;" data-mce-style="list-style-type: disc;"><li>${chargeType}</li>${infos.join(
            ''
          )}</ul></li></ul>`;

        return `<li>${chargeType}<br data-mce-bogus="1"></li><ul style="padding-inline-start: 0;"><li style="list-style-type: none;"><ul style="list-style-type: disc;" data-mce-style="list-style-type: disc;">${infos.join(
          ''
        )}</ul></li></ul>`;
      })
      .join('');

    if (recurringCharges.length === 1) return `<div>${result}</div>`;

    return `<ol style="list-style-type: decimal;" data-mce-style="list-style-type: decimal;">${result}</ol>`;
  }

  public setDynamicParametersForApplicationShortlist(
    application: IDataApplicationShortlistVariable
  ) {
    this.dynamicParameters.set(
      'application_name_1',
      application.application_name_1
    );
    this.dynamicParameters.set(
      'application_summary_1',
      application.application_summary_1
    );
    this.dynamicParameters.set(
      'application_name_2',
      application.application_name_2
    );
    this.dynamicParameters.set(
      'application_summary_2',
      application.application_summary_2
    );
    this.dynamicParameters.set(
      'application_name_3',
      application.application_name_3
    );
    this.dynamicParameters.set(
      'application_summary_3',
      application.application_summary_3
    );
  }

  public prefillDynamicParameters(sendBulk?: boolean) {
    if (!this.template) return '';
    let templateData = this.template;
    if (sendBulk) return templateData;
    const validDynamicParameters = [
      /<span style="color: var\(--fg-brand, #28ad99\);" contenteditable="false">(.*?)<\/span>/g,
      /<span style='color: var\(--fg-brand, #28ad99\);' contenteditable='false'>(.*?)<\/span>/g,
      /<span style="color: var\(--trudi-primary, #00aa9f\);" contenteditable="false">(.*?)<\/span>/g,
      /<span style='color: var\(--trudi-primary, #00aa9f\);' contenteditable='false'>(.*?)<\/span>/g
    ];

    validDynamicParameters.forEach((regex) => {
      templateData = templateData
        .replace(/class="custom-cursor-default-hover" /g, '')
        .replace(regex, (match, p1) => {
          p1 = p1.trim();
          if (!this.dynamicParameters.get(p1)) {
            return `<span style="color: var\(--danger-500, #fa3939\);" contenteditable="false">${this.checkFallBackVariable(
              p1
            )}<\/span>`;
          }
          return this.dynamicParameters.get(p1);
        });
    });

    return templateData;
  }

  checkFallBackVariable(key: string) {
    if (key === 'file_sender_name' && !DynamicParameterFallBack[key]) return '';
    return DynamicParameterFallBack[key] || EFallback.UNKNOWN;
  }

  public resetDynamicParameters(listKeys: Set<string>) {
    // reset before set parameter
    for (const item of listKeys.values()) {
      this.dynamicParameters.delete(item);
    }
  }

  public resetAllParameters() {
    // reset all before set parameter
    DynamicParameter.clear();
    this.dynamicParameters.clear();
  }

  attachInspectionMedia(template) {
    const msg = template;
    if (!msg) return false;
    const regex =
      /<span style="color: var\(--fg-brand, #28ad99\);" contenteditable="false">(.*?)<\/span>/g;
    let match = null;
    while ((match = regex.exec(msg)) !== null) {
      const param = match[1];
      if (param === 'inspection_item_details') {
        return true;
      }
    }
    return false;
  }

  isExistedTenantFileDynamic(template) {
    const msg = template;
    if (!msg) return false;
    const regex =
      /<span style="color: var\(--fg-brand, #28ad99\);" contenteditable="false">(.*?)<\/span>/g;
    let match = null;
    while ((match = regex.exec(msg)) !== null) {
      const param = match[1];
      if (param === 'user_defined_fields') {
        return true;
      }
    }
    return false;
  }

  public setDynamicParamaterPmInline(selectedSender) {
    this.dynamicParameters.set('sender_name', selectedSender?.name);
    this.dynamicParameters.set('sender_role', selectedSender?.title);
  }

  public setDynamicFieldRecipientForInline(
    receiver,
    propertyType: EUserPropertyType | string = ''
  ) {
    const isTenantOrOwnerOrSupplierOrOtherOrExternal =
      receiver?.type?.toUpperCase().includes(EConfirmContactType.OWNER) ||
      receiver?.type?.toUpperCase().includes(EConfirmContactType.TENANT) ||
      propertyType === EUserPropertyType.SUPPLIER ||
      propertyType === EUserPropertyType.OTHER ||
      propertyType === EUserPropertyType.EXTERNAL;
    const firstName = receiver?.firstName || '';
    const lastName = receiver?.lastName || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    this.inlineDynamicParameters.set('user_first_name', firstName);
    this.inlineDynamicParameters.set('user_full_name', fullName);
    this.inlineDynamicParameters.set(
      'user_role',
      isTenantOrOwnerOrSupplierOrOtherOrExternal ? receiver?.type : null
    );
  }

  public setDynamicParametersTenancyNameInline(name: string) {
    this.inlineDynamicParameters.set('tenancy_name', name ?? null);
    this.inlineDynamicParameters.set('tenant_name', name ?? null);
  }

  public setDynamicParametersTenancyInline(tenancy: Personal) {
    const idCRMSystem = tenancy?.idCRMSystem
      ? tenancy.idCRMSystem.toString()
      : null;
    this.inlineDynamicParameters.set('tenancy_id', idCRMSystem);
    this.inlineDynamicParameters.set('tenant_id', idCRMSystem);
    tenancy?.userPropertyGroupLeases?.[0]?.startDate &&
      this.inlineDynamicParameters.set(
        'lease_start',
        this.formatDate(tenancy?.userPropertyGroupLeases?.[0]?.startDate)
      );
    tenancy?.userPropertyGroupLeases?.[0]?.endDate &&
      this.inlineDynamicParameters.set(
        'lease_end',
        this.formatDate(tenancy.userPropertyGroupLeases?.[0]?.endDate)
      );
    const rentAmount = !isNaN(
      parseFloat(tenancy?.userPropertyGroupLeases?.[0]?.rentAmount)
    )
      ? `${
          tenancy?.userPropertyGroupLeases?.[0]?.rentAmount
        } ${formatFrequencyName(
          tenancy?.userPropertyGroupLeases?.[0]?.frequency
        )}`
      : null;
    const effectiveArrearsAmount = !isNaN(
      parseFloat(
        tenancy?.arrears?.filter((item) => item.type === ArrearsType.RENT)?.[0]
          ?.effectiveArrearsAmount
      )
    )
      ? `$${this._formatAmount(
          tenancy?.arrears?.filter(
            (item) => item.type === ArrearsType.RENT
          )?.[0]?.effectiveArrearsAmount
        )}`
      : null;
    this.inlineDynamicParameters.set(
      '$rent_amount',
      rentAmount ? `$${this._formatAmount(rentAmount)}` : null
    );
    this.dynamicParameters.set(
      '$effective_rent_arrears_amount',
      effectiveArrearsAmount ? `${effectiveArrearsAmount}` : null
    );
    this.inlineDynamicParameters.set(
      'lease_period',
      tenancy?.userPropertyGroupLeases?.[0]?.leasePeriod
    );
    this.inlineDynamicParameters.set(
      'period_type',
      tenancy?.userPropertyGroupLeases?.[0]?.leasePeriodType
    );
    this.inlineDynamicParameters.set(
      'rent_period',
      tenancy?.userPropertyGroupLeases?.[0]?.frequency &&
        FREQUENCY_CHECK[tenancy?.userPropertyGroupLeases?.[0]?.frequency]
    );
    this.inlineDynamicParameters.set(
      'due_day',
      !isNaN(Number(tenancy?.userPropertyGroupLeases?.[0]?.dueDay))
        ? this._getDueDate(
            tenancy?.userPropertyGroupLeases?.[0]?.frequency,
            tenancy?.userPropertyGroupLeases?.[0]?.dueDay
          )?.toString()
        : null
    );
    this.inlineDynamicParameters.set(
      'tenant_charge',
      this._getDynamicRecurringCharges(
        tenancy?.recurringCharges || [],
        EEntityType.TENANT
      )
    );
  }

  public resetDynamicParametersInline(listKeys: Set<string>) {
    // reset before set parameter
    for (const item of listKeys.values()) {
      this.inlineDynamicParameters.delete(item);
    }
  }

  public setDynamicParametersLandlordInline(name: string) {
    this.inlineDynamicParameters.set('owner_name', name ?? null);
  }

  public getDynamicValueForInline(option) {
    let param = option?.param?.trim();
    const mapExclude = this.dynamicParameters;
    const keysToExclude = [
      'owner_name',
      'tenancy_name',
      'tenancy_id',
      'tenant_name',
      'tenant_id',
      'lease_start',
      'lease_end',
      '$rent_amount',
      '$effective_rent_arrears_amount',
      'lease_period',
      'period_type',
      'rent_period',
      'due_day',
      'tenant_charge'
    ];

    for (const key of keysToExclude) {
      mapExclude.delete(key);
    }

    const dynamicParam = !mapExclude.get(param)?.toString()?.includes('{')
      ? mapExclude.get(param)
      : null;
    if (!this.inlineDynamicParameters.get(param) && !dynamicParam) {
      return `<span style="color: var\(--danger-500, #fa3939\);" contenteditable="false">${this.checkFallBackVariable(
        param
      )}<\/span>`;
    }

    return this.inlineDynamicParameters.get(param) || dynamicParam;
  }

  public handleReplaceDynamicParamsForInline(optimizedContent) {
    optimizedContent = optimizedContent || '';
    let validParamTag = `<span style="color: var(--fg-brand, #28ad99);" contenteditable="false">`;
    let inValidParamTag = `<span style="color: var(--danger-500, #fa3939);" contenteditable="false" title="Missing data for some contacts">`;

    optimizedContent = optimizedContent.replaceAll(
      inValidParamTag,
      validParamTag
    );

    const replacements = [
      {
        pattern:
          /<span style="color: var\(--danger-500, #fa3939\);" contenteditable="false">unknown<\/span>/gi,
        value: EFallback.UNKNOWN
      },
      {
        pattern:
          /<span style="color: var\(--danger-500, #fa3939\);" contenteditable="false">N\/A<\/span>/gi,
        value: EFallback.NOT_APPLICABLE
      },
      {
        pattern:
          /<span style="color: var\(--danger-500, #fa3939\);" contenteditable="false">unavailable<\/span>/gi,
        value: EFallback.UNAVAILABLE
      },
      {
        pattern:
          /<p><img id="[^"]*" class="image-loading" src="\/assets\/images\/loading-iframe.gif"><\/p>/g,
        value: ''
      }
    ];

    for (const replacement of replacements) {
      optimizedContent = optimizedContent.replace(
        replacement.pattern,
        replacement.value
      );
    }
    return optimizedContent;
  }

  public getDynamicValueForSendMsgV3(param) {
    return this.dynamicParameters.get(param);
  }

  public handleReplaceCommonDynamicParamsInMess(
    receiver,
    sender,
    agency,
    calendarEvent,
    propertyId?: string,
    participants = []
  ) {
    const requestSummary = this.getRequestSummaryFromActionItem(
      receiver?.linkedActions?.[0]
    );
    const hasOneSubscription = agency.agencies?.length === 1;
    const firstNames = getTextFromDynamicRecipientVariable(
      participants,
      propertyId
    ).firstNames;
    const fullNames = getTextFromDynamicRecipientVariable(
      participants,
      propertyId
    ).fullNames;
    const roles = getTextFromDynamicRecipientVariable(
      participants,
      propertyId
    ).roles;

    let validParamTag =
      /<span style="color: var\(--fg-brand, #28ad99\);" contenteditable="false">/g;
    let validParamGreetingTag =
      /<span id="recipient-element" style="color: var\(--fg-brand, #28ad99\);" contenteditable="false">/g;
    const infoToPrefill = receiver || {};
    const rentAmountValue =
      infoToPrefill.userPropertyGroupLeases?.[0]?.rentAmount ||
      infoToPrefill?.tenancies?.userPropertyGroupLeases?.[0]?.rentAmount;
    const rentArrearAmountValue = infoToPrefill?.tenancies?.arrears?.filter(
      (item) => item.type === ArrearsType.RENT
    )?.[0]?.effectiveArrearsAmount;
    const frequencyValue =
      infoToPrefill.userPropertyGroupLeases?.[0]?.frequency ||
      infoToPrefill?.tenancies?.userPropertyGroupLeases?.[0]?.frequency;
    const rentAmount = !isNaN(parseFloat(rentAmountValue))
      ? `$${this._formatAmount(rentAmountValue)} ${formatFrequencyName(
          frequencyValue
        )}`
      : null;
    const rentArrearAmount = !isNaN(parseFloat(rentArrearAmountValue))
      ? `$${this._formatAmount(rentArrearAmountValue)}`
      : null;
    const phoneNumber = agency.phoneNumber
      ? `${this.areaCode}${agency.phoneNumber}`
      : '';
    return [
      {
        pattern: new RegExp(
          `${validParamGreetingTag.source}user_first_name<\/span>`,
          'g'
        ),
        value: firstNames || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}user_first_name<\/span>`,
          'g'
        ),
        value: firstNames || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}user_role<\/span>`, 'g'),
        value: roles || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}user_fullname<\/span>`,
          'g'
        ),
        value: fullNames || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamGreetingTag.source}user_full_name<\/span>`,
          'g'
        ),
        value: fullNames || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}user_full_name<\/span>`,
          'g'
        ),
        value: fullNames || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}request_summary<\/span>`,
          'g'
        ),
        value: requestSummary || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}short_property_address<\/span>`,
          'g'
        ),
        value: infoToPrefill.property?.shortenStreetLine || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}full_property_address<\/span>`,
          'g'
        ),
        value: infoToPrefill?.property?.streetLine || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}property_region<\/span>`,
          'g'
        ),
        value: infoToPrefill?.property?.regionName || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}company_name<\/span>`, 'g'),
        value: agency?.name || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}company_address<\/span>`,
          'g'
        ),
        value: agency?.address || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}company_phone_number<\/span>`,
          'g'
        ),
        value:
          this.phoneNumberFormat.transform(phoneNumber.replace(/\s/g, '')) ||
          EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}company_link<\/span>`, 'g'),
        value: agency?.websiteUrl
          ? `<a href="${agency?.websiteUrl}">${agency?.websiteUrl}</a>`
          : '' || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}company_account_name<\/span>`,
          'g'
        ),
        value:
          (hasOneSubscription
            ? agency.bankAccounts[0]?.accountName
            : receiver.bankAccount?.accountName) || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}company_account_number<\/span>`,
          'g'
        ),
        value:
          (hasOneSubscription
            ? agency.bankAccounts[0]?.accountNumber
            : receiver.bankAccount?.accountNumber) || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}company_BSB<\/span>`, 'g'),
        value:
          (hasOneSubscription
            ? agency.bankAccounts[0]?.bsb
            : receiver.bankAccount?.bsb) || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}company_working_hours<\/span>`,
          'g'
        ),
        value:
          mapWorkingHoursLabel(
            agency?.regionWorkingHours,
            this.agencyDateFormatService.getCurrentTimezone()
          ) || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}sender_name<\/span>`, 'g'),
        value: sender?.name || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}sender_role<\/span>`, 'g'),
        value: sender?.title || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}tenant_name<\/span>`, 'g'),
        value: infoToPrefill?.tenancies?.name || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}tenant_id<\/span>`, 'g'),
        value: infoToPrefill?.tenancies?.idCRMSystem || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}lease_start<\/span>`, 'g'),
        value: infoToPrefill?.tenancies?.userPropertyGroupLeases?.[0]?.startDate
          ? this.formatDate(
              infoToPrefill?.tenancies?.userPropertyGroupLeases?.[0]?.startDate
            )
          : EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}lease_end<\/span>`, 'g'),
        value: infoToPrefill?.tenancies?.userPropertyGroupLeases?.[0]?.endDate
          ? this.formatDate(
              infoToPrefill?.tenancies?.userPropertyGroupLeases?.[0]?.endDate
            )
          : EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$rent_amount<\/span>`,
          'g'
        ),
        value: rentAmount ? `${rentAmount}` : null || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$bond_amount_required<\/span>`,
          'g'
        ),
        value: !isNaN(parseFloat(infoToPrefill?.tenancies?.bondAmountRequired))
          ? `$${this._formatAmount(
              infoToPrefill?.tenancies?.bondAmountRequired
            )}`
          : EFallback.UNAVAILABLE
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$next_rent_amount<\/span>`,
          'g'
        ),
        value: !isNaN(parseFloat(infoToPrefill?.tenancies?.nextRentAmount))
          ? `$${this._formatAmount(
              infoToPrefill?.tenancies?.nextRentAmount
            )} ${formatFrequencyName(frequencyValue)}`
          : EFallback.UNAVAILABLE
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenant_next_rent_review<\/span>`,
          'g'
        ),
        value: infoToPrefill?.tenancies?.nextRentReviewDate
          ? `${this.formatDate(infoToPrefill?.tenancies?.nextRentReviewDate)}`
          : EFallback.UNAVAILABLE
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$effective_rent_arrears_amount<\/span>`,
          'g'
        ),
        value: rentArrearAmount ? `${rentArrearAmount}` : EFallback.UNAVAILABLE
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}day_rent_in_arrears<\/span>`,
          'g'
        ),
        value: infoToPrefill?.tenancies?.dayRentInArrears
          ? `${infoToPrefill?.tenancies?.dayRentInArrears}`
          : EFallback.UNAVAILABLE
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}effective_rent_paid_to_date<\/span>`,
          'g'
        ),
        value: infoToPrefill?.tenancies?.rentPaidToDate
          ? this.formatDate(infoToPrefill?.tenancies?.rentPaidToDate)
          : EFallback.UNAVAILABLE
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}moving_out_date<\/span>`,
          'g'
        ),
        value: infoToPrefill?.tenancies?.movingOutDate
          ? this.formatDate(infoToPrefill?.tenancies?.movingOutDate)
          : EFallback.UNAVAILABLE
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$total_outstanding_invoices<\/span>`,
          'g'
        ),
        value: !isNaN(
          parseFloat(infoToPrefill?.tenancies?.totalOutStandingInvoice)
        )
          ? `$${this._formatAmount(
              infoToPrefill?.tenancies?.totalOutStandingInvoice
            )}`
          : EFallback.UNAVAILABLE
      },
      {
        pattern: new RegExp(`${validParamTag.source}rent_period<\/span>`, 'g'),
        value:
          (infoToPrefill?.tenancies?.userPropertyGroupLeases?.[0]?.frequency &&
            FREQUENCY_CHECK[
              infoToPrefill?.tenancies?.userPropertyGroupLeases?.[0]?.frequency
            ]) ||
          EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}due_day<\/span>`, 'g'),
        value:
          (!isNaN(
            Number(
              infoToPrefill?.tenancies?.userPropertyGroupLeases?.[0]?.dueDay
            )
          )
            ? this._getDueDate(
                infoToPrefill?.tenancies?.userPropertyGroupLeases?.[0]
                  ?.frequency,
                infoToPrefill?.tenancies?.userPropertyGroupLeases?.[0]?.dueDay
              )
            : null) || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenant_charge<\/span>`,
          'g'
        ),
        value:
          this.formatDynamicRecurringCharges(
            (infoToPrefill?.tenancies?.recurringCharges || []).filter(
              (item) => item?.entityType === EEntityType.TENANT
            )
          ) || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}owner_name<\/span>`, 'g'),
        value: infoToPrefill?.ownerships?.name || EFallback.UNKNOWN
      },
      //PT
      {
        pattern: new RegExp(`${validParamTag.source}tenancy_name<\/span>`, 'g'),
        value: infoToPrefill?.tenancies?.name || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}tenancy_id<\/span>`, 'g'),
        value: infoToPrefill?.tenancies?.idCRMSystem || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}period_type<\/span>`, 'g'),
        value:
          infoToPrefill?.tenancies?.userPropertyGroupLeases?.[0]
            ?.leasePeriodType || EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}lease_period<\/span>`, 'g'),
        value:
          infoToPrefill?.tenancies?.userPropertyGroupLeases?.[0]?.leasePeriod ||
          EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}key_number<\/span>`, 'g'),
        value: infoToPrefill?.property?.keyNumber || EFallback.UNAVAILABLE
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}key_description<\/span>`,
          'g'
        ),
        value: infoToPrefill?.property?.keyDescription || EFallback.UNAVAILABLE
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}next_inspection_date<\/span>`,
          'g'
        ),
        value: infoToPrefill?.property?.nextInspectionStartTime
          ? this.formatDate(
              infoToPrefill?.property?.nextInspectionStartTime,
              INSPECTION_DATE_FORMAT.DATE
            )
          : EFallback.UNAVAILABLE
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}next_inspection_start_time<\/span>`,
          'g'
        ),
        value: infoToPrefill?.property?.nextInspectionStartTime
          ? this.formatDate(
              infoToPrefill?.property?.nextInspectionStartTime,
              INSPECTION_DATE_FORMAT.TIME_V2
            )
          : EFallback.UNAVAILABLE
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}next_inspection_end_time<\/span>`,
          'g'
        ),
        value: infoToPrefill?.property?.nextInspectionEndTime
          ? this.formatDate(
              infoToPrefill?.property?.nextInspectionEndTime,
              INSPECTION_DATE_FORMAT.TIME_V2
            )
          : EFallback.UNAVAILABLE
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$maintenance_expenditure_limit<\/span>`,
          'g'
        ),
        value: !isNaN(parseFloat(infoToPrefill?.property?.expenditureLimit))
          ? `$${infoToPrefill?.property?.expenditureLimit}`
          : EFallback.MAINTENANCE_EXPENDITURE_LIMIT
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}authority_start_date<\/span>`,
          'g'
        ),
        value: infoToPrefill?.property?.authorityStartDate
          ? this.formatDate(infoToPrefill.property.authorityStartDate)
          : EFallback.UNAVAILABLE
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}authority_end_date<\/span>`,
          'g'
        ),
        value: infoToPrefill?.property?.authorityEndDate
          ? this.formatDate(infoToPrefill.property.authorityEndDate)
          : EFallback.UNAVAILABLE
      },

      // ============ CALENDAR_EVENT =================

      // PT_OUTGOING_INSPECTION
      {
        pattern: this.getDynamicParamPattern('outgoing_inspection_date'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.OUTGOING_INSPECTION,
            calendarEvent,
            'outgoing_inspection_date'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('outgoing_inspection_start_time'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.OUTGOING_INSPECTION,
            calendarEvent,
            'outgoing_inspection_start_time'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('outgoing_inspection_end_time'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.OUTGOING_INSPECTION,
            calendarEvent,
            'outgoing_inspection_end_time'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('outgoing_tenant_notes'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.OUTGOING_INSPECTION,
            calendarEvent,
            'outgoing_tenant_notes'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('outgoing_tenant_actions'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.OUTGOING_INSPECTION,
            calendarEvent,
            'outgoing_tenant_actions'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('outgoing_owner_notes'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.OUTGOING_INSPECTION,
            calendarEvent,
            'outgoing_owner_notes'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('outgoing_follow_up_items'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.OUTGOING_INSPECTION,
            calendarEvent,
            'outgoing_follow_up_items'
          ) || EFallback.UNKNOWN
      },

      // PT_INGOING_INSPECTION
      {
        pattern: this.getDynamicParamPattern('ingoing_follow_up_items'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.INGOING_INSPECTION,
            calendarEvent,
            'ingoing_follow_up_items'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('ingoing_owner_notes'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.INGOING_INSPECTION,
            calendarEvent,
            'ingoing_owner_notes'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('ingoing_tenant_actions'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.INGOING_INSPECTION,
            calendarEvent,
            'ingoing_tenant_actions'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('ingoing_tenant_notes'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.INGOING_INSPECTION,
            calendarEvent,
            'ingoing_tenant_notes'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('ingoing_inspection_end_time'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.INGOING_INSPECTION,
            calendarEvent,
            'ingoing_inspection_end_time'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('ingoing_inspection_start_time'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.INGOING_INSPECTION,
            calendarEvent,
            'ingoing_inspection_start_time'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('ingoing_inspection_date'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.INGOING_INSPECTION,
            calendarEvent,
            'ingoing_inspection_date'
          ) || EFallback.UNKNOWN
      },

      // PT_ROUTINE_INSPECTION
      {
        pattern: this.getDynamicParamPattern('via this link'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.ROUTINE_INSPECTION,
            calendarEvent,
            'via this link'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('routine_follow_up_items'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.ROUTINE_INSPECTION,
            calendarEvent,
            'routine_follow_up_items'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('routine_owner_notes'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.ROUTINE_INSPECTION,
            calendarEvent,
            'routine_owner_notes'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('routine_tenant_actions'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.ROUTINE_INSPECTION,
            calendarEvent,
            'routine_tenant_actions'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('routine_tenant_notes'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.ROUTINE_INSPECTION,
            calendarEvent,
            'routine_tenant_notes'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('routine_inspection_end_time'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.ROUTINE_INSPECTION,
            calendarEvent,
            'routine_inspection_end_time'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('routine_inspection_start_time'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.ROUTINE_INSPECTION,
            calendarEvent,
            'routine_inspection_start_time'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('routine_inspection_date'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.ROUTINE_INSPECTION,
            calendarEvent,
            'routine_inspection_date'
          ) || EFallback.UNKNOWN
      },

      // PT_LEASE_RENEWAL
      {
        pattern: this.getDynamicParamPattern('signed_lease_document_name'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.LEASE_RENEWAL,
            calendarEvent,
            'signed_lease_document_name'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('rent_change_effective_date'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.LEASE_RENEWAL,
            calendarEvent,
            'rent_change_effective_date'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('lease_period_type'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.LEASE_RENEWAL,
            calendarEvent,
            'lease_period_type'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('$rent_change_amount'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.LEASE_RENEWAL,
            calendarEvent,
            '$rent_change_amount'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('pt_lease_end'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.LEASE_RENEWAL,
            calendarEvent,
            'pt_lease_end'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('pt_lease_start'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.LEASE_RENEWAL,
            calendarEvent,
            'pt_lease_start'
          ) || EFallback.UNKNOWN
      },

      // PT_COMPLIANCE
      {
        pattern: this.getDynamicParamPattern('next_service_date'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.COMPLIANCES,
            calendarEvent,
            'next_service_date'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('last_service_date'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.COMPLIANCES,
            calendarEvent,
            'last_service_date'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('expiry_date'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.COMPLIANCES,
            calendarEvent,
            'expiry_date'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('authority_form_received_state'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.COMPLIANCES,
            calendarEvent,
            'authority_form_received_state'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('item_serviced_by'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.COMPLIANCES,
            calendarEvent,
            'item_serviced_by'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('item_managed_by'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.COMPLIANCES,
            calendarEvent,
            'item_managed_by'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('compliance_item'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.COMPLIANCES,
            calendarEvent,
            'compliance_item'
          ) || EFallback.UNKNOWN
      },

      // PT_VACATE_DETAIL
      {
        pattern: this.getDynamicParamPattern('vacate_description'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.TENANT_VACATES,
            calendarEvent,
            'vacate_description'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('charge_to_date'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.TENANT_VACATES,
            calendarEvent,
            'charge_to_date'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('termination_date'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.TENANT_VACATES,
            calendarEvent,
            'termination_date'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('vacate_date'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.TENANT_VACATES,
            calendarEvent,
            'vacate_date'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('notice_date'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.TENANT_VACATES,
            calendarEvent,
            'notice_date'
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('vacate_type'),
        value:
          this.getDynamicParamaterDataPTComponentType(
            PTWidgetDataField.TENANT_VACATES,
            calendarEvent,
            'vacate_type'
          ) || EFallback.UNKNOWN
      },

      // RM_ISSUE
      // {
      //   pattern: this.getDynamicParamPattern('issue_note_description'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_ISSUES,
      //       calendarEvent,
      //       'issue_note_description'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('checklist_description'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_ISSUES,
      //       calendarEvent,
      //       'checklist_description'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('inventory_item'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_ISSUES,
      //       calendarEvent,
      //       'inventory_item'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('issue_resolution'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_ISSUES,
      //       calendarEvent,
      //       'issue_resolution'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('issue_description'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_ISSUES,
      //       calendarEvent,
      //       'issue_description'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('issue_job'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_ISSUES,
      //       calendarEvent,
      //       'issue_job'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('issue_vendor'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_ISSUES,
      //       calendarEvent,
      //       'issue_vendor'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('issue_project'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_ISSUES,
      //       calendarEvent,
      //       'issue_project'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('issue_priority'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_ISSUES,
      //       calendarEvent,
      //       'issue_priority'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('issue_category'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_ISSUES,
      //       calendarEvent,
      //       'issue_category'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('issue_open_time'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_ISSUES,
      //       calendarEvent,
      //       'issue_open_time'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('issue_status'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_ISSUES,
      //       calendarEvent,
      //       'issue_status'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('issue_close_time'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_ISSUES,
      //       calendarEvent,
      //       'issue_close_time'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('issue_close_date'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_ISSUES,
      //       calendarEvent,
      //       'issue_close_date'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('issue_open_date'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_ISSUES,
      //       calendarEvent,
      //       'issue_open_date'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('issue_due_date'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_ISSUES,
      //       calendarEvent,
      //       'issue_due_date'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('issue_schedule_date'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_ISSUES,
      //       calendarEvent,
      //       'issue_schedule_date'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('issue_title'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_ISSUES,
      //       calendarEvent,
      //       'issue_title'
      //     ) || EFallback.UNKNOWN
      // },

      // RM_VACATE_DETAIL
      // {
      //   pattern: this.getDynamicParamPattern('expected_move_out'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.VACATE_DETAIL,
      //       calendarEvent,
      //       'expected_move_out'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('move_out_date'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.VACATE_DETAIL,
      //       calendarEvent,
      //       'move_out_date'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('move_in_date'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.VACATE_DETAIL,
      //       calendarEvent,
      //       'move_in_date'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('vacate_tenant'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.VACATE_DETAIL,
      //       calendarEvent,
      //       'vacate_tenant'
      //     ) || EFallback.UNKNOWN
      // },

      // RM_LEASE_RENEWAL
      // {
      //   pattern: this.getDynamicParamPattern('lease_tenant_charge'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.LEASE_RENEWAL,
      //       calendarEvent,
      //       'lease_tenant_charge'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('lease_unit_type_charge'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.LEASE_RENEWAL,
      //       calendarEvent,
      //       'lease_unit_type_charge'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('lease_unit_charge'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.LEASE_RENEWAL,
      //       calendarEvent,
      //       'lease_unit_charge'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('lease_property_charge'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.LEASE_RENEWAL,
      //       calendarEvent,
      //       'lease_property_charge'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('lease_due_day'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.LEASE_RENEWAL,
      //       calendarEvent,
      //       'lease_due_day'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('lease_rent_period'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.LEASE_RENEWAL,
      //       calendarEvent,
      //       'lease_rent_period'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('lease_renewal_term'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.LEASE_RENEWAL,
      //       calendarEvent,
      //       'lease_renewal_term'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('lease_renewal_sign'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.LEASE_RENEWAL,
      //       calendarEvent,
      //       'lease_renewal_sign'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('lease_renewal_end'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.LEASE_RENEWAL,
      //       calendarEvent,
      //       'lease_renewal_end'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('lease_renewal_start'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.LEASE_RENEWAL,
      //       calendarEvent,
      //       'lease_renewal_start'
      //     ) || EFallback.UNKNOWN
      // },

      // RM_INSPECTION
      // {
      //   pattern: this.getDynamicParamPattern('inspection_item_details'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_INSPECTIONS,
      //       calendarEvent,
      //       'inspection_item_details'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('inspection_item'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_INSPECTIONS,
      //       calendarEvent,
      //       'inspection_item'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('inspection_area'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_INSPECTIONS,
      //       calendarEvent,
      //       'inspection_area'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('inspection_notes'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_INSPECTIONS,
      //       calendarEvent,
      //       'inspection_notes'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('inspection_description'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_INSPECTIONS,
      //       calendarEvent,
      //       'inspection_description'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('scheduled_inspection_date'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_INSPECTIONS,
      //       calendarEvent,
      //       'scheduled_inspection_date'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('inspection_date'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_INSPECTIONS,
      //       calendarEvent,
      //       'inspection_date'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('inspection_type'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_INSPECTIONS,
      //       calendarEvent,
      //       'inspection_type'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('inspection_status'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_INSPECTIONS,
      //       calendarEvent,
      //       'inspection_status'
      //     ) || EFallback.UNKNOWN
      // },
      // {
      //   pattern: this.getDynamicParamPattern('inspection_tenant'),
      //   value:
      //     this.getDynamicParamaterDataRMComponentType(
      //       RMWidgetDataField.RM_INSPECTIONS,
      //       calendarEvent,
      //       'inspection_tenant'
      //     ) || EFallback.UNKNOWN
      // },

      //BREACH_NOTICE
      {
        pattern: this.getDynamicParamPattern('breach_reason'),
        value:
          this.getDynamicParamaterDataCalendarEvent(
            calendarEvent,
            'breach_reason',
            EEventType.BREACH_REMEDY
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('remedy_date'),
        value:
          this.getDynamicParamaterDataCalendarEvent(
            calendarEvent,
            'remedy_date',
            EEventType.BREACH_REMEDY
          ) || EFallback.UNKNOWN
      },

      // ENTRY_NOTICE
      {
        pattern: this.getDynamicParamPattern('entry_date'),
        value:
          this.getDynamicParamaterDataCalendarEvent(
            calendarEvent,
            'entry_date',
            EEventType.ENTRY_NOTICE
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('entry_time'),
        value:
          this.getDynamicParamaterDataCalendarEvent(
            calendarEvent,
            'entry_time',
            EEventType.ENTRY_NOTICE
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('entry_reason'),
        value:
          this.getDynamicParamaterDataCalendarEvent(
            calendarEvent,
            'entry_reason',
            EEventType.ENTRY_NOTICE
          ) || EFallback.UNKNOWN
      },

      // CUSTOM_EVENT
      {
        pattern: this.getDynamicParamPattern('custom_event_time'),
        value:
          this.getDynamicParamaterDataCalendarEvent(
            calendarEvent,
            'custom_event_time',
            EEventType.CUSTOM_EVENT
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('custom_event_date'),
        value:
          this.getDynamicParamaterDataCalendarEvent(
            calendarEvent,
            'custom_event_date',
            EEventType.CUSTOM_EVENT
          ) || EFallback.UNKNOWN
      },
      {
        pattern: this.getDynamicParamPattern('custom_event_name'),
        value:
          this.getDynamicParamaterDataCalendarEvent(
            calendarEvent,
            'custom_event_name',
            EEventType.CUSTOM_EVENT
          ) || EFallback.UNKNOWN
      },

      {
        pattern: new RegExp(`${validParamTag.source}form_name<\/span>`, 'g'),
        value: EFallback.DOCUMENT
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}schedule_date<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}schedule_time<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}event_name<\/span>`, 'g'),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}event_date<\/span>`, 'g'),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}event_time<\/span>`, 'g'),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}file_name<\/span>`, 'g'),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}file_sender_name<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}contact_name<\/span>`, 'g'),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}contact_address<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}contact_email_address<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}contact_phone_number<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}contact_information<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}calendar_event_name<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}calendar_event_date<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}calendar_event_time<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}leasing_tenancy_name<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}leasing_original_lease_start<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}leasing_lease_start<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}leasing_lease_end<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}leasing_lease_period<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}leasing_period_type<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$leasing_rent_amount<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}leasing_payment_period<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}rent_start_date<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}rent_description<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}next_rent_review<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}bond_account_name<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$bond_required_amount<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$bond_amount_lodged_direct<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}note_description<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      // Maintenence request
      {
        pattern: new RegExp(
          `${validParamTag.source}maintenance_summary<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      // Creditor invoice PT
      {
        pattern: new RegExp(
          `${validParamTag.source}creditor_name<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}creditor_invoice_description<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$creditor_invoice_amount<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}creditor_due_date<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}creditor_invoice_status<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}creditor_invoice_reference<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}linked_tenancy_invoice_description<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$linked_tenancy_invoice_amount<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}linked_tenancy_due_date<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}linked_tenancy_invoice_status<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}linked_tenancy_name_invoice<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      // Tenancy invoice PT
      {
        pattern: new RegExp(
          `${validParamTag.source}tenancy_invoice_description<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$tenancy_invoice_amount<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenancy_due_date<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenancy_invoice_status<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenancy_name_invoice<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenancy_name_invoice<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenancy_name_invoice<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}account_name<\/span>`, 'g'),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}maintenance_creditor_name<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}maintenance_invoice_description<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}maintenance_invoice_reference<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$maintenance_invoice_amount<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}maintenance_due_date<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      // Capture lease terms
      {
        pattern: new RegExp(
          `${validParamTag.source}lease_duration_period<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}duration_period_type<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}rental_state<\/span>`, 'g'),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$lease_rent_amount<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}lease_payment_period<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}bond_state<\/span>`, 'g'),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$bond_amount<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$bond_increase_paid<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}additional_notes<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      // Capture conditions for request approval
      {
        pattern: new RegExp(
          `${validParamTag.source}conditions_copy<\/span>`,
          'g'
        ),
        value: EFallback.CONDITIONS_COPY
      },
      // Capture pet bond
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$pet_bond_amount<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}vacate_tenancy_name<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$rent_owing<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$outstanding_invoices_fees<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}amount_owning_note<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}tenant_notes<\/span>`, 'g'),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenant_actions<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}owner_notes<\/span>`, 'g'),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}follow_up_items<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}inspection_form_name<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$bond_amount_returned<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$bond_amount_deducted<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}reason_bond_deduction<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$break_lease_fee<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$advertising_fees<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}other_fees_name<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$other_fees_amount<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}break_lease_form_name<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}letting_type<\/span>`, 'g'),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$recommended_rental_amount<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}letting_payment_period<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}recommended_lease_duration<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}letting_period_type<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}application_name_1<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}application_summary_1<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}application_name_2<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}application_summary_2<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}application_name_3<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}application_summary_3<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}\\$bond_amount_due<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}bond_form_name<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}report_deadline<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}report_form_name<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}notice_to_leave_date<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}reason_for_notice<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}today_date<\/span>`, 'g'),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}notice_form_name<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },

      // -----------------RM----------------- //
      {
        pattern: new RegExp(
          `${validParamTag.source}new_tenant_first_name<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}new_tenant_last_name<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}new_tenant_address<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenant_move_in_date<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenant_move_out_date<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenant_notice_date<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenant_expected_move_out<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenant_lease_start<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenant_lease_end<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenant_lease_sign<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenant_lease_term<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenant_contact_name<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}deposit_type<\/span>`, 'g'),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}deposit_amount<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}deposit_date<\/span>`, 'g'),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenant_rent_period<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenant_due_day<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(`${validParamTag.source}tax_type_ID<\/span>`, 'g'),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenant_subsidies<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}property_charge_of_new_tenant<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}unit_charge_of_new_tenant<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}unit_type_charge_of_new_tenant<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}tenant_charge_of_new_tenant<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}one_time_charges<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      },
      {
        pattern: new RegExp(
          `${validParamTag.source}user_defined_fields<\/span>`,
          'g'
        ),
        value: EFallback.UNKNOWN
      }
    ];
  }

  getDynamicParamPattern(field: string) {
    const validParamTag =
      /<span style="color: var\(--fg-brand, #28ad99\);" contenteditable="false">/g;
    return new RegExp(`${validParamTag.source}${field}<\/span>`, 'g');
  }

  public getDynamicParamaterDataPTComponentType(
    type: PTWidgetDataField,
    calendarEvent,
    field
  ) {
    const data = calendarEvent?.[0]?.[type]?.[0];

    if (!data) return '';

    const formatVacateType = TypeVacate?.find(
      (item) => item?.value === data?.tenantVacateType || data?.vacateType
    );

    const formatComplianceType = TypeCompliance?.find(
      (item) => item?.value === data?.authorityForm
    );

    switch (type) {
      case PTWidgetDataField.NOTES:
        switch (field) {
          case 'note_description':
            return data?.description;
        }
        break;
      case PTWidgetDataField.CREDITOR_INVOICES:
        switch (field) {
          case 'creditor_name':
            return this.sharedService.displayName(
              data?.supplier?.firstName,
              data?.supplier?.lastName
            );
          case 'creditor_invoice_description':
            return data?.creditorInvoice?.description;
          case '$creditor_invoice_amount':
            return !isNaN(parseFloat(data?.creditorInvoice?.amount))
              ? `$${data?.creditorInvoice?.amount}`
              : null;
          case 'creditor_due_date':
            return data?.creditorInvoice?.dueDate
              ? this.formatDate(data?.creditorInvoice?.dueDate)
              : null;
          case 'creditor_invoice_status':
            return data?.creditorInvoice?.status;
          case 'creditor_invoice_reference':
            return data?.creditorInvoice?.creditorReference;
          case 'linked_tenancy_invoice_description':
            return data?.tenancyInvoice?.description;
          case '$linked_tenancy_invoice_amount':
            return !isNaN(parseFloat(data?.tenancyInvoice?.amount))
              ? `$${data?.tenancyInvoice?.amount}`
              : null;
          case 'linked_tenancy_due_date':
            return data?.tenancyInvoice?.dueDate
              ? this.formatDate(data?.tenancyInvoice?.dueDate)
              : null;
          case 'linked_tenancy_invoice_status':
            return data?.tenancyInvoice?.status;
          case 'linked_tenancy_name_invoice':
            return data?.tenancyInvoice?.tenancyName;
        }
        break;
      case PTWidgetDataField.TENANCY_INVOICES:
        switch (field) {
          case 'tenancy_invoice_description':
            return data?.tenancyInvoice?.description;
          case '$tenancy_invoice_amount':
            return !isNaN(parseFloat(data?.tenancyInvoice?.amount))
              ? `$${data?.tenancyInvoice?.amount}`
              : null;
          case 'tenancy_due_date':
            return data?.tenancyInvoice?.dueDate
              ? this.formatDate(data?.tenancyInvoice?.dueDate)
              : null;
          case 'tenancy_invoice_status':
            return data?.tenancyInvoice?.status;
          case 'tenancy_name_invoice':
            return data?.tenancyInvoice?.tenancyName;
          case 'account_name':
            return data?.tenancyInvoice?.account?.name;
        }
        break;
      case PTWidgetDataField.MAINTENANCE_REQUEST:
        switch (field) {
          case 'maintenance_summary':
            return data?.summary;
        }
        break;
      case PTWidgetDataField.MAINTENANCE_INVOICE:
        switch (field) {
          case 'maintenance_creditor_name':
            return this.sharedService.displayName(
              data?.supplier?.firstName,
              data?.supplier?.lastName
            );
          case 'maintenance_invoice_description':
            return data?.data?.invoice?.creditorInvoice?.invoiceDescription;
          case 'maintenance_invoice_reference':
            return data?.data?.invoice?.creditorInvoice?.creditorReference;
          case '$maintenance_invoice_amount':
            return (
              !isNaN(
                parseFloat(data?.data?.invoice?.creditorInvoice?.amount)
              ) &&
              !isNaN(
                parseFloat(data?.data?.invoice?.creditorInvoice?.gstAmount)
              ) &&
              `$${
                data?.data?.invoice?.creditorInvoice?.amount +
                data?.data?.invoice?.creditorInvoice?.gstAmount
              }`
            );
          case 'maintenance_due_date':
            return data?.data?.invoice?.creditorInvoice?.dueDate
              ? this.formatDate(data?.data?.invoice?.creditorInvoice?.dueDate)
              : null;
        }
        break;
      case PTWidgetDataField.ROUTINE_INSPECTION:
        switch (field) {
          case 'routine_inspection_date':
            return data?.startTime ? this.formatDate(data?.startTime) : null;
          case 'routine_inspection_start_time':
            return data?.startTime ? this.formatTime(data?.startTime) : null;
          case 'routine_inspection_end_time':
            return data?.endTime ? this.formatTime(data?.endTime) : null;
          case 'routine_tenant_notes':
            return data?.notes?.tenant_notes;
          case 'routine_tenant_actions':
            return data?.notes?.tenant_actions;
          case 'routine_owner_notes':
            return data?.notes?.owner_notes;
          case 'routine_follow_up_items':
            return data?.notes?.owner_followup_items;
          case 'via this link':
            return "<a href='{via_this_link}' data-action='via_link'>via this link</a>";
        }
        break;
      case PTWidgetDataField.OUTGOING_INSPECTION:
        switch (field) {
          case 'outgoing_inspection_date':
            return data?.startTime ? this.formatDate(data?.startTime) : null;
          case 'outgoing_inspection_start_time':
            return data?.startTime ? this.formatTime(data?.startTime) : null;
          case 'outgoing_inspection_end_time':
            return data?.endTime ? this.formatTime(data?.endTime) : null;
          case 'outgoing_tenant_notes':
            return data?.notes?.tenant_notes;
          case 'outgoing_tenant_actions':
            return data?.notes?.tenant_actions;
          case 'outgoing_owner_notes':
            return data?.notes?.owner_notes;
          case 'outgoing_follow_up_items':
            return data?.notes?.owner_followup_items;
        }
        break;
      case PTWidgetDataField.INGOING_INSPECTION:
        switch (field) {
          case 'ingoing_inspection_date':
            return data?.startTime ? this.formatDate(data?.startTime) : null;
          case 'ingoing_inspection_start_time':
            return data?.startTime ? this.formatTime(data?.startTime) : null;
          case 'ingoing_inspection_end_time':
            return data?.endTime ? this.formatTime(data?.endTime) : null;
          case 'ingoing_tenant_notes':
            return data?.notes?.tenant_notes;
          case 'ingoing_tenant_actions':
            return data?.notes?.tenant_actions;
          case 'ingoing_owner_notes':
            return data?.notes?.owner_notes;
          case 'ingoing_follow_up_items':
            return data?.notes?.owner_followup_items;
        }
        break;
      case PTWidgetDataField.LEASE_RENEWAL:
        switch (field) {
          case 'pt_lease_start':
            return data?.startDate ? this.formatDate(data?.startDate) : null;
          case 'pt_lease_end':
            return data?.endDate ? this.formatDate(data?.endDate) : null;
          case 'rent_change_amount':
            return !isNaN(parseFloat(data?.rent)) ? `$${data?.rent}` : null;
          case 'lease_period_type':
            return data?.frequency && FREQUENCY_CHECK[data?.frequency];
          case 'rent_change_effective_date':
            return data?.effectiveDate
              ? this.formatDate(data?.effectiveDate)
              : null;
          case 'signed_lease_document_name':
            return (
              data?.file &&
              data?.file?.map((item) => item?.fileName)?.join(', ')
            );
        }
        break;
      case PTWidgetDataField.TENANT_VACATES:
        switch (field) {
          case 'vacate_type':
            return formatVacateType?.text;
          case 'notice_date':
            return data?.noticeDate ? this.formatDate(data?.noticeDate) : null;
          case 'vacate_date':
            return data?.vacateDate ? this.formatDate(data?.vacateDate) : null;
          case 'termination_date':
            return data?.terminationDate
              ? this.formatDate(data?.terminationDate)
              : null;
          case 'charge_to_date':
            return data?.chargeToDate
              ? this.formatDate(data?.chargeToDate)
              : null;
          case 'vacate_description':
            return data?.description;
        }
        break;
      case PTWidgetDataField.LEASING:
        switch (field) {
          case 'leasing_tenancy_name':
            return data?.data?.tenancyName;
          case 'leasing_original_lease_start':
            return data?.data?.originalLeaseStartDate
              ? this.formatDate(data?.data?.originalLeaseStartDate)
              : null;
          case 'leasing_lease_start':
            return data?.data?.leaseStartDate
              ? this.formatDate(data?.data?.leaseStartDate)
              : null;
          case 'leasing_lease_end':
            return data?.data?.leaseEndDate
              ? this.formatDate(data?.data?.leaseEndDate)
              : null;
          case 'leasing_lease_period':
            return data?.data?.leasePeriod;
          case 'leasing_period_type':
            return PeriodTypeString[data?.data?.leasePeriodType];
          case '$leasing_rent_amount':
            return !isNaN(parseFloat(data?.data?.rentAmount))
              ? `$${data?.data?.rentAmount}`
              : null;
          case 'leasing_payment_period':
            return EPaymentType[data?.data?.paymentPeriod];
          case 'rent_start_date':
            return data?.data?.rentStartDate
              ? this.formatDate(data?.data?.rentStartDate)
              : null;
          case 'rent_description':
            return data?.data?.rentDescription;
          case 'next_rent_review':
            return data?.data?.nextRentReview
              ? this.formatDate(data?.data?.nextRentReview)
              : null;
          case 'bond_account_name':
            return data?.data?.securityDeposit?.accountName;
          case '$bond_required_amount':
            return !isNaN(parseFloat(data?.data?.securityDeposit?.amount))
              ? `$${data?.data?.securityDeposit?.amount}`
              : null;
          case '$bond_amount_lodged_direct':
            return !isNaN(
              parseFloat(data?.data?.securityDeposit?.amountLodgedDirect)
            )
              ? `$${data?.data?.securityDeposit?.amountLodgedDirect}`
              : null;
        }
        break;
      case PTWidgetDataField.COMPLIANCES:
        switch (field) {
          case 'compliance_item':
            return data?.complianceCategory?.name;
          case 'item_managed_by':
            return data?.managedBy;
          case 'item_serviced_by':
            return (
              data?.contactInfo &&
              this.sharedService.displayName(
                data?.contactInfo?.firstName,
                data?.contactInfo?.lastName
              )
            );
          case 'authority_form_received_state':
            return data?.contactInfo ? formatComplianceType?.text : '';
          case 'expiry_date':
            return data?.expiryDate ? this.formatDate(data?.expiryDate) : null;
          case 'last_service_date':
            return data?.lastServiceDate
              ? this.formatDate(data?.lastServiceDate)
              : null;
          case 'next_service_date':
            return data?.nextServiceDate
              ? this.formatDate(data?.nextServiceDate)
              : null;
        }
        break;
    }

    return null;
  }

  // public getDynamicParamaterDataRMComponentType(type, calendarEvent, field) {
  //   const data = calendarEvent?.[0]?.[type]?.find(
  //     (item) =>
  //       ![ESyncStatus.INPROGRESS, ESyncStatus.FAILED].includes(
  //         item?.syncStatus || item?.status
  //       )
  //   );
  //   if (!data) return;

  //   switch (type) {
  //     case RMWidgetDataField.LEASE_RENEWAL:
  //       switch (field) {
  //         case 'lease_renewal_start':
  //           return data?.startDate ? this.formatDate(data?.startDate) : null;
  //         case 'lease_renewal_end':
  //           return data?.endDate ? this.formatDate(data?.endDate) : null;
  //         case 'lease_renewal_term':
  //           return data?.leaseTermName || '';
  //         case 'lease_rent_period':
  //           return data?.frequency && FREQUENCY_CHECK[data?.frequency];
  //         case 'lease_renewal_sign':
  //           return data?.leaseSign ? this.formatDate(data?.leaseSign) : null;
  //         case 'lease_due_day':
  //           return !isNaN(Number(data?.source?.rentDueDay))
  //             ? this.formatDueDayLeaseRenewal(
  //                 data?.source?.rentDueDay,
  //                 data?.frequency
  //               )
  //             : null;
  //         case 'lease_property_charge':
  //           return this._getDynamicRecurringCharges(
  //             data?.recurringCharges || [],
  //             EEntityType.PROPERTY
  //           );
  //         case 'lease_unit_charge':
  //           return this._getDynamicRecurringCharges(
  //             data?.recurringCharges || [],
  //             EEntityType.UNIT
  //           );
  //         case 'lease_unit_type_charge':
  //           return this._getDynamicRecurringCharges(
  //             data?.recurringCharges || [],
  //             EEntityType.UNITTYPE
  //           );
  //         case 'lease_tenant_charge':
  //           return this._getDynamicRecurringCharges(
  //             data?.recurringCharges || [],
  //             EEntityType.TENANT
  //           );
  //       }
  //       break;
  //     case RMWidgetDataField.RM_ISSUES:
  //       switch (field) {
  //         case 'issue_title':
  //           return data?.title;
  //         case 'issue_schedule_date':
  //           return data?.scheduleDate
  //             ? this.formatDate(data?.scheduleDate)
  //             : null;
  //         case 'issue_due_date':
  //           return data?.dueDate ? this.formatDate(data?.dueDate) : null;
  //         case 'issue_open_date':
  //           return data?.openDate ? this.formatDate(data?.openDate) : null;
  //         case 'issue_open_time':
  //           return data?.openDate ? this.formatTime(data?.openDate) : null;
  //         case 'issue_close_date':
  //           return data?.closeDate ? this.formatDate(data?.closeDate) : null;
  //         case 'issue_close_time':
  //           return data?.closeDate ? this.formatTime(data?.closeDate) : null;
  //         case 'issue_status':
  //           return data?.details?.serviceManagerStatus?.name
  //             ? `${data?.details?.serviceManagerStatus?.name.replace(
  //                 /<|>/g,
  //                 ''
  //               )}`
  //             : null;
  //         case 'issue_category':
  //           return data?.details?.serviceManagerCategory?.name
  //             ? `${data?.details?.serviceManagerCategory?.name.replace(
  //                 /<|>/g,
  //                 ''
  //               )}`
  //             : null;
  //         case 'issue_priority':
  //           return data?.details?.serviceManagerPriority?.name
  //             ? `${data?.details?.serviceManagerPriority?.name.replace(
  //                 /<|>/g,
  //                 ''
  //               )}`
  //             : null;
  //         case 'issue_project':
  //           return data?.details?.serviceManagerProject?.name;
  //         case 'issue_vendor':
  //           return data?.details?.user?.lastName;
  //         case 'issue_job':
  //           return data?.details?.serviceManagerJob?.name;
  //         case 'issue_description':
  //           return data?.details?.description;
  //         case 'issue_resolution':
  //           return data?.details?.resolution;
  //         case 'inventory_item':
  //           return this.formaInventoryItem(data?.workOrder);
  //         case 'checklist_description':
  //           return this.formatDescription(data?.checklist);
  //         case 'issue_note_description':
  //           return this.formatDescription(data?.historyNotes);
  //       }
  //       break;
  //     case RMWidgetDataField.RM_INSPECTIONS:
  //       switch (field) {
  //         case 'inspection_tenant':
  //           return data?.userPropertyGroup?.name;
  //         case 'inspection_status':
  //           return data?.inspectionStatus?.name;
  //         case 'inspection_type':
  //           return data?.inspectionType?.name;
  //         case 'inspection_date':
  //           return data?.inspectionDate
  //             ? this.formatDate(data?.inspectionDate)
  //             : null;
  //         case 'scheduled_inspection_date':
  //           return data?.scheduledDate
  //             ? this.formatDate(data?.scheduledDate)
  //             : null;
  //         case 'inspection_description':
  //           return data?.description;
  //         case 'inspection_notes':
  //           return data?.notes;
  //         case 'inspection_item_details':
  //           return this.formatInspectionItemDetail(data?.inspectionAreas);
  //         case 'inspection_item':
  //           return this.flattenInspectionItems(data?.inspectionAreas)
  //             ?.map((item) => item?.name)
  //             ?.join(', ');
  //         case 'inspection_area':
  //           return data?.inspectionAreas
  //             ?.map((item) => item?.name || '')
  //             ?.join(', ');
  //       }
  //       break;
  //     case RMWidgetDataField.VACATE_DETAIL:
  //       switch (field) {
  //         case 'vacate_tenant':
  //           return data?.tenancy?.name;
  //         case 'move_in_date':
  //           return data?.moveInDate ? this.formatDate(data?.moveInDate) : null;
  //         case 'move_out_date':
  //           return data?.vacateDate ? this.formatDate(data?.vacateDate) : null;
  //         case 'notice_date':
  //           return data?.noticeDate ? this.formatDate(data?.noticeDate) : null;
  //         case 'expected_move_out':
  //           return data?.expectedMoveOutDate
  //             ? this.formatDate(data?.expectedMoveOutDate)
  //             : null;
  //       }
  //       break;
  //     case RMWidgetDataField.NEW_TENANT:
  //       const {
  //         firstName,
  //         lastName,
  //         addresses,
  //         subsidyTenants,
  //         deposit,
  //         settings,
  //         lease,
  //         contacts,
  //         charges,
  //         recurringCharges,
  //         userDefinedValues
  //       } = data.data || {};
  //       const { amount, transactionDate, chargeType } = deposit || {};
  //       const { defaultTaxTypeName, rentPeriod, rentDueDay } = settings || {};
  //       const {
  //         moveInDate,
  //         vacateDate,
  //         noticeDate,
  //         expectedMoveOutDate,
  //         startDate,
  //         endDate,
  //         source,
  //         leaseTermName
  //       } = lease || {};

  //       switch (field) {
  //         case 'new_tenant_first_name':
  //           return firstName;
  //         case 'new_tenant_last_name':
  //           return lastName;
  //         case 'new_tenant_address':
  //           return this._getNewAddressValue(addresses);
  //         case 'tenant_move_in_date':
  //           return this._formatDate(moveInDate);
  //         case 'tenant_move_out_date':
  //           return this._formatDate(vacateDate);
  //         case 'tenant_notice_date':
  //           return this._formatDate(noticeDate);
  //         case 'tenant_expected_move_out':
  //           return this._formatDate(expectedMoveOutDate);
  //         case 'tenant_lease_start':
  //           return this._formatDate(startDate);
  //         case 'tenant_lease_end':
  //           return this._formatDate(endDate);
  //         case 'tenant_lease_sign':
  //           return this._formatDate(source?.leaseSign);
  //         case 'tenant_lease_term':
  //           return leaseTermName;
  //         case 'tenant_contact_name':
  //           return this._getNewTenantContactValue(contacts);
  //         case 'deposit_type':
  //           return deposit
  //             ? `${chargeType?.name} - ${chargeType?.description}`
  //             : null;
  //         case 'deposit_amount':
  //           return amount ? `$${this._formatAmount(amount)}` : null;
  //         case 'deposit_date':
  //           return this._formatDate(transactionDate);
  //         case 'tenant_rent_period':
  //           return rentPeriod;
  //         case 'tenant_due_day':
  //           return this._getDueDate(rentPeriod, rentDueDay);
  //         case 'tax_type_ID':
  //           return defaultTaxTypeName;
  //         case 'tenant_subsidies':
  //           return this._getSubsidiesValue(subsidyTenants);
  //         case 'property_charge_of_new_tenant':
  //           return this._getPropertyChangeValue(
  //             recurringCharges,
  //             EEntityType.PROPERTY
  //           );
  //         case 'unit_charge_of_new_tenant':
  //           return this._getPropertyChangeValue(
  //             recurringCharges,
  //             EEntityType.UNIT
  //           );
  //         case 'unit_type_charge_of_new_tenant':
  //           return this._getPropertyChangeValue(
  //             recurringCharges,
  //             EEntityType.UNITTYPE
  //           );
  //         case 'tenant_charge_of_new_tenant':
  //           return this._getPropertyChangeValue(
  //             recurringCharges,
  //             EEntityType.TENANT
  //           );
  //         case 'one_time_charges':
  //           return this._getOneTimeChangeValue(charges);
  //         case 'user_defined_fields':
  //           return this._getUserDefinedFieldValue(userDefinedValues);
  //       }
  //       break;
  //     case RMWidgetDataField.RM_NOTES:
  //       switch (field) {
  //         case 'note_description':
  //           return data?.description;
  //       }
  //       break;
  //   }

  //   return null;
  // }

  public getDynamicParamaterDataCalendarEvent(
    events: ITaskLinkCalendarEvent[] | ICalendarEvent[] = [],
    field: string,
    calendarType: EEventType
  ) {
    const { eventName, eventDate } =
      events?.find((event) => event?.eventType === calendarType) || {};

    switch (calendarType) {
      case EEventType.BREACH_REMEDY:
        switch (field) {
          case 'breach_reason':
            return eventName?.replace('Breach remedy due  - ', '');
          case 'remedy_date':
            return !!eventDate ? this.formatDate(eventDate) : null;
        }
        break;
      case EEventType.ENTRY_NOTICE:
        switch (field) {
          case 'entry_reason':
            return eventName?.replace('Property entry - ', '');
          case 'entry_date':
            return !!eventDate ? this.formatDate(eventDate) : null;
          case 'entry_time':
            return !!eventDate ? this.formatTime(eventDate) : null;
        }
        break;
      case EEventType.CUSTOM_EVENT:
        switch (field) {
          case 'custom_event_name':
            return eventName;
          case 'custom_event_date':
            return !!eventDate ? this.formatDate(eventDate) : null;
          case 'custom_event_time':
            return !!eventDate ? this.formatTime(eventDate) : null;
        }
        break;
    }
    return null;
  }

  formatTime(date, startTimeCase?: boolean) {
    return this.agencyDateFormatService.formatTimezoneTime(
      date,
      TIME_FORMAT,
      !startTimeCase
    );
  }

  formatDate(date, format?: string) {
    return this.agencyDateFormatService.formatTimezoneDate(
      date,
      format ?? this.dateFormatDay
    );
  }

  checkValidReceiverPrefill(receivers, validationFunction) {
    return receivers.filter((receiver) => !validationFunction(receiver));
  }

  checkValidPropertyPrefill(receivers, field) {
    return receivers.filter((item) => !item?.property?.[field]);
  }

  checkInvalidComponentPrefill2(event, field, validationFunction) {
    const data = (event || [])
      .flatMap((item) => item?.[field])
      .filter(Boolean)
      .flatMap((item) => item || [])
      .filter(
        (item) =>
          ![ESyncStatus.INPROGRESS, ESyncStatus.FAILED].includes(
            item?.syncStatus || item?.status
          )
      );
    if (!data?.length) return [];
    return data.filter((item) => !validationFunction(item));
  }

  checkInvalidComponentPrefill(receivers, event, field, validationFunction) {
    const dataWidgetFields = new Set([
      ...Object.values(RMWidgetDataField),
      ...Object.values(PTWidgetDataField)
    ]);
    const data = (event || [])
      .flatMap((item) => item?.[field])
      .filter(Boolean)
      .flatMap((item) => item || [])
      .filter(
        (item) =>
          ![ESyncStatus.INPROGRESS, ESyncStatus.FAILED].includes(
            item?.syncStatus || item?.status
          )
      );
    const isWidgetDataField = dataWidgetFields.has(field);
    const validWidget = data
      .filter((item) => validationFunction(item))
      .map((widget) => widget.id || widget.entityId);

    if (isWidgetDataField) {
      return receivers.filter((receiver) => {
        if (!receiver.componentType) return true;
        const widgetList = receiver.componentType[field];
        return !widgetList.some((widget) => validWidget.includes(widget.id));
      });
    }
    return receivers.filter((receiver) =>
      data.some((event) => event.taskId !== receiver.taskId)
    );
  }

  checkInvalidCalendarPrefill(
    receivers,
    events,
    field,
    calendarType: EEventType
  ) {
    if (!events?.length) return false;
    const filteredEvents =
      events?.filter(
        (event) => event.eventType === calendarType && Boolean(event[field])
      ) || [];
    const validTaskIds = filteredEvents?.map((event) => event.taskId) || [];

    const invalidReceivers = receivers?.filter(
      (receiver) => !validTaskIds?.includes(receiver.taskId)
    );
    return invalidReceivers;
  }

  /**
   * @param receivers
   * @param senders
   * @param agency
   * @param calendarEvent
   * @param isInvalidReceivers
   * @param createMessageFrom
   * @returns {
   *  'user_first_name': recipient list is missing dynamic parameter 'user_first_name',
   *  'user_fullname': recipient list is missing dynamic parameter 'user_fullname',
   *  ...
   * }
   */
  validationDynamicFieldFunctions(
    receivers,
    senders,
    company,
    calendarEvent,
    isInvalidReceivers: boolean = false,
    createMessageFrom: ECreateMessageFrom = null
  ) {
    const infoToPrefill = receivers ?? [];
    const hasOneSubscription = company.agencies?.length === 1;
    const isManyParticipants =
      createMessageFrom === ECreateMessageFrom.MULTI_MESSAGES ||
      (createMessageFrom === ECreateMessageFrom.MULTI_TASKS && // Single email in trigger step
        receivers.every(
          (receiver) =>
            receiver.hasOwnProperty('recipients') && receiver.recipients.length
        ));
    const getReceiversFromData = (data) => {
      switch (createMessageFrom) {
        case ECreateMessageFrom.MULTI_MESSAGES:
          return data?.conversations?.participants || data?.participants;
        case ECreateMessageFrom.MULTI_TASKS:
          return data?.recipients;
        default:
          return data;
      }
    };

    return {
      user_first_name: isInvalidReceivers
        ? receivers
        : this.checkValidReceiverPrefill(receivers, (item) => {
            if (isManyParticipants) {
              const participants = getReceiversFromData(item);
              return (
                !participants ||
                participants.every((participant) =>
                  Boolean(participant.firstName)
                )
              );
            }
            return !item || item.firstName;
          }),
      user_fullname: isInvalidReceivers
        ? receivers
        : this.checkValidReceiverPrefill(receivers, (item) => {
            if (isManyParticipants) {
              const participants = getReceiversFromData(item);
              return (
                !participants ||
                participants.every((participant) =>
                  Boolean(participant.firstName || participant.lastName)
                )
              );
            }
            return !item || item.firstName || item.lastName;
          }),
      user_full_name: isInvalidReceivers
        ? receivers
        : this.checkValidReceiverPrefill(receivers, (item) => {
            if (isManyParticipants) {
              const participants = getReceiversFromData(item);
              return (
                !participants ||
                participants.every((participant) =>
                  Boolean(participant.firstName || participant.lastName)
                )
              );
            }
            return !item || item.firstName || item.lastName;
          }),
      user_role: isInvalidReceivers
        ? receivers
        : this.checkValidReceiverPrefill(receivers, (item) => {
            if (isManyParticipants) {
              const participants = getReceiversFromData(item);
              return (
                !participants ||
                participants.every(
                  (participant) =>
                    participant.type &&
                    participant.type !== EUserPropertyType.UNIDENTIFIED &&
                    participant.userPropertyType !==
                      EUserPropertyType.UNIDENTIFIED
                )
              );
            } else if (
              [
                ECreateMessageFrom.MULTI_TASKS,
                ECreateMessageFrom.TASK_STEP
              ].includes(createMessageFrom)
            ) {
              // for case belong to other property -> compare to it's actual property id
              return (
                (item.propertyId === item.actualPropertyId &&
                  item.type !== EUserPropertyType.UNIDENTIFIED) ||
                item.type === EUserPropertyType.SUPPLIER ||
                item.type === EUserPropertyType.OTHER
              );
            }
            return (
              !item ||
              (item.type && item.type !== EUserPropertyType.UNIDENTIFIED)
            );
          }),
      request_summary: infoToPrefill.filter(
        (item) => !item?.linkedActions?.length
      ),
      short_property_address: this.checkValidPropertyPrefill(
        infoToPrefill,
        'shortenStreetLine'
      ),
      full_property_address: this.checkValidPropertyPrefill(
        infoToPrefill,
        'streetLine'
      ),
      property_region: this.checkValidPropertyPrefill(
        infoToPrefill,
        'regionName'
      ),
      company_name: Boolean(company?.name) ? [] : receivers,
      company_address: Boolean(company?.address) ? [] : receivers,
      company_phone_number: Boolean(company?.phoneNumber) ? [] : receivers,
      company_link: Boolean(company?.websiteUrl) ? [] : receivers,
      company_working_hours: Boolean(company?.regionWorkingHours)
        ? []
        : receivers,
      company_account_number:
        (hasOneSubscription &&
          Boolean(company.bankAccounts[0]?.accountNumber)) ||
        receivers.every((receiver) => receiver.bankAccount?.accountNumber)
          ? []
          : receivers,
      company_account_name:
        (hasOneSubscription && Boolean(company.bankAccounts[0]?.accountName)) ||
        receivers.every((receiver) => receiver.bankAccount?.accountName)
          ? []
          : receivers,
      company_BSB:
        (hasOneSubscription && Boolean(company.bankAccounts[0]?.bsb)) ||
        receivers.every((receiver) => receiver.bankAccount?.bsb)
          ? []
          : receivers,
      sender_name: Boolean(senders?.name) ? [] : receivers,
      sender_role: Boolean(senders?.title) ? [] : receivers,
      tenant_name: infoToPrefill.filter((item) => !item?.tenancies?.name),
      tenant_id: infoToPrefill.filter((item) => !item?.tenancies?.idCRMSystem),
      lease_start: infoToPrefill.filter(
        (item) => !item?.tenancies?.userPropertyGroupLeases?.[0]?.startDate
      ),
      lease_end: infoToPrefill.filter(
        (item) => !item?.tenancies?.userPropertyGroupLeases?.[0]?.endDate
      ),
      $rent_amount: infoToPrefill.filter(
        (item) =>
          !(
            item?.tenancies?.userPropertyGroupLeases?.[0]?.rentAmount &&
            item?.tenancies?.userPropertyGroupLeases?.[0]?.frequency
          )
      ),
      $bond_amount_required: infoToPrefill.filter(
        (item) => !item?.tenancies?.bondAmountRequired
      ),
      $next_rent_amount: infoToPrefill.filter(
        (item) =>
          !(
            item?.tenancies?.nextRentAmount &&
            item?.tenancies?.userPropertyGroupLeases?.[0]?.frequency
          )
      ),
      tenant_next_rent_review: infoToPrefill.filter(
        (item) => !item?.tenancies?.nextRentReviewDate
      ),
      $effective_rent_arrears_amount: infoToPrefill.filter(
        (item) =>
          !item?.tenancies?.arrears?.filter(
            (item) => item.type === ArrearsType.RENT
          )?.[0]?.effectiveArrearsAmount
      ),
      day_rent_in_arrears: infoToPrefill.filter(
        (item) => !item?.tenancies?.dayRentInArrears
      ),
      effective_rent_paid_to_date: infoToPrefill.filter(
        (item) => !item?.tenancies?.rentPaidToDate
      ),
      moving_out_date: infoToPrefill.filter(
        (item) => !item?.tenancies?.movingOutDate
      ),
      $total_outstanding_invoices: infoToPrefill.filter(
        (item) => !item?.tenancies?.totalOutStandingInvoice
      ),
      rent_period: infoToPrefill.filter(
        (item) => !item?.tenancies?.userPropertyGroupLeases?.[0]?.leasePeriod
      ),
      due_day: infoToPrefill.filter(
        (item) =>
          !(
            item?.tenancies?.userPropertyGroupLeases?.[0]?.frequency &&
            item?.tenancies?.userPropertyGroupLeases?.[0]?.dueDay
          )
      ),
      tenant_charge: infoToPrefill.filter(
        (item) =>
          !(
            (item?.tenancies?.recurringCharges || []).filter(
              (item) => item.entityType === EEntityType.TENANT
            )?.length > 0
          )
      ),
      owner_name: infoToPrefill.filter((item) => !item?.ownerships?.name),
      // PT
      tenancy_name: infoToPrefill.filter((item) => !item?.tenancies?.name),
      tenancy_id: infoToPrefill.filter((item) => !item?.tenancies?.idCRMSystem),
      period_type: infoToPrefill.filter(
        (item) =>
          !item?.tenancies?.userPropertyGroupLeases?.[0]?.leasePeriodType
      ),
      lease_period: infoToPrefill.filter(
        (item) => !item?.tenancies?.userPropertyGroupLeases?.[0]?.leasePeriod
      ),
      key_number: this.checkValidPropertyPrefill(infoToPrefill, 'keyNumber'),
      key_description: this.checkValidPropertyPrefill(
        infoToPrefill,
        'keyDescription'
      ),
      next_inspection_date: this.checkValidPropertyPrefill(
        infoToPrefill,
        'nextInspectionDate'
      ),
      next_inspection_start_time: this.checkValidPropertyPrefill(
        infoToPrefill,
        'nextInspectionEndTime'
      ),
      next_inspection_end_time: this.checkValidPropertyPrefill(
        infoToPrefill,
        'nextInspectionStartTime'
      ),
      authority_start_date: this.checkValidPropertyPrefill(
        infoToPrefill,
        'authorityStartDate'
      ),
      authority_end_date: this.checkValidPropertyPrefill(
        infoToPrefill,
        'authorityEndDate'
      ),

      $maintenance_expenditure_limit: this.checkValidPropertyPrefill(
        infoToPrefill,
        'expenditureLimit'
      ),

      // ============ COMPONENT_TYPE =================

      // PT_OUTGOING_INSPECTION
      outgoing_inspection_date: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.OUTGOING_INSPECTION,
        (event) => Boolean(event?.startTime)
      ),
      outgoing_inspection_start_time: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.OUTGOING_INSPECTION,
        (event) => Boolean(event?.startTime)
      ),
      outgoing_inspection_end_time: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.OUTGOING_INSPECTION,
        (event) => Boolean(event?.endTime)
      ),
      outgoing_tenant_notes: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.OUTGOING_INSPECTION,
        (event) => Boolean(event?.notes?.tenant_notes)
      ),
      outgoing_tenant_actions: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.OUTGOING_INSPECTION,
        (event) => Boolean(event?.notes?.tenant_actions)
      ),
      outgoing_owner_notes: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.OUTGOING_INSPECTION,
        (event) => Boolean(event?.notes?.owner_notes)
      ),
      outgoing_follow_up_items: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.OUTGOING_INSPECTION,
        (event) => Boolean(event?.notes?.owner_followup_items)
      ),

      // PT_INGOING_INSPECTION
      ingoing_inspection_date: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.INGOING_INSPECTION,
        (event) => Boolean(event?.startTime)
      ),
      ingoing_inspection_start_time: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.INGOING_INSPECTION,
        (event) => Boolean(event?.startTime)
      ),
      ingoing_inspection_end_time: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.INGOING_INSPECTION,
        (event) => Boolean(event?.endTime)
      ),
      ingoing_tenant_notes: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.INGOING_INSPECTION,
        (event) => Boolean(event?.notes?.tenant_notes)
      ),
      ingoing_tenant_actions: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.INGOING_INSPECTION,
        (event) => Boolean(event?.notes?.tenant_actions)
      ),
      ingoing_owner_notes: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.INGOING_INSPECTION,
        (event) => Boolean(event?.notes?.owner_notes)
      ),
      ingoing_follow_up_items: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.INGOING_INSPECTION,
        (event) => Boolean(event?.notes?.owner_followup_items)
      ),

      // PT_ROUTINE_INSPECTION
      'via this link': true,
      routine_follow_up_items: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.ROUTINE_INSPECTION,
        (event) => Boolean(event?.notes?.owner_followup_items)
      ),
      routine_owner_notes: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.ROUTINE_INSPECTION,
        (event) => Boolean(event?.notes?.owner_notes)
      ),
      routine_tenant_actions: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.ROUTINE_INSPECTION,
        (event) => Boolean(event?.notes?.tenant_actions)
      ),
      routine_tenant_notes: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.ROUTINE_INSPECTION,
        (event) => Boolean(event?.notes?.tenant_notes)
      ),
      routine_inspection_end_time: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.ROUTINE_INSPECTION,
        (event) => Boolean(event?.endTime)
      ),
      routine_inspection_start_time: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.ROUTINE_INSPECTION,
        (event) => Boolean(event?.startTime)
      ),
      routine_inspection_date: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.ROUTINE_INSPECTION,
        (event) => Boolean(event?.startTime)
      ),

      // PT_LEASE_RENEWAL
      signed_lease_document_name: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.LEASE_RENEWAL,
        (event) => Boolean(event?.file)
      ),
      rent_change_effective_date: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.LEASE_RENEWAL,
        (event) => Boolean(event?.effectiveDate)
      ),
      lease_period_type: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.LEASE_RENEWAL,
        (event) => Boolean(event?.frequency)
      ),
      $rent_change_amount: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.LEASE_RENEWAL,
        (event) => Boolean(event?.rent)
      ),
      pt_lease_end: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.LEASE_RENEWAL,
        (event) => Boolean(event?.endDate)
      ),
      pt_lease_start: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.LEASE_RENEWAL,
        (event) => Boolean(event?.startDate)
      ),

      // PT_COMPLIANCE
      next_service_date: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.COMPLIANCES,
        (event) => Boolean(event?.nextServiceDate)
      ),
      last_service_date: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.COMPLIANCES,
        (event) => Boolean(event?.lastServiceDate)
      ),
      expiry_date: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.COMPLIANCES,
        (event) => Boolean(event?.expiryDate)
      ),
      authority_form_received_state: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.COMPLIANCES,
        (event) => Boolean(event?.contactInfo)
      ),
      item_serviced_by: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.COMPLIANCES,
        (event) => Boolean(event?.contactInfo)
      ),
      item_managed_by: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.COMPLIANCES,
        (event) => Boolean(event?.managedBy)
      ),
      compliance_item: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.COMPLIANCES,
        (event) => Boolean(event?.complianceCategory?.name)
      ),

      // PT_VACATE_DETAIL
      vacate_description: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.TENANT_VACATES,
        (event) => Boolean(event?.description)
      ),
      charge_to_date: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.TENANT_VACATES,
        (event) => Boolean(event?.chargeToDate)
      ),
      termination_date: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.TENANT_VACATES,
        (event) => Boolean(event?.terminationDate)
      ),
      vacate_date: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.TENANT_VACATES,
        (event) => Boolean(event?.vacateDate)
      ),
      notice_date: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.TENANT_VACATES,
        (event) => Boolean(event?.noticeDate)
      ),
      vacate_type: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        PTWidgetDataField.TENANT_VACATES,
        (event) => {
          const formatVacateType = TypeVacate?.find(
            (item) =>
              item?.value === event?.tenantVacateType || event?.vacateType
          );
          return Boolean(formatVacateType?.text);
        }
      ),

      // RM_ISSUE
      issue_note_description: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_ISSUES,
        (event) => Boolean(event?.historyNotes)
      ),
      checklist_description: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_ISSUES,
        (event) => Boolean(event?.checklist)
      ),
      inventory_item: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_ISSUES,
        (event) => Boolean(event?.workOrder)
      ),
      issue_resolution: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_ISSUES,
        (event) => Boolean(event?.details?.resolution)
      ),
      issue_description: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_ISSUES,
        (event) => Boolean(event?.details?.description)
      ),
      issue_job: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_ISSUES,
        (event) => Boolean(event?.details?.serviceManagerJob?.name)
      ),
      issue_vendor: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_ISSUES,
        (event) => Boolean(event?.details?.user?.lastName)
      ),
      issue_project: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_ISSUES,
        (event) => Boolean(event?.details?.serviceManagerProject?.name)
      ),
      issue_priority: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_ISSUES,
        (event) => Boolean(event?.details?.serviceManagerPriority?.name)
      ),
      issue_category: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_ISSUES,
        (event) => Boolean(event?.details?.serviceManagerCategory?.name)
      ),
      issue_open_time: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_ISSUES,
        (event) => Boolean(event?.openDate)
      ),
      issue_status: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_ISSUES,
        (event) => Boolean(event?.details?.serviceManagerStatus?.name)
      ),
      issue_close_time: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_ISSUES,
        (event) => Boolean(event?.closeDate)
      ),
      issue_close_date: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_ISSUES,
        (event) => Boolean(event?.closeDate)
      ),
      issue_open_date: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_ISSUES,
        (event) => Boolean(event?.openDate)
      ),
      issue_due_date: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_ISSUES,
        (event) => Boolean(event?.dueDate)
      ),
      issue_schedule_date: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_ISSUES,
        (event) => Boolean(event?.scheduleDate)
      ),
      issue_title: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_ISSUES,
        (event) => Boolean(event?.title)
      ),

      //RM_NOTE
      note_description: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_NOTES,
        (event) => event.description
      ),

      // RM_VACATE_DETAIL
      expected_move_out: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.VACATE_DETAIL,
        (event) => Boolean(event?.expectedMoveOutDate)
      ),
      move_out_date: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.VACATE_DETAIL,
        (event) => Boolean(event?.vacateDate)
      ),
      move_in_date: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.VACATE_DETAIL,
        (event) => Boolean(event?.moveInDate)
      ),
      vacate_tenant: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.VACATE_DETAIL,
        (event) => Boolean(event?.tenancy?.name)
      ),

      // RM_LEASE_RENEWAL
      lease_tenant_charge: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.LEASE_RENEWAL,
        (event) =>
          Boolean(
            (event?.recurringCharges || []).filter(
              (item) => item?.entityType === EEntityType.TENANT
            )?.length
          )
      ),
      lease_unit_type_charge: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.LEASE_RENEWAL,
        (event) =>
          Boolean(
            (event?.recurringCharges || []).filter(
              (item) => item?.entityType === EEntityType.UNITTYPE
            )?.length
          )
      ),
      lease_unit_charge: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.LEASE_RENEWAL,
        (event) =>
          Boolean(
            (event?.recurringCharges || []).filter(
              (item) => item?.entityType === EEntityType.UNIT
            )?.length
          )
      ),
      lease_property_charge: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.LEASE_RENEWAL,
        (event) =>
          Boolean(
            (event?.recurringCharges || []).filter((item) =>
              [EEntityType.PROPERTY, EEntityType.UNIT].includes(
                item?.entityType
              )
            )?.length
          )
      ),
      lease_due_day: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.LEASE_RENEWAL,
        (event) => Boolean(event?.source?.rentDueDay)
      ),
      lease_rent_period: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.LEASE_RENEWAL,
        (event) => Boolean(event?.frequency)
      ),
      lease_renewal_term: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.LEASE_RENEWAL,
        (event) => Boolean(event?.leaseTermName)
      ),
      lease_renewal_sign: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.LEASE_RENEWAL,
        (event) => Boolean(event?.leaseSign)
      ),
      lease_renewal_end: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.LEASE_RENEWAL,
        (event) => Boolean(event?.endDate)
      ),
      lease_renewal_start: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.LEASE_RENEWAL,
        (event) => Boolean(event?.startDate)
      ),

      // RM_INSPECTION
      inspection_item_details: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_INSPECTIONS,
        (event) => Boolean(event?.inspectionAreas?.length)
      ),
      inspection_item: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_INSPECTIONS,
        (event) => Boolean(event?.inspectionAreas?.length)
      ),
      inspection_area: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_INSPECTIONS,
        (event) => Boolean(event?.inspectionAreas?.length)
      ),
      inspection_notes: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_INSPECTIONS,
        (event) => Boolean(event?.notes)
      ),
      inspection_description: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_INSPECTIONS,
        (event) => Boolean(event?.description)
      ),
      scheduled_inspection_date: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_INSPECTIONS,
        (event) => Boolean(event?.scheduledDate)
      ),
      inspection_date: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_INSPECTIONS,
        (event) => Boolean(event?.inspectionDate)
      ),
      inspection_type: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_INSPECTIONS,
        (event) => Boolean(event?.inspectionType?.name)
      ),
      inspection_status: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_INSPECTIONS,
        (event) => Boolean(event?.inspectionStatus?.name)
      ),
      inspection_tenant: this.checkInvalidComponentPrefill(
        receivers,
        calendarEvent,
        RMWidgetDataField.RM_INSPECTIONS,
        (event) => Boolean(event?.userPropertyGroup?.name)
      ),

      // ============ CALENDAR_ACTION =================

      //BREACH_NOTICE
      breach_reason: this.checkInvalidCalendarPrefill(
        receivers,
        calendarEvent,
        'eventName',
        EEventType.BREACH_REMEDY
      ),
      remedy_date: this.checkInvalidCalendarPrefill(
        receivers,
        calendarEvent,
        'eventDate',
        EEventType.BREACH_REMEDY
      ),

      // ENTRY_NOTICE
      entry_date: this.checkInvalidCalendarPrefill(
        receivers,
        calendarEvent,
        'eventDate',
        EEventType.ENTRY_NOTICE
      ),
      entry_time: this.checkInvalidCalendarPrefill(
        receivers,
        calendarEvent,
        'eventDate',
        EEventType.ENTRY_NOTICE
      ),
      entry_reason: this.checkInvalidCalendarPrefill(
        receivers,
        calendarEvent,
        'eventName',
        EEventType.ENTRY_NOTICE
      ),

      // CUSTOM_EVENT
      custom_event_time: this.checkInvalidCalendarPrefill(
        receivers,
        calendarEvent,
        'eventDate',
        EEventType.CUSTOM_EVENT
      ),
      custom_event_date: this.checkInvalidCalendarPrefill(
        receivers,
        calendarEvent,
        'eventDate',
        EEventType.CUSTOM_EVENT
      ),
      custom_event_name: this.checkInvalidCalendarPrefill(
        receivers,
        calendarEvent,
        'eventName',
        EEventType.CUSTOM_EVENT
      )
    };
  }

  public resetPropertyDynamicParameters() {
    this.setDynamicParamaterProperty({
      address: null,
      id: null,
      streetline: null,
      unitNo: null,
      agencyId: this.currentCompany?.id,
      companyId: this.currentCompany?.id,
      expenditureLimit: null,
      isTemporary: null,
      keyDescription: null,
      keyNumber: null,
      nextInspectionDate: null,
      nextInspectionEndTime: null,
      nextInspectionStartTime: null,
      authorityStartDate: null,
      authorityEndDate: null,
      propertyName: null,
      propertyType: null,
      region: null,
      shortenStreetline: null,
      status: null
    });
  }

  public resetTenancyDynamicParameters() {
    this.setDynamicParametersTenancy({
      id: null,
      idCRMSystem: null,
      idPropertyTree: null,
      name: null,
      type: null,
      status: null,
      userProperties: [],
      user: null,
      propertyId: null,
      userPropertyGroupLeases: [],
      arrears: [],
      isAcceptedPermission: null,
      recurringCharges: [],
      bondAmountRequired: null,
      nextRentAmount: null,
      dayRentInArrears: null,
      rentPaidToDate: null,
      movingOutDate: null,
      totalOutStandingInvoice: null
    });
  }

  public resetRecipientDynamicParameters() {
    this.dynamicParameters.set('user_first_name', '{user_first_name}');
    this.dynamicParameters.set('user_full_name', '{user_full_name}');
    this.dynamicParameters.set('user_role', '{user_role}');
  }

  public resetAppDynamicParameter() {
    this.resetPropertyDynamicParameters();
    this.resetTenancyDynamicParameters();
    this.resetRecipientDynamicParameters();
  }

  public getRequestSummaryFromActionItem(linkedTask) {
    let requestSummary = '';
    if (!linkedTask) {
      requestSummary = null;
    } else {
      const linkedTaskResponse = linkedTask?.options?.response;
      const ticket = linkedTask?.options?.response?.payload?.ticket;
      switch (linkedTaskResponse?.type?.toLocaleLowerCase()) {
        case EOptionType.RESCHEDULE_INSPECTION_REQUEST.toLocaleLowerCase():
          const options = { checkStatus: false };
          const inspectionRequest = mapTicketToDisplayItem(
            linkedTaskResponse,
            this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS,
            options
          );
          const displaySuggestedDate = [
            inspectionRequest?.rescheduleInfo?.suggestedDate,
            inspectionRequest?.rescheduleInfo?.suggestedTime
          ]
            .filter(Boolean)
            .join(' ');
          const validDate = !!inspectionRequest?.rescheduleInfo?.suggestedDate;
          requestSummary = `Reschedule inspection${
            validDate ? ' - ' : ''
          }${displaySuggestedDate}`;
          break;
        case EOptionType.VACATE_REQUEST.toLocaleLowerCase():
          const moveOutDate = ticket?.move_out_date;
          const vacateType = ticket?.vacate_type?.[0]?.value || '';
          requestSummary = [
            'Vacate request',
            vacateType,
            `Intended move out date: ${moveOutDate}`
          ]
            .filter(Boolean)
            .join(' - ');
          break;
        case EOptionType.FINAL_INSPECTION.toLocaleLowerCase():
          requestSummary = `Final inspection request - ${ticket.available_time}`;
          break;
        default:
          const {
            maintenance_object,
            general_inquiry,
            reschedule_reason,
            note,
            key_request,
            pet_request,
            break_in_incident,
            key_handover_request,
            domestic_violence_support,
            call_back_request,
            change_tenant_request,
            ask_property_manager,
            request_inspection_reschedule,
            submit_vacate_request,
            log_maintenance_request,
            request_summary,
            pet_description,
            maintenance_issue,
            key_request_reason,
            incident_detail,
            situation,
            call_back_reason,
            need_human_follow_up,
            noted_issues,
            urgency,
            change_tenancy_details
          } = linkedTaskResponse?.payload?.ticket || {};

          requestSummary =
            request_summary ||
            maintenance_object ||
            general_inquiry ||
            note ||
            reschedule_reason ||
            key_request ||
            pet_request ||
            break_in_incident ||
            key_handover_request ||
            domestic_violence_support ||
            call_back_request ||
            change_tenant_request ||
            ask_property_manager ||
            request_inspection_reschedule ||
            submit_vacate_request ||
            log_maintenance_request ||
            maintenance_issue ||
            key_request_reason ||
            incident_detail ||
            pet_description ||
            situation ||
            call_back_reason ||
            need_human_follow_up ||
            noted_issues ||
            urgency ||
            change_tenancy_details;
      }
    }
    return requestSummary;
  }
}
