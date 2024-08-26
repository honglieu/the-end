import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { EButtonAction } from '@/app/task-detail/interfaces/task-detail.interface';
import {
  EInboxAction,
  ERouterLinkInbox
} from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { EActionUserType } from '@/app/user/utils/user.enum';
import { ETypeToolbar } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { EMailBoxStatus } from '@shared/enum';
import { Router } from '@angular/router';

export enum EButtonFrom {
  TASK_PAGE = 'TASK_PAGE'
}

@Directive({
  selector: '[disableOpenSendMsgModal]'
})
export class DisableOpenSendMsgModalDirective
  implements OnInit, OnDestroy, OnChanges
{
  @Input() disabled: boolean = null;
  private destroy$ = new Subject<void>();
  private buttonKey;
  public isTaskDetailPage: boolean = false;
  private listIgnoreDisable = [
    EButtonAction.MARK_AS_READ,
    EButtonAction.MARK_AS_UNREAD,
    EButtonAction.OPEN_APP_CONVERSATION,
    EButtonAction.REPLY_VIA_APP,
    EInboxAction.MOVE_TO_FOLDER,
    EInboxAction.ADD_TO_TASK,
    EInboxAction.MOVE_TASK,
    EInboxAction.RESOLVE,
    EInboxAction.EXPORT_CONVERSATION_HISTORY,
    EInboxAction.EXPORT_TASK_ACTIVITY,
    EInboxAction.REPORT_SPAM,
    EInboxAction.DELETE,
    EInboxAction.RE_OPEN,
    EInboxAction.SAVE_TO_RENT_MANAGER,
    EInboxAction.MOVE_MESSAGE,
    EInboxAction.NOT_SPAM,
    EActionUserType.APP_INVITE,
    EActionUserType.DELETE_PERSON,
    ETypeToolbar.Close,
    'count-selected',
    EInboxAction.MARK_AS_STATUS,
    EInboxAction.MORE
  ];

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private router: Router,
    private inboxService: InboxService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['disabled']) {
      this.el.nativeElement.disabled = !!this.disabled;
    }
  }

  ngOnInit(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const mailBoxId = urlParams.get('mailBoxId');
    this.isTaskDetailPage =
      this.router.url.includes(ERouterLinkInbox.TASK_DETAIL) ||
      this.router.url.includes('/dashboard/tasks');

    this.buttonKey = this.el.nativeElement.dataset['buttonKey'];
    if (this.disabled) {
      this.el.nativeElement.setAttribute('disabled', true);
      return;
    }
    if (
      this.listIgnoreDisable.includes(this.buttonKey) ||
      this.isTaskDetailPage ||
      !mailBoxId
    )
      return;

    this.inboxService.listMailBoxs$
      .pipe(takeUntil(this.destroy$))
      .subscribe((listMailBoxs) => {
        if (!listMailBoxs) return;
        const currentMailbox = listMailBoxs?.find(
          (mailbox) => mailbox?.id === mailBoxId
        );

        if (
          [EMailBoxStatus.ARCHIVE, EMailBoxStatus.DISCONNECT].includes(
            currentMailbox.status
          )
        ) {
          if (this.el.nativeElement.nodeName === 'BUTTON') {
            this.updateButtonStyle(this.el.nativeElement.classList, 'disabled');
          }
          this.renderer.setStyle(
            this.el.nativeElement,
            'pointer-events',
            'none'
          );
          this.renderer.setStyle(this.el.nativeElement, 'cursor', 'default');
          this.renderer.setStyle(this.el.nativeElement, 'opacity', '.5');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateButtonStyle = (classList?: DOMTokenList, action = 'not-disabled') => {
    switch (action) {
      case 'disabled':
        if (classList.contains('trudi-btn-primary')) {
          this.renderer.setStyle(
            this.el.nativeElement,
            'background-color',
            'var(--brand-200)'
          );
          this.renderer.setStyle(this.el.nativeElement, 'box-shadow', 'none');
        }
        break;

      default:
        this.renderer.removeStyle(this.el.nativeElement, 'background-color');
        this.renderer.removeStyle(this.el.nativeElement, 'box-shadow');
        break;
    }
  };
}
