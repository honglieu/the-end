import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { PermissionService } from '@services/permission.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { Subject, takeUntil } from 'rxjs';
import {
  EAddOn,
  EAddOnType,
  EAgencyPlan
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ConversationService } from '@services/conversation.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { ToastrService } from 'ngx-toastr';
import { UPGRADE_REQUEST_SENT } from '@services/messages.constants';
import { ConfigPlan } from '@/app/console-setting/agencies/utils/console.type';

@Component({
  selector: 'language-translation-label',
  templateUrl: './language-translation-label.component.html',
  styleUrls: ['./language-translation-label.component.scss']
})
export class LanguageTranslationLabelComponent implements OnInit, OnDestroy {
  @Input() messagesTranslate: string;
  @Input() senderType: string;
  @Input() inputLanguage: string;
  @Input() isFromAIAssitant: boolean = false;
  @Output() languageTranslationDisabled = new EventEmitter<boolean>();
  outputLanguage: string = 'en';
  isOwnerOrAdmin: boolean = false;
  isLanguageTranslationDisabled: boolean = false;
  currentPlan: ConfigPlan;
  currentMailboxId: string;
  popupState = {
    plansSummary: false,
    requestSent: false,
    requestFromTab: false
  };
  private destroy$ = new Subject<void>();

  constructor(
    private permissionService: PermissionService,
    private agencyDashboardService: AgencyService,
    private conversationService: ConversationService,
    private inboxService: InboxService,
    private toastService: ToastrService
  ) {}

  ngOnInit(): void {
    this.isOwnerOrAdmin =
      this.permissionService.isOwner || this.permissionService.isAdministrator;
    this.agencyDashboardService.currentPlan$
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentPlan) => {
        if (!currentPlan) return;
        this.currentPlan = currentPlan;
        this.checkShowLabel(currentPlan);
      });

    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentMailboxId) => {
        if (!currentMailboxId) return;
        this.currentMailboxId = currentMailboxId;
      });
  }

  checkShowLabel(currentPlan: ConfigPlan) {
    if (this.isFromAIAssitant) {
      this.isLanguageTranslationDisabled =
        currentPlan.plan === EAgencyPlan.STARTER ||
        currentPlan.plan === EAgencyPlan.PRO ||
        (currentPlan.plan === EAgencyPlan.CUSTOM &&
          !currentPlan.features[EAddOnType.LANGUAGE_TRANSLATIONS].state);
    } else {
      this.isLanguageTranslationDisabled =
        (currentPlan.plan === EAgencyPlan.STARTER ||
          (currentPlan.plan === EAgencyPlan.CUSTOM &&
            !currentPlan.features[EAddOnType.LANGUAGE_TRANSLATIONS].state)) &&
        (this.senderType ? this.senderType !== 'user' : true);
    }
    this.languageTranslationDisabled.emit(this.isLanguageTranslationDisabled);
  }

  handlePopupState(state: {
    plansSummary?: boolean;
    requestSent?: boolean;
    requestFromTab?: boolean;
  }) {
    this.popupState = { ...this.popupState, ...state };
    if (state.requestSent && state.requestFromTab) {
      this.conversationService
        .sendMailRequestFeature(
          EAddOn.LANGUAGE_TRANSLATIONS,
          this.currentMailboxId
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.toastService.success(UPGRADE_REQUEST_SENT);
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
