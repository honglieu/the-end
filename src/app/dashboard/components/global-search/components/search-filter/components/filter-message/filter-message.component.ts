import { EConversationType, TaskStatusType } from '@shared/enum';
import { Component, OnInit } from '@angular/core';
import { GlobalSearchService } from '@/app/dashboard/components/global-search/services/global-search.service';
import { Subject, filter, takeUntil, tap } from 'rxjs';
import { isEqual } from 'lodash-es';

interface MessageToggle {
  label: string;
  isChecked: boolean;
  value: TaskStatusType;
  isHidden: boolean;
}

@Component({
  selector: 'filter-message',
  templateUrl: './filter-message.component.html',
  styleUrls: ['./filter-message.component.scss']
})
export class FilterMessageComponent implements OnInit {
  private unsubscribe = new Subject<void>();
  public messageStatus: TaskStatusType[];
  messageToggles: MessageToggle[] = [
    {
      label: 'Open messages',
      isChecked: true,
      value: TaskStatusType.inprogress,
      isHidden: false
    },
    {
      label: 'Resolved messages',
      isChecked: false,
      value: TaskStatusType.completed,
      isHidden: false
    },
    {
      label: 'Deleted messages',
      isChecked: false,
      value: TaskStatusType.deleted,
      isHidden: false
    }
  ];

  constructor(private globalSearchService: GlobalSearchService) {}

  ngOnInit(): void {
    this.globalSearchService.globalSearchPayload$
      .pipe(
        takeUntil(this.unsubscribe),
        tap((payload) => {
          this.messageToggles.find(
            (item) => item.value === TaskStatusType.deleted
          ).isHidden = payload.conversationType !== EConversationType.EMAIL;
        }),
        filter((payload) => !isEqual(payload.messageStatus, this.messageStatus))
      )
      .subscribe(() => {
        this.messageToggles = this.messageToggles.map((message) =>
          message.value === TaskStatusType.inprogress
            ? { ...message, isChecked: true }
            : { ...message, isChecked: false }
        );
      });
  }

  onChangeToggle(status: boolean, toggle: MessageToggle): void {
    this.messageToggles.find((item) => item.value === toggle.value).isChecked =
      status;
    this.messageStatus = this.messageToggles
      .filter((item) => item.isChecked)
      .map((item) => item.value);
    this.globalSearchService.setGlobalSearchPayload({
      messageStatus: this.messageStatus
    });
  }
}
