import {
  Component,
  Input,
  TemplateRef,
  SimpleChanges,
  OnChanges,
  OnDestroy,
  Inject
} from '@angular/core';
import { Subject } from 'rxjs';
import { PluralizePipe } from '../../common/pipes/pluralize.pipe';
import { SyncMaintenanceType } from '../../common/enums/task-status.enum';
import { EViewDetailMode } from '../../common/enums/task-detail-view-mode.enum';
import { IconsSync } from '../../common/enums/icon-sync.enum';
import { TRUDI_DATE_FORMAT } from '../../provider/trudi-config';
import { TrudiDateFormat } from '../../interfaces';

const TIME_FORMAT = 'hh:mm a';
export interface IQuoteContent {
  senderName: string;
  message: string;
  dateTime: string;
  attachmentCount?: number;
  scheduleMessageCount?: number;
  summaryCount?: number;
  countUnreadTicket?: number;
}

@Component({
  selector: 'trudi-quote',
  templateUrl: './trudi-quote.component.html',
  styleUrls: ['./trudi-quote.component.scss'],
  providers: []
})
export class TrudiQuoteComponent implements OnChanges, OnDestroy {
  @Input() e2ePrefix: string = '';
  @Input() conversationId: string;
  @Input() isConversationOfMsg = false;
  @Input() showMoreIcon = true;
  @Input() dropDownContent: TemplateRef<HTMLElement>;
  @Input() color;
  @Input() isRead = true;
  @Input() isLastMessageDraft: boolean = false;
  @Input() isScheduleMessage = false;
  @Input() searchText: string = '';
  @Input() iconName: string;
  @Input() syncStatus: string;
  @Input() content: IQuoteContent = {
    senderName: '',
    message: '',
    dateTime: ''
  };
  @Input() taskDetailViewMode = EViewDetailMode.TASK;
  @Input() hightLightLastMsgUnseen: boolean = false;
  @Input() isDeliveryFail: boolean;
  @Input() isHasTicketSession: boolean;
  @Input() isPmJoined: boolean;
  private destroy$ = new Subject<void>();
  public visible = false;
  public attachmentTooltipText: string = '';
  public scheduleMessageTooltipText: string = '';
  public message = '';
  public iconSync;
  readonly SYNC_STATUS = SyncMaintenanceType;
  readonly ICON_SYNC = IconsSync;
  readonly TIME_FORMAT = TIME_FORMAT;
  readonly dateFormatPipe$ = this.trudiDateFormat.dateFormatPipe$;
  readonly EViewDetailMode = EViewDetailMode;

  constructor(
    @Inject(TRUDI_DATE_FORMAT) private trudiDateFormat: TrudiDateFormat
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const changeContent = changes['content']?.currentValue;
    if (changeContent) {
      const pluralizeClass = new PluralizePipe();
      this.scheduleMessageTooltipText = changeContent.scheduleMessageCount
        ? `${pluralizeClass.transform(
            changeContent.scheduleMessageCount,
            'message'
          )} scheduled`
        : '';
      this.attachmentTooltipText = changeContent.attachmentCount
        ? `${pluralizeClass.transform(
            this.content.attachmentCount,
            'attachment'
          )}`
        : '';
      this.message = changeContent?.message;
    }

    this.checkSyncStatusMessage(this.syncStatus);
  }
  onOpenConversationAction(event: Event) {
    event.stopPropagation();
  }

  checkSyncStatusMessage(syncStatus: string) {
    switch (syncStatus) {
      case this.SYNC_STATUS.COMPLETED:
      case this.SYNC_STATUS.SUCCESS:
        this.iconSync = this.ICON_SYNC.SYNC_SUCCESS;
        break;
      case this.SYNC_STATUS.FAILED:
        this.iconSync = this.ICON_SYNC.SYNC_FAIL;
        break;
      case this.SYNC_STATUS.INPROGRESS:
      case this.SYNC_STATUS.PENDING:
        this.iconSync = this.ICON_SYNC.SYNCING;
        break;
      default:
        break;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
