import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subject, of, switchMap, takeUntil } from 'rxjs';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { EMailBoxStatus } from '@shared/enum/inbox.enum';
import { IMailBox } from '@shared/types/user.interface';
import { ECallTranscript } from '@/app/shared/types/message.interface';

@Component({
  selector: 'app-message-footer',
  templateUrl: './message-footer.component.html',
  styleUrls: ['./message-footer.component.scss']
})
export class MessageFooterComponent implements OnInit {
  @Input()
  public createdAt: string | null = null;
  @Input()
  public isRead: boolean | null = null;
  @Input()
  public senderType: string | null = null;
  @Input()
  public isSending: boolean = false;
  @Input()
  public isError: boolean = false;
  @Input() public documentType;
  public isShowTextWarning: boolean = false;
  public currentMailBox: IMailBox;
  public currentMailBoxId: string;
  private unsubscribe = new Subject<void>();
  @Output() reSendEmitter = new EventEmitter<Event>();

  get isShowResendButton() {
    const currentMailBoxStatus = this.currentMailBox.status;
    return ![EMailBoxStatus.DISCONNECT, EMailBoxStatus.ARCHIVE].includes(
      currentMailBoxStatus
    );
  }

  constructor(public inboxService: InboxService) {}

  ngOnInit() {
    this.isShowTextWarning = this.checkCallTranscriptType(this.documentType);
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((mailBoxId) => {
          if (mailBoxId) {
            this.currentMailBoxId = mailBoxId;
            return this.inboxService.listMailBoxs$;
          } else {
            return of(null);
          }
        })
      )
      .subscribe((listMailBoxs) => {
        if (listMailBoxs?.length) {
          this.currentMailBox = listMailBoxs.find(
            (mailBox) => mailBox.id === this.currentMailBoxId
          );
        }
      });
  }

  checkCallTranscriptType(documentType) {
    const showTextWarningType = [
      ECallTranscript.CALL_TRANSCRIPT,
      ECallTranscript.CALL_VOICE_RECORD,
      ECallTranscript.CALL_SCREENSHOT,
      ECallTranscript.CALL_SCREENCAST
    ];
    return showTextWarningType.includes(documentType?.name);
  }

  onResend(event: Event) {
    if (!this.isShowResendButton) return;

    this.reSendEmitter.emit(event);
  }
}
