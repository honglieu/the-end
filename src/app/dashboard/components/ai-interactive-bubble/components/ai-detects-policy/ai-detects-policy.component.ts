import { TrudiUiModule } from '@trudi-ui';
import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { NzPopoverDirective, NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Subject, filter, finalize, map, takeUntil, tap } from 'rxjs';
import { ChatGptService } from '@services/chatGpt.service';
import { AIDetectPolicyService } from '@/app/dashboard/components/ai-interactive-bubble/services/ai-detect-policy.service';
import {
  AiInteractiveBubbleInitialData,
  EAiWindowState
} from '@/app/dashboard/components/ai-interactive-bubble/interfaces/ai-interactive-bubble.interface';
import uuid4 from 'uuid4';
import { AiPolicyService } from '@/app/dashboard/services/ai-policy.service';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { AiInteractiveBuilderService } from '@/app/shared/components/tiny-editor/services/ai-interactive-builder.service';
import { focusAIElement } from '@/app/dashboard/components/ai-interactive-bubble/utils/ai-interactive-helper';
import { AIInteractiveInitialDataToken } from '@/app/dashboard/components/ai-interactive-bubble/utils/constant';
import { UserService } from '@/app/dashboard/services/user.service';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { CurrentUser } from '@/app/shared/types/user.interface';

@Component({
  selector: 'ai-detects-policy',
  standalone: true,
  imports: [
    NzPopoverModule,
    CommonModule,
    NzSkeletonModule,
    NzToolTipModule,
    TrudiUiModule
  ],
  templateUrl: './ai-detects-policy.component.html',
  styleUrl: './ai-detects-policy.component.scss'
})
export class AIDetectsPolicyComponent implements OnInit, OnDestroy {
  @Input() parentElementRef: ElementRef<HTMLElement>;
  @ViewChild('popoverView') public popover: NzPopoverDirective;
  public policies = [];
  public currentPolicyIdx: number = 0;
  public isLoading: boolean = false;
  public isMsgChanging: boolean = false;
  private unsubscribe = new Subject<void>();
  public unignoredPolicies = [];
  public showIgnored: boolean = false;
  public canUseAI: boolean = false;
  public noPoliciesDetected: boolean = true;
  public readonly EAiWindowState = EAiWindowState;
  public visible: boolean = false;
  private isPolicyPanelOpened: boolean = false;
  private aiWindowState: EAiWindowState;
  public showPolicyInfo: boolean = false;
  public isUpdating = false;
  private currentUser: CurrentUser;

  constructor(
    private aiDetectPolicyService: AIDetectPolicyService,
    private aiInteractiveBuilderService: AiInteractiveBuilderService,
    @Inject(AIInteractiveInitialDataToken)
    private initialData: AiInteractiveBubbleInitialData,
    private aiPolicyService: AiPolicyService,
    private cdkDrag: CdkDrag,
    @Inject(DOCUMENT) private document: Document,
    private userService: UserService,
    private dashboardApiService: DashboardApiService
  ) {}

  ngOnInit(): void {
    ChatGptService.enableSuggestReplySetting
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.canUseAI = res;
      });
    this.getData();

    this.aiDetectPolicyService.isMsgContentChanging$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isMsgChanging = res;
      });

    this.aiDetectPolicyService.isDetectingPolicies$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isLoading = res;
      });

    this.aiInteractiveBuilderService.aiWindowState$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        this.aiWindowState = rs;
        this.visible = rs === EAiWindowState.Policy;
      });

    this.aiPolicyService.savedPolicy$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        if (this.isPolicyPanelOpened) {
          this.isPolicyPanelOpened = false;
          if (
            rs &&
            rs?.defaultReply === this.currentPolicy?.reusableSentenceToBeStored
          ) {
            this.policies = this.policies.filter(
              (item) => item?.id !== this.currentPolicy?.id
            );
            this.reassessPolicies();
          }
        }
      });

    this.userService
      .getUserDetail()
      .pipe(
        takeUntil(this.unsubscribe),
        filter((user) => !!user)
      )
      .subscribe((rs) => {
        this.currentUser = rs;
        this.showPolicyInfo = !!rs.userOnboarding?.showPolicyDetection;
      });
  }

  ngAfterViewInit() {
    this.cdkDrag._dragRef.moved
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (this.popover) {
          this.popover?.component?.updateByDirective();
        }
      });
  }

  private getData() {
    this.aiDetectPolicyService.detectedPolicies$
      .pipe(
        takeUntil(this.unsubscribe),
        map((res) => {
          let customId = 0;
          return res.map((item) => ({
            ...item,
            id: item?.id ?? customId++,
            ignored: false
          }));
        })
      )
      .subscribe((value) => {
        this.policies = value;
        this.noPoliciesDetected = !(value?.length > 0);
        this.currentPolicyIdx = 0;
        this.reassessPolicies();
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.aiInteractiveBuilderService.toggleAIWindowState(null);
    this.aiDetectPolicyService.setPolicyPanelData(null);
  }

  public changeCurrentIndex(value: number, maxLength: number) {
    if (
      this.currentPolicyIdx + value >= maxLength ||
      this.currentPolicyIdx + value < 0
    )
      return;
    this.currentPolicyIdx += value;
    this.setNewOriginalText();
  }

  public addPolicy() {
    if (!this.currentPolicy) return;
    const {
      reusableSentenceToBeStored,
      threeApplicableQuestions,
      policyTitle
    } = this.currentPolicy;
    const policyData = {
      defaultReply: reusableSentenceToBeStored,
      policyQuestions: threeApplicableQuestions.map((question) => ({
        id: uuid4(),
        question
      })),
      name: policyTitle
    };
    this.aiDetectPolicyService.setPolicyPanelData(policyData);
    this.isPolicyPanelOpened = true;
  }

  public changeIgnoreStatus() {
    for (let i = 0; i < this.policies.length; ++i) {
      if (this.policies[i]?.id === this.currentPolicy?.id) {
        this.policies[i].ignored = !this.policies[i].ignored;
        break;
      }
    }
    this.reassessPolicies();
  }

  private reassessPolicies() {
    this.unignoredPolicies = this.policies.filter((item) => !item.ignored);
    if (
      (this.showIgnored && this.currentPolicyIdx >= this.policies.length) ||
      (!this.showIgnored &&
        this.currentPolicyIdx >= this.unignoredPolicies.length)
    ) {
      this.currentPolicyIdx -= 1;
    }
    this.setNewOriginalText();
  }

  setNewOriginalText() {
    if (this.currentPolicyIdx < 0 || !this.visible) {
      this.aiDetectPolicyService.setOriginalText('');
      return;
    }
    this.aiDetectPolicyService.setOriginalText(
      this.currentPolicy?.newPolicyDetected || ''
    );
  }

  public onPopoverVisibleChange(value) {
    const isOpenPolicies =
      this.aiInteractiveBuilderService.getAIWindowState ===
      EAiWindowState.Policy;
    if (value !== isOpenPolicies) {
      this.aiInteractiveBuilderService.toggleAIWindowState(
        EAiWindowState.Policy
      );
    }
    if (!value) {
      this.currentPolicyIdx = 0;
      this.showIgnored = false;
    } else {
      this.aiDetectPolicyService.triggerDetectPolicies();
    }
    this.setNewOriginalText();
  }

  onTab(event: KeyboardEvent) {
    const isCloseAiWindow =
      typeof this.aiWindowState !== 'number' && !this.aiWindowState;
    if (isCloseAiWindow) {
      event.preventDefault();
      focusAIElement(this.document, this.initialData.sendMsgConfigs);
    }
  }

  public changeView() {
    this.showIgnored = !this.showIgnored;
    this.currentPolicyIdx = 0;
    this.setNewOriginalText();
  }

  private get currentPolicy() {
    const policy = this.showIgnored
      ? this.policies?.[this.currentPolicyIdx]
      : this.unignoredPolicies?.[this.currentPolicyIdx];
    return policy ?? null;
  }

  handleGotIt() {
    this.dashboardApiService
      .updateOnboardingDefaultData({
        showPolicyDetection: false
      })
      .pipe(
        tap(() => {
          this.isUpdating = true;
        }),
        finalize(() => {
          this.isUpdating = false;
        })
      )
      .subscribe((rs) => {
        this.userService.setUserDetail({
          ...this.currentUser,
          userOnboarding: {
            ...this.currentUser.userOnboarding,
            showPolicyDetection: false
          }
        });
      });
  }
}
