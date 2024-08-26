import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { ESyncStatus } from '@/app/task-detail/utils/functions';

@Pipe({ name: 'viewFailedSyncBill' })
export class ViewFailedSyncBillPipe implements PipeTransform {
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}
  transform(typeAction, workOrderValue): object {
    if (!workOrderValue) {
      return { disabled: false };
    }
    const billSyncedFail = workOrderValue
      .filter(
        (item) =>
          item.syncStatus === ESyncStatus.FAILED && item.type === typeAction
      )
      .map((item) => ({
        tooltip: `Fail to sync ${dayjs(item.syncDate).format(
          this.agencyDateFormatService.dateFormat$.getValue()
            .DATE_AND_TIME_FORMAT_DAYJS
        )} `,
        isDisplay: true
      }))[0];

    if (billSyncedFail) {
      return billSyncedFail;
    }

    return { isDisplay: false };
  }
}
