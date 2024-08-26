import { Component } from '@angular/core';
import { TaskService } from '@services/task.service';
import { TenancyInvoiceService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/tenancy-invoice.service';
import { TrudiService } from '@services/trudi.service';
import { CreditorInvoicingService } from '@services/creditor-invoicing.service';
import { SmokeAlarmAPIService } from '@/app/smoke-alarm/services/smoke-alarm-api.service';
import { TenancyInvoicingService } from '@services/tenancy-invoicing.service';
import { GeneralComplianceAPIService } from '@/app/general-compliance/services/general-compliance-api.service';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { TaskNameId } from '@shared/enum/task.enum';
import { EInvoiceStatus } from '@shared/types/tenancy-invoicing.interface';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { EGeneralComplianceButtonAction } from '@/app/general-compliance/utils/generalComplianceType';
import { ESmokeAlarmButtonAction } from '@/app/smoke-alarm/utils/smokeAlarmType';
import { TenantVacateApiService } from '@/app/tenant-vacate/services/tenant-vacate-api.service';
import { ETenantVacateButtonAction } from '@/app/tenant-vacate/utils/tenantVacateType';

@Component({
  selector: 'invoice-widget',
  template: ''
})
export class InvoiceWidgetComponent {
  public syncPropertyTree = ESyncStatus;
  constructor(
    public taskService: TaskService,
    public tenancyInvoicingService: TenancyInvoiceService,
    public trudiService: TrudiService,
    public creditorInvoicingService: CreditorInvoicingService,
    public smokeAlarmAPIService: SmokeAlarmAPIService,
    public tenancyInvoiceService: TenancyInvoicingService,
    public generalComplianceAPIService: GeneralComplianceAPIService,
    public tenantVacateApiService: TenantVacateApiService
  ) {}

  updateButtonStatus() {
    const trudiBtnResponse =
      this.tenancyInvoiceService.tenancyInvoicingResponse.getValue();
    const trudiBtnResponeCreditor =
      this.creditorInvoicingService.creditorInvoicingResponse?.getValue();
    const trudiBtnResponeData = this.trudiService.getTrudiResponse?.getValue();
    const taskNameId =
      this.taskService.currentTask$.value?.trudiResponse?.setting?.taskNameId;

    switch (taskNameId) {
      case TaskNameId.invoiceTenant:
        if (
          trudiBtnResponse?.data?.[0]?.body?.button[EInvoiceStatus.DEFAULT]?.[0]
            ?.isCompleted === false
        ) {
          trudiBtnResponse.data[0].body.button[
            EInvoiceStatus.DEFAULT
          ][0].isCompleted = true;
          trudiBtnResponse.data[0].body.button[
            EInvoiceStatus.DEFAULT
          ][0].status = TrudiButtonEnumStatus.COMPLETED;
          this.tenancyInvoiceService.tenancyInvoicingResponse.next(
            trudiBtnResponse
          );
        }
        break;
      case TaskNameId.invoicing:
        trudiBtnResponeCreditor.data[0].body.button = [
          {
            index: 0,
            action: 'send_invoice_to_property_tree',
            isCompleted: true,
            isInvoice: false,
            status: TrudiButtonEnumStatus.COMPLETED,
            text: 'Send invoice',
            type: 'text'
          },
          ...trudiBtnResponeCreditor.data[0].body.button.map((item) => ({
            ...item,
            index: item.index + 1
          }))
        ];
        this.creditorInvoicingService.creditorInvoicingResponse.next(
          trudiBtnResponeCreditor
        );
        break;
      case TaskNameId.generalCompliance:
        if (
          trudiBtnResponeData?.data?.[0]?.body?.decisions?.[0]?.button?.[3]
            ?.isCompleted === false
        ) {
          trudiBtnResponeData.data[0].body.decisions[0].button[3].isCompleted =
            true;
          trudiBtnResponeData.data[0].body.decisions[0].button[3].status =
            TrudiButtonEnumStatus.COMPLETED;
          this.trudiService.updateTrudiResponse = trudiBtnResponeData;

          this.generalComplianceAPIService
            .updateButtonStatus(
              this.taskService.currentTask$.value?.id,
              EGeneralComplianceButtonAction.sendInvoiceToPT,
              TrudiButtonEnumStatus.COMPLETED
            )
            .subscribe();
        }

        break;
      case TaskNameId.smokeAlarms:
        if (
          trudiBtnResponeData?.data?.[0]?.body?.decisions?.[0]?.button?.[3]
            ?.isCompleted === false
        ) {
          trudiBtnResponeData.data[0].body.decisions[0].button[3].isCompleted =
            true;
          trudiBtnResponeData.data[0].body.decisions[0].button[3].status =
            TrudiButtonEnumStatus.COMPLETED;
          this.trudiService.updateTrudiResponse = trudiBtnResponeData;

          this.smokeAlarmAPIService
            .updateButtonStatus(
              this.taskService.currentTask$.value?.id,
              ESmokeAlarmButtonAction.sendInvoiceToPT,
              TrudiButtonEnumStatus.COMPLETED
            )
            .subscribe();
        }

        break;
      case TaskNameId.tenantVacate:
        if (
          trudiBtnResponeData?.data?.[0]?.body?.decisions?.[1]?.button?.[4]
            ?.isCompleted === false
        ) {
          trudiBtnResponeData.data[0].body.decisions[1].button[4].isCompleted =
            true;
          trudiBtnResponeData.data[0].body.decisions[1].button[4].status =
            TrudiButtonEnumStatus.COMPLETED;
          this.trudiService.updateTrudiResponse = trudiBtnResponeData;

          this.tenantVacateApiService
            .updateButtonStatus(
              this.taskService.currentTask$.value?.id,
              ETenantVacateButtonAction.sendBreakLeaseInvoicesToPropertyTree,
              TrudiButtonEnumStatus.COMPLETED,
              this.taskService.currentTask$.value.agencyId
            )
            .subscribe();
        }

        break;
      default:
        [];
    }
  }
}
