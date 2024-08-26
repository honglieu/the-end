import { Component, OnInit, Input } from '@angular/core';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { TIME_FORMAT } from '@services/constants';
import { ESyncStatus } from '@/app/task-detail/utils/functions';

@Component({
  selector: 'sync-status',
  templateUrl: './sync-status.component.html',
  styleUrls: ['./sync-status.component.scss']
})
export class SyncStatusComponent implements OnInit {
  @Input() syncStatus: ESyncStatus | string = ESyncStatus.UN_SYNC;
  @Input() lastTimeSynced: string;

  public readonly TIME_FORMAT = TIME_FORMAT;
  public readonly SYNCTYPE = ESyncStatus;
  public synData = {
    [ESyncStatus.NOT_SYNC]: {
      icon: 'iconCloseDangder',
      text: 'Not synced'
    },
    [ESyncStatus.UN_SYNC]: {
      icon: 'iconUnSyncChanges',
      text: 'Unsynced changes'
    },
    [ESyncStatus.INPROGRESS]: {
      icon: 'syncingV2',
      text: 'Syncing'
    },
    [ESyncStatus.FAILED]: {
      icon: 'syncFailV2',
      text: 'Fail to sync'
    },
    [ESyncStatus.COMPLETED]: {
      icon: 'syncSuccessV2',
      text: 'Synced'
    },
    [ESyncStatus.PENDING]: {
      icon: 'iconCloseDangder',
      text: 'Not synced'
    }
  };
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}

  ngOnInit(): void {}
}
