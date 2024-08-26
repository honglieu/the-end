import { MailboxSettingApiService } from '@/app/mailbox-setting/services/mailbox-setting-api.service';
import { IAiReply } from '@/app/mailbox-setting/interface/mailbox-setting.interface';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { SCROLL_THRESHOLD } from '@/app/dashboard/utils/constants';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  debounceTime,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';

@Component({
  selector: 'merge-similar-enquiries',
  templateUrl: './merge-similar-enquiries.component.html',
  styleUrls: ['./merge-similar-enquiries.component.scss']
})
export class MergeSimilarEnquiriesComponent implements OnInit {
  @Input() visible: boolean = false;
  @Output() selectedReplies = new EventEmitter<IAiReply[]>();
  public disabledRecentReply: boolean = true;
  public isShowError: boolean = false;
  public isLoading: boolean = true;
  public isLoadingModal: boolean = true;
  public recentReply: IAiReply;
  public listReplies: IAiReply[];
  public isCurrentQuestion: boolean = true;
  public selectedAiReplies: IAiReply[] = [];
  private unsubscribe$: Subject<void> = new Subject<void>();
  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport;
  public pageIndex = 0;
  public enquiry$: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  public currentMailBoxId: string;
  public currentQuestionId: string;
  public totalPages = 0;
  constructor(
    private mailboxSettingService: MailboxSettingService,
    private mailboxSettingApiService: MailboxSettingApiService,
    private inboxService: InboxService
  ) {}

  ngOnInit(): void {
    this.getEnquiries();
    this.subscribeOpenPopup();
  }

  handleConfirm() {
    const repliesSelected = this.listReplies.filter((reply) => reply.selected);

    this.isShowError = !repliesSelected.length;
    if (this.isShowError) return;
    this.selectedAiReplies = [...repliesSelected, this.recentReply];
    this.visible = false;
    this.mailboxSettingService.setIsOpenPopupEnquiry(true);
    this.selectedReplies.emit(this.selectedAiReplies);
  }

  handleCancel() {
    this.mailboxSettingService.setIsOpenPopupMerge(false);
  }

  getEnquiries() {
    combineLatest([
      this.inboxService.getCurrentMailBoxId(),
      this.mailboxSettingService.getQuestionId()
    ])
      .pipe(
        takeUntil(this.unsubscribe$),
        switchMap(([mailboxId, questionId]) => {
          this.currentMailBoxId = mailboxId;
          this.currentQuestionId = questionId;
          return this.getMoreEnquiries();
        })
      )
      .subscribe();
  }

  getMoreEnquiries() {
    return this.enquiry$.asObservable().pipe(
      debounceTime(500),
      switchMap(() => {
        const payload = {
          questionId: this.currentQuestionId,
          mailBoxId: this.currentMailBoxId,
          page: this.pageIndex,
          size: 10
        };
        return this.mailboxSettingApiService
          .getSimilarQuestion(payload)
          .pipe(takeUntil(this.unsubscribe$));
      }),
      tap((enquiries) => {
        if (!enquiries) return;
        this.isLoadingModal = false;
        this.isLoading = false;
        const { totalPages, currentQuestion, response } = enquiries;
        this.totalPages = totalPages;
        if (currentQuestion.answerId) {
          currentQuestion.id = currentQuestion.answerId;
          delete currentQuestion.answerId;
        }
        this.recentReply = currentQuestion;
        if (this.recentReply) {
          this.recentReply.selected = true;
          this.isCurrentQuestion = true;
        }
        const newEnquiries = response.filter(
          (reply) => reply.id !== this.recentReply.id
        );
        this.listReplies = (this.listReplies || []).concat(newEnquiries);
      }),
      takeUntil(this.unsubscribe$)
    );
  }

  refreshDataEnquiries() {
    this.enquiry$.next(null);
  }

  onScrollDown() {
    if (this.isLoading || this.isLoadingModal) {
      return;
    }
    const element = this.viewport?.elementRef.nativeElement;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    if (
      distanceFromBottom <= SCROLL_THRESHOLD &&
      this.pageIndex < this.totalPages
    ) {
      this.pageIndex = this.pageIndex + 1;
      this.refreshDataEnquiries();
    }
  }

  subscribeOpenPopup() {
    this.mailboxSettingService
      .isOpenPopup()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((res) => {
        if (!res) return;
        this.visible = res;
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
