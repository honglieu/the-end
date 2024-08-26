import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { ERouterHiddenSidebar } from '@/app/dashboard/shared/types/sidebar.interface';
import { TaskType } from '@shared/enum';
import { EDataE2EMessageAction } from '@shared/enum/E2E.enum';
import { EInviteStatus, EUserDetailStatus } from '@shared/enum/user.enum';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { TaskItem } from '@shared/types/task.interface';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { Router } from '@angular/router';
import { EButtonAction } from '@/app/task-detail/interfaces/task-detail.interface';
import { EDefaultBtnDropdownOptions } from '@/app/trudi-scheduled-msg/utils/trudi-scheduled-msg.inteface';

interface IButtonAction {
  key: EButtonAction;
  icon: string;
  text: string;
  dataE2e: EDataE2EMessageAction;
  action: (e?: boolean) => void;
  hidden: boolean;
  disabled?: boolean;
  tooltipText?: string;
}
@Component({
  selector: 'button-action',
  templateUrl: './button-action.component.html',
  styleUrls: ['./button-action.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonActionComponent implements OnInit, OnChanges {
  public EDefaultBtnDropdownOptions = EDefaultBtnDropdownOptions;
  @Output() showModal = new EventEmitter<{ type: string; show: boolean }>();
  @Input() countMetadata: number;
  @Input() isUnidentifiedProperty: boolean = false;
  @Input() isFullWidth: boolean;
  @Input() trudiApp: boolean = false;
  @Input() isDisabled: boolean = false;
  @Input() ticket;
  @Input() currentConversation;
  @Input() currentTask: TaskItem;

  public listButtonAction: IButtonAction[] = [
    {
      key: EButtonAction.REPLY,
      icon: 'replyTextEditor',
      text: 'Reply',
      dataE2e: EDataE2EMessageAction.REPLY,
      action: () => {
        if (!this.shouldHandleProcess()) return;
        this.handleReply();
      },
      hidden: false
    },
    {
      key: EButtonAction.REPLY_ALL,
      icon: 'replyAll',
      text: 'Reply all',
      dataE2e: EDataE2EMessageAction.REPLY_ALL,
      action: () => {
        if (!this.shouldHandleProcess()) return;
        this.handleReplyAll();
      },
      hidden: true
    },
    {
      key: EButtonAction.FORWARD,
      icon: 'cornerUpRight',
      text: 'Forward',
      dataE2e: EDataE2EMessageAction.FORWARD,
      action: () => {
        if (!this.shouldHandleProcess()) return;
        this.handleReplyForward();
      },
      hidden: false
    }
  ];

  constructor(
    private inboxToolbarService: InboxToolbarService,
    private PreventButtonService: PreventButtonService,
    private router: Router
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['countMetadata']?.currentValue) {
      if (this.countMetadata > 1) {
        this.updateButton(EButtonAction.REPLY_ALL, {
          hidden: false
        });
      }
    }
    if (changes['isUnidentifiedProperty']) {
      this.updateButton(EButtonAction.REPLY, {
        hidden: this.isUnidentifiedProperty
      });
    }
    if (changes['trudiApp']) {
      this.listButtonAction = [
        {
          key: EButtonAction.REPLY_VIA_APP,
          icon: 'smartphone',
          text: 'Reply via app',
          dataE2e: EDataE2EMessageAction.REPLY_VIA_APP,
          action: (disabled) => {
            if (!this.shouldHandleProcess() || disabled) return;
            this.handleReplyViaApp();
          },
          hidden: false
        },
        {
          key: EButtonAction.OPEN_APP_CONVERSATION,
          icon: 'smartphone',
          text: 'Open app conversation',
          dataE2e: EDataE2EMessageAction.OPEN_APP_CONVERSATION,
          action: () => {
            if (!this.shouldHandleProcess()) return;
            this.handleOpenAppConversation();
          },
          hidden: true
        },
        {
          key: EButtonAction.REPLY_VIA_EMAIL,
          icon: 'mailThin',
          text: 'Reply via email',
          dataE2e: EDataE2EMessageAction.REPLY_VIA_EMAIL,
          action: () => {
            if (!this.shouldHandleProcess()) return;
            this.handleReplyViaEmail();
          },
          hidden: false
        },
        {
          key: EButtonAction.OPEN_EMAIL_CONVERSATION,
          icon: 'mailThin',
          text: 'Open email conversation',
          dataE2e: EDataE2EMessageAction.OPEN_EMAIL_CONVERSATION,
          action: () => {
            if (!this.shouldHandleProcess()) return;
            this.handleOpenEmailConversation();
          },
          hidden: true
        },
        {
          key: EButtonAction.FORWARD,
          icon: 'cornerUpRight',
          text: 'Forward',
          dataE2e: EDataE2EMessageAction.FORWARD,
          action: () => {
            if (!this.shouldHandleProcess()) return;
            this.handleReplyForward();
          },
          hidden: false
        }
      ];
    }

    if (changes['ticket']) {
      if (this.ticket?.replyConversationApp) {
        this.updateButton(EButtonAction.REPLY_VIA_APP, { hidden: true });
        this.updateButton(EButtonAction.OPEN_APP_CONVERSATION, {
          hidden: false
        });
      }
      if (this.ticket?.replyConversationEmail) {
        this.updateButton(EButtonAction.REPLY_VIA_EMAIL, { hidden: true });
        this.updateButton(EButtonAction.OPEN_EMAIL_CONVERSATION, {
          hidden: false
        });
      }

      if (changes['isDisabled']?.currentValue) {
        if (this.isDisabled) {
          this.updateButton(EButtonAction.REPLY_VIA_APP, { disabled: true });
        }
      }
    }

    if (changes['currentConversation']?.currentValue) {
      if (this.currentConversation?.inviteStatus === EInviteStatus.OFFBOARDED) {
        this.updateButton(EButtonAction.REPLY_VIA_APP, {
          disabled: true,
          tooltipText: 'This user has been offboarded'
        });
      }
      if (this.currentConversation?.crmStatus === EUserDetailStatus.DELETED) {
        this.updateButton(EButtonAction.REPLY_VIA_APP, {
          disabled: true,
          tooltipText: 'This user has been deleted'
        });
      }
    }
    if (changes['currentTask']?.currentValue) {
      this.updateButton(EButtonAction.REPLY_VIA_APP, {
        hidden:
          (this.currentTask?.taskType === TaskType.TASK &&
            !this.router.url?.includes(ERouterHiddenSidebar.TASK_DETAIL)) ||
          !!this.ticket?.replyConversationApp
      });
      this.updateButton(EButtonAction.REPLY_VIA_EMAIL, {
        text:
          this.currentTask?.taskType === TaskType.TASK &&
          !this.router.url?.includes(ERouterHiddenSidebar.TASK_DETAIL)
            ? 'Reply'
            : 'Reply via email'
      });
    }
  }

  ngOnInit(): void {
    if (!this.trudiApp) {
      this.updateButton(EButtonAction.REPLY, {
        hidden: this.isUnidentifiedProperty
      });
    }
  }

  handleReply() {
    this.showModal.next({ type: EButtonAction.REPLY, show: true });
    this.handleClearSelected();
  }

  handleReplyAll() {
    this.showModal.next({ type: EButtonAction.REPLY_ALL, show: true });
    this.handleClearSelected();
  }

  handleReplyForward() {
    this.showModal.next({ type: EButtonAction.FORWARD, show: true });
    this.handleClearSelected();
  }

  handleReplyViaApp() {
    this.showModal.next({ type: EButtonAction.REPLY_VIA_APP, show: true });
    this.handleClearSelected();
  }

  handleOpenAppConversation() {
    this.showModal.next({
      type: EButtonAction.OPEN_APP_CONVERSATION,
      show: true
    });
    this.handleClearSelected();
  }

  handleReplyViaEmail() {
    this.showModal.next({
      type: EButtonAction.REPLY_VIA_EMAIL,
      show: true
    });
    this.handleClearSelected();
  }

  handleOpenEmailConversation() {
    this.showModal.next({
      type: EButtonAction.OPEN_EMAIL_CONVERSATION,
      show: true
    });
    this.handleClearSelected();
  }

  handleClearSelected() {
    this.inboxToolbarService.setInboxItem([]);
  }

  shouldHandleProcess(): boolean {
    return this.PreventButtonService.shouldHandleProcess(
      EButtonTask.TASK_CREATE_MESSAGE,
      EButtonType.TASK
    );
  }

  updateButton(key: EButtonAction, updates: Partial<IButtonAction>) {
    const button = this.listButtonAction.find((item) => item.key === key);
    if (button) {
      Object.assign(button, updates);
    }
  }
}
