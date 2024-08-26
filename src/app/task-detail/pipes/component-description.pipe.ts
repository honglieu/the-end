import { Pipe, PipeTransform } from '@angular/core';
import { StepDetail, TrudiStep } from '../modules/steps/utils/stepType';
import { EPropertyTreeType } from '../utils/functions';

@Pipe({
  name: 'componentDescription'
})
export class ComponentDescriptionPipe implements PipeTransform {
  transform(step: TrudiStep & StepDetail): string {
    let description = '';
    switch (step?.componentType) {
      case EPropertyTreeType.TENANCY_INVOICE:
      case EPropertyTreeType.CREDITOR_INVOICE:
        description = step?.widgetData?.invoiceDescription;
        break;
      case EPropertyTreeType.MAINTENANCE_INVOICE:
        description = step?.widgetData?.maintenanceInvoiceDescription;
        break;
      case EPropertyTreeType.MAINTENANCE_REQUEST:
        description = step?.widgetData?.maintenanceSummary;
        break;
      case EPropertyTreeType.NOTES:
        description =
          step?.widgetData?.entityType + ' - ' + step?.widgetData?.categoryName;
        break;
      case EPropertyTreeType.VACATE_DETAIL:
        description =
          step?.widgetData?.tenancyName + ' - ' + step?.widgetData?.vacateType;
        break;
      case EPropertyTreeType.LEASE_RENEWAL:
      case EPropertyTreeType.NEW_TENANCY:
      case EPropertyTreeType.ROUTINE_INSPECTION:
      case EPropertyTreeType.OUTGOING_INSPECTION:
      case EPropertyTreeType.INGOING_INSPECTION:
        description = step?.widgetData?.tenancyName;
        break;
      case EPropertyTreeType.COMPLIANCE:
        description = step?.widgetData?.categoryName;
        break;
    }

    return description;
  }
}
