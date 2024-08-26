import {
  StepService,
  UpdateTaskStepsPayload
} from '@/app/task-detail/modules/steps/services/step.service';
import { StepDetail } from '@/app/task-detail/modules/steps/utils/stepType';
import {
  Component,
  Input,
  TemplateRef,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
  OnInit,
  OnDestroy
} from '@angular/core';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { EStepType } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { EActionType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { TaskService } from '@services/task.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, filter, finalize, takeUntil } from 'rxjs';
import { SharedService } from '@/app/services/shared.service';
import { CompanyService } from '@/app/services/company.service';
import { ButtonKey, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ECtaOption } from '@/app/task-detail/modules/steps/components/cta-buttons/cta-buttons.component';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Component({
  selector: 'trudi-step',
  templateUrl: './trudi-step.component.html',
  styleUrls: ['./trudi-step.component.scss'],
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    class: 'trudi-step',
    '[class.hide-process-line]': 'hideProcessLine',
    '[class.trudi-step-disabled]': 'model.disabled',
    '[class.trudi-step-finished]': 'completed'
  }
})
export class TrudiStepComponent implements OnChanges, OnInit, OnDestroy {
  @Input() model;
  @Input() reiFormDetail: string;
  @Input() showIconTitle: boolean = false;
  @Input() icon: string = 'iconNavigate';
  @Input() hideProcessLine: boolean = false;
  @Input() propertyTreeStep: boolean = false;
  @Input() description: string | TemplateRef<void>;
  @Output() onProcess = new EventEmitter<boolean>();
  @Input() buttonKey: ButtonKey;
  public reminderTimes: boolean = false;
  public TrudiButtonEnumStatus = TrudiButtonEnumStatus;
  public completed: boolean = false;
  public CRMSystemName = ECRMSystem;
  public currentCompanyCRMSystemName$ =
    this.companyService.currentCompanyCRMSystemName;
  public isDisabled: boolean = false;
  public failedToMark = 'Fail to mark the step';
  public failedToUnmark = 'Fail to unmark the step';
  public isDisconnectedMailbox: boolean;
  public isConsole: boolean;
  public activated = false;
  private unsubscribe = new Subject<void>();
  public readonly NO_PROPERTY_WARNING =
    'This step is disabled. Please assign a property to this task.';

  public EButtonType = EButtonType;
  public attachmentCount: number = 0;
  public activeStep$ = this.stepService.currentStep$;
  public stepData: StepDetail;
  showIgnoredStep: boolean;
  hiddenTimeOut: NodeJS.Timeout;

  constructor(
    private stepService: StepService,
    public agencyService: AgencyService,
    private widgetPTService: WidgetPTService,
    private taskService: TaskService,
    private toastService: ToastrService,
    private sharedService: SharedService,
    private companyService: CompanyService,
    private preventButtonService: PreventButtonService,
    private toastCustomService: ToastCustomService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.stepService.ctaButtonOption$
      .pipe(
        takeUntil(this.unsubscribe),
        filter((data) => !!data?.option)
      )
      .subscribe((data) => {
        if (
          data?.stepType === this.model?.stepType &&
          data?.stepId === this.model?.id
        ) {
          switch (data.option) {
            case ECtaOption.EXECUTE:
              this.enableProcess();
              break;
            case ECtaOption.MARK_AS_COMPLETED:
            case ECtaOption.MARK_AS_INCOMPLETE:
              this.stepService.isExecutingStepBS.next(true);
              this.handleMarkStep(
                data?.option === ECtaOption.MARK_AS_COMPLETED
              );
              break;
            case ECtaOption.IGNORE:
            case ECtaOption.UN_IGNORE:
              const isIgnored = data.option === ECtaOption.IGNORE;
              const payload: UpdateTaskStepsPayload = {
                taskId: this.taskService.currentTask$.getValue().id,
                taskStepIds: [this.model.stepDetailId],
                isIgnored: isIgnored,
                stepName: this.model.name
              };
              const undoPayload = {
                ...payload,
                isIgnored: !isIgnored
              };
              this.stepService.isExecutingStepBS.next(true);
              this.stepService
                .updateTaskSteps(payload)
                .pipe(
                  finalize(() => {
                    this.preventButtonService.clearProcess(EButtonType.STEP);
                    this.stepService.setCurrentStep(null);
                    this.stepService.isExecutingStepBS.next(false);
                    this.isDisabled = false;
                    this.toastCustomService
                      .handleShowToastIgnoredStep(payload)
                      .onAction.subscribe(() => {
                        this.stepService
                          .updateTaskSteps(undoPayload)
                          .subscribe((rs) => {
                            this.stepService.updateStepById(this.model.id, {
                              isIgnored: undoPayload.isIgnored
                            });
                          });
                      });
                  })
                )
                .subscribe((rs) => {
                  this.stepService.updateStepById(this.model.id, {
                    isIgnored: isIgnored
                  });
                });
              break;
          }
        }
      });

    this.stepService
      .getStepById(this.model.id)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        this.stepData = rs;
      });

    this.stepService.showIgnoredStep$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        this.showIgnoredStep = rs;
      });

    this.stepService.isReadCommentInStep$
      .pipe(filter(Boolean), takeUntil(this.unsubscribe))
      .subscribe((stepIdToRead) => {
        this.handleHiddenRedDotAfterOpenStep(stepIdToRead);
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['model']?.currentValue) {
      this.completed = [
        TrudiButtonEnumStatus.COMPLETED,
        TrudiButtonEnumStatus.SCHEDULED,
        TrudiButtonEnumStatus.EXECUTED
      ].includes(this.model.status);
      this.reminderTimes = this.model.reminderTimes;
      if (this.model.stepType !== EStepType.CHECK_LIST) return;
      // this.attachmentCount = this.model.files?.length;
    }
  }

  handleHiddenRedDotAfterOpenStep(stepIdToRead) {
    // hidden red dot after 3s
    this.hiddenTimeOut = setTimeout(() => {
      if (this.model.stepId === stepIdToRead)
        this.model = {
          ...this.model,
          unreadComment: false
        };
    }, 3000);
  }

  enableProcess() {
    if (this.model?.disabled) return;
    if (this.model.stepType === EStepType.PROPERTY_TREE) {
      this.widgetPTService.setUpdatePTWidget(null);
    }
    if (this.model.stepType === EStepType.COMMUNICATE) {
      this.stepService.setConfirmEssential(null, EActionType.ESSENTIAL_RESET);
      this.stepService.setCurrentCommunicationStep(this.model);
    }
    this.onProcess.emit(true);
  }

  handleMarkStep(status: boolean) {
    this.isDisabled = true;
    this.completed = status;
    const markStatus = status
      ? TrudiButtonEnumStatus.COMPLETED
      : TrudiButtonEnumStatus.PENDING;
    this.updateStep(markStatus)
      .pipe(
        finalize(() => {
          this.preventButtonService.clearProcess(EButtonType.STEP);
          this.stepService.setCurrentStep(null);
          this.stepService.isExecutingStepBS.next(false);
          this.isDisabled = false;
        })
      )
      .subscribe({
        next: (data) => {
          if (data) {
            this.model = {
              ...this.model,
              status: markStatus
            };
            // this.stepService.updateTrudiResponse(
            //   data,
            //   EActionType.UPDATE_TRUDI_BUTTON
            // );
            this.stepService.updateStepById(this.model.id, {
              status: markStatus
            });
            return;
          }
        },
        error: (err) => {
          this.completed = !status;
          this.toastService.error(
            `${status ? this.failedToMark : this.failedToUnmark} ${
              this.model.name
            }`
          );
        }
      });
  }

  updateStep(status: TrudiButtonEnumStatus) {
    return this.stepService.updateStep(
      this.taskService.currentTask$.getValue().id,
      this.model.id,
      this.model.action,
      status,
      this.model.stepType,
      this.model.componentType,
      true
    );
  }

  handleUpdateCurrentStep = () => {
    this.stepService.setCurrentStep({
      step: this.model,
      buttonKey: this.buttonKey
    });
  };

  handleVisibleStepDetailPanel() {
    this.stepService.setCurrentStep(null);
    this.stepService.updateShowStepDetailPanel(false);
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    clearTimeout(this.hiddenTimeOut);
  }
}
