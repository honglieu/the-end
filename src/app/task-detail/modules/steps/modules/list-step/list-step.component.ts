import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ECtaOption } from '@/app/task-detail/modules/steps/components/cta-buttons/cta-buttons.component';
import { TrudiButtonEnumStatus } from '@/app/shared';
import { ButtonKey } from '@trudi-ui';
import {
  StepDetail,
  TrudiStep
} from '@/app/task-detail/modules/steps/utils/stepType';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  Subject,
  takeUntil,
  filter,
  switchMap,
  map,
  of,
  combineLatest
} from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SplashScreenService } from '@/app/splash-screen/splash-screen.service';
import { LoadingService } from '@/app/services/loading.service';

@Component({
  selector: 'list-step',
  templateUrl: './list-step.component.html',
  styleUrls: ['./list-step.component.scss']
})
export class ListStepComponent implements OnInit, OnDestroy {
  @Input() sections: Object[] = [];
  public currentStep: TrudiStep & StepDetail;
  public buttonKey: ButtonKey;
  public showPopover: boolean = false;
  private unsubscribe = new Subject<void>();
  public readonly TrudiButtonEnumStatus = TrudiButtonEnumStatus;
  public readonly ECtaOption = ECtaOption;
  disableTriggerDetailPanel$ = this.stepService.disableTriggerDetailPanel$;
  showStepDetailPanel$ = this.stepService.showStepDetailPanelBS;

  constructor(
    private stepService: StepService,
    private splashScreenService: SplashScreenService,
    private loadingService: LoadingService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.subscribeQueryParams();
    combineLatest([
      this.splashScreenService.visible$,
      this.loadingService.isLoading$
    ])
      .pipe(
        switchMap(([visible, isLoading]) => {
          if (!isLoading && !visible) return this.stepService.currentStep$;
          return of(null);
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe((data) => {
        if (data) {
          const { step, buttonKey } = data;
          this.currentStep = step;
          this.buttonKey = buttonKey;
        } else {
          this.currentStep = null;
          this.buttonKey = null;
        }
      });
  }

  trackByFn(_, item) {
    item.id;
  }

  subscribeQueryParams() {
    combineLatest([
      this.activatedRoute.queryParams,
      this.stepService.unreadComments$
    ])
      .pipe(
        filter(([params, unreadComments]) => !!params['stepId']),
        switchMap(([params, unreadComments]) =>
          this.handleCurrentStep(params, unreadComments)
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe(({ currentStep }) => {
        this.stepService.setCurrentStep({
          step: currentStep,
          buttonKey: currentStep?.action
        });
        this.stepService.updateShowStepDetailPanel(true);
      });
  }

  handleCurrentStep(params, unreadComments) {
    return this.stepService.getTrudiResponse.pipe(
      map((trudiResponse) => {
        const currentStep = this.findCurrentStepByParam(
          trudiResponse,
          params['stepId']
        );
        const unread = unreadComments.unReadData.find(
          (unread) => unread.stepId === currentStep?.id
        );

        if (unread) {
          currentStep.unreadComment = unread.hasUnreadNote;
        }
        return {
          currentStep: currentStep,
          stepId: params['stepId']
        };
      })
    );
  }

  findCurrentStepByParam(trudiResponse, stepId) {
    const buttons = this.stepService.getButton(trudiResponse);
    return buttons.find((btn) => btn.id === stepId);
  }

  handleClickCtaOption = (option: ECtaOption) => {
    this.currentStep = null;
    this.handlePopoverVisibleChange(false);
  };

  handlePopoverVisibleChange = (isShow: boolean) => {
    this.stepService.updateShowStepDetailPanel(isShow);

    if (!isShow) {
      this.currentStep = null;
    }
  };

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
