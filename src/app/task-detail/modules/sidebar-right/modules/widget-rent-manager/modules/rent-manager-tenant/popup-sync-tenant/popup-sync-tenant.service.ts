import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { RMWidgetDataField } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { EFieldType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/enums/rent-manager-lease-renewal.enum';
import { TenantApiService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/api/tenant-api.service';
import { TenantFormMasterService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/forms/tenant-form-master.service';

@Injectable()
export class PopupSyncTenantService {
  constructor(
    private tenantApiService: TenantApiService,
    private tenantFormMasterService: TenantFormMasterService,
    private widgetRMService: WidgetRMService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  public mapDataSync(formValue) {
    const newFormValue = this.transformNullToUndefined(formValue);
    const { name, address } = newFormValue.info;
    const { oneTime, recurring } = newFormValue.charges;
    const { subsidies } = newFormValue.setting;
    const taskId = this.tenantApiService.getIDsFromOtherService().taskId;
    const payload = {
      ptLeaseId: newFormValue.id,
      taskId,
      tenancy: name,
      contacts: this.mapContacts(newFormValue.contacts),
      addresses: this.mapAddress(address),
      settings: this.mapSetting(newFormValue.setting),
      lease: this.mapLeaseDetail(newFormValue.lease),
      deposit: this.mapDeposit(formValue.deposit),
      charges: this.mapCharge(oneTime),
      subsidyTenants: subsidies?.map((subsidy) => ({
        subsidyId: subsidy
      })),
      recurringCharges: this.mapRecurringCharges(recurring),
      userDefinedValues: this.mapUserDefinedField(formValue.userFields)
    };
    return payload;
  }

  formatDataTenant(status, data) {
    const {
      charges,
      addresses,
      contacts,
      lease,
      settings,
      tenancy,
      subsidyTenants
    } = data;
    const { firstName, lastName } = tenancy;
    const { rentPeriod, rentDueDay } = settings;
    const formatData = {
      addresses,
      firstName,
      lastName,
      charges,
      contacts,
      lease,
      rentDueDay,
      rentPeriod,
      settings,
      subsidyTenants
    };
    return {
      syncStatus: status,
      data: formatData
    };
  }

  mapDeposit(deposit) {
    const { amount, date, isDepositPrior, type } = deposit;
    return {
      securityDepositTypeId: type,
      amount: this.parseAmount(amount),
      transactionDate: date,
      isSPToGLStartDate: isDepositPrior
    };
  }

  mapContacts(contacts) {
    return contacts.map(
      ({
        applicantType,
        contactType,
        email,
        firstName,
        contactId,
        isPrimary,
        lastName,
        phoneNumber
      }) => ({
        firstName,
        lastName,
        email,
        phoneNumber,
        applicantType,
        isPrimary,
        contactTypeId: contactType,
        contactId
      })
    );
  }

  mapAddress(address) {
    return address?.map((item) => ({
      addressTypeId: item.typeId,
      address: item.address,
      isPrimary: item.isPrimary
    }));
  }

  mapLeaseDetail(lease) {
    const {
      endDate,
      expectedMoveOutDate,
      moveInDate,
      moveOutDate,
      noticeDate,
      signDate,
      startDate,
      term
    } = lease;

    return {
      moveInDate:
        this.agencyDateFormatService.expectedTimezoneStartOfDay(moveInDate),
      moveOutDate:
        this.agencyDateFormatService.expectedTimezoneStartOfDay(moveOutDate),
      noticeDate:
        this.agencyDateFormatService.expectedTimezoneStartOfDay(noticeDate),
      expectedMoveOutDate:
        this.agencyDateFormatService.expectedTimezoneStartOfDay(
          expectedMoveOutDate
        ),
      startDate:
        this.agencyDateFormatService.expectedTimezoneStartOfDay(startDate),
      endDate: this.agencyDateFormatService.expectedTimezoneStartOfDay(endDate),
      signDate:
        this.agencyDateFormatService.expectedTimezoneStartOfDay(signDate),
      leaseTermId: term
    };
  }

  mapSetting(setting) {
    const {
      taxTypeID,
      rentDueDay,
      rentPeriod,
      chargeLateFee,
      acceptPayment,
      acceptCheck,
      allowTWAPayment
    } = setting;

    return {
      rentDueDay: rentDueDay,
      rentPeriod: rentPeriod,
      defaultTaxTypeId: Number(taxTypeID) > 0 ? taxTypeID : undefined,
      doNotAcceptChecks: Boolean(acceptCheck),
      doNotAcceptPayments: Boolean(acceptPayment),
      doNotChargeLateFees: Boolean(chargeLateFee),
      doNotAllowTWAPayments: Boolean(allowTWAPayment)
    };
  }

  mapRecurringCharges(recurring) {
    return recurring?.map(
      ({
        amount,
        comment,
        frequency,
        id,
        fromDate,
        toDate,
        calculation,
        type,
        charge,
        isException
      }) => ({
        amount: this.parseAmount(amount),
        calculation: calculation,
        chargeTypeId: type,
        comment: comment,
        entityType: charge,
        fromDate:
          this.agencyDateFormatService.expectedTimezoneStartOfDay(fromDate),
        id: id ?? undefined,
        toDate: this.agencyDateFormatService.expectedTimezoneStartOfDay(toDate),
        frequency,
        isException: isException
      })
    );
  }

  mapCharge(oneTime) {
    return oneTime?.map(({ amount, comment, date, id, reference, type }) => ({
      chargeTypeId: type,
      transactionDate:
        this.agencyDateFormatService.expectedTimezoneStartOfDay(date),
      reference: reference,
      comment,
      amount: this.parseAmount(amount),
      id: id ?? undefined
    }));
  }

  mapUserDefinedField(userFields) {
    return (
      userFields?.map((field) => {
        const item = { fieldId: field?.id };
        switch (field?.fieldType) {
          case EFieldType.IMAGE:
          case EFieldType.FILE:
            const file = field?.file[0] ?? {};
            item['attachment'] = {
              fileName: file?.fileName,
              mediaLink: file?.mediaLink,
              mediaType: file?.mediaType
            };
            break;
          case EFieldType.DROPDOWN:
            item['value'] = field?.selectedValues;
            break;
          case EFieldType.CHECKED_LIST:
            item['value'] = (field?.selectedValues || []).join(',');
            break;
          case EFieldType.DATE:
            item['value'] =
              this.agencyDateFormatService.expectedTimezoneStartOfDay(
                field?.value
              );
            break;
          default:
            item['value'] = field?.value?.toString()?.trim();
            break;
        }

        return item;
      }) || []
    );
  }

  parseAmount(amount) {
    return typeof amount === 'string'
      ? parseFloat(amount.replace(/,/g, ''))
      : amount ?? undefined;
  }

  updateTenantDetailWidget(data, id: string) {
    const preData = this.widgetRMService.leasing.value;
    let newData = [
      ...preData
        .filter((one) => one.id !== id)
        .map((e) => {
          if (e?.firstTimeSyncSuccess) {
            return { ...e, firstTimeSyncSuccess: false };
          }
          return e;
        })
    ];
    if (data) {
      newData = [data, ...newData];
      this.widgetRMService.setRMWidgetStateByType(
        RMWidgetDataField.NEW_TENANT,
        'UPDATE',
        newData
      );
      return;
    }
    this.widgetRMService.setRMWidgetStateByType(
      RMWidgetDataField.NEW_TENANT,
      'REMOVE',
      newData
    );
  }

  transformNullToUndefined(obj: any) {
    if (obj === null) {
      return undefined;
    }
    if (obj instanceof Date) {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.transformNullToUndefined(item));
    }
    if (typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          result[key] = this.transformNullToUndefined(obj[key]);
        }
      }
      return result;
    }
    return obj;
  }

  public async _updateWidgetData(
    tenant: any,
    trackId: string,
    syncStatus: ESyncStatus,
    syncDate: Date = new Date()
  ) {
    const tenantsOfWidget: any[] =
      (await firstValueFrom(
        this.widgetRMService.getRMWidgetStateByType(
          RMWidgetDataField.NEW_TENANT
        )
      )) || [];

    const newTenant = {
      ...tenant,
      syncStatus: syncStatus || ESyncStatus.NOT_SYNC,
      syncDate,
      firstTimeSyncSuccess: syncStatus == ESyncStatus.COMPLETED
    };

    const findIndex = tenantsOfWidget.findIndex(
      (tenant) => tenant.id === trackId
    );

    if (findIndex === -1) {
      tenantsOfWidget.unshift(newTenant);
    } else {
      tenantsOfWidget[findIndex] = Object.assign(
        tenantsOfWidget[findIndex],
        newTenant
      );
    }

    this.widgetRMService.setRMWidgetStateByType(
      RMWidgetDataField.NEW_TENANT,
      'UPDATE',
      tenantsOfWidget
    );
  }
}
