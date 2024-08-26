import { TrudiButtonEnumStatus } from '@/app/shared';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ECtaOption } from '@/app/task-detail/modules/steps/components/cta-buttons/cta-buttons.component';
import { EPanelSection } from './enum/step-details-panel.enum';
import {
  StepDetail,
  TrudiStep
} from '@/app/task-detail/modules/steps/utils/stepType';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { EStepType } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { distinctUntilChanged, skip, Subject, takeUntil } from 'rxjs';
import { ButtonKey } from '@trudi-ui';
import { SharedService } from '@/app/services';

@Component({
  selector: 'step-details-panel',
  templateUrl: './step-details-panel.component.html',
  styleUrl: './step-details-panel.component.scss'
})
export class StepDetailsPanelComponent implements OnInit {
  @Input() currentStep: TrudiStep & StepDetail = null;
  @Input() buttonKey: ButtonKey;
  @Output() triggerClickCtaOption = new EventEmitter();
  public readonly TrudiButtonEnumStatus = TrudiButtonEnumStatus;
  public readonly ECtaOption = ECtaOption;
  public readonly EPanelSection = EPanelSection;
  public isOpenSummarySection: boolean = true;
  public isOpenCommentsSection: boolean = true;
  public isConsole;
  private destroy$ = new Subject();
  hiddenTimeOut: NodeJS.Timeout;

  constructor(
    private stepService: StepService,
    private sharedService: SharedService
  ) {
    this.isConsole = this.sharedService.isConsoleUsers();
  }

  ngOnInit(): void {
    // skip the first render because isOpenCommentsSection default is true;
    this.stepService.collapseSummary$
      .pipe(skip(1), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((isCollapse) => {
        this.isOpenSummarySection = isCollapse;
      });
    this.stepService.setIsReadComments(this.currentStep.id);
    this.handleHiddenRedDotAfterOpenStep();
  }

  handleHiddenRedDotAfterOpenStep() {
    // hidden red dot after 3s
    this.hiddenTimeOut = setTimeout(() => {
      this.currentStep = {
        ...this.currentStep,
        unreadComment: false
      };
    }, 3000);
  }

  handleToggleExpandSection = (text: EPanelSection) => {
    switch (text) {
      case EPanelSection.SUMMARY:
        this.isOpenSummarySection = !this.isOpenSummarySection;
        break;
      case EPanelSection.COMMENTS:
        this.isOpenCommentsSection = !this.isOpenCommentsSection;
        break;
    }
  };

  onClickOption = (option: ECtaOption) => {
    this.stepService.setCtaButtonOption({
      stepId: this.currentStep.id,
      stepType: this.currentStep.stepType as EStepType,
      option
    });
    this.triggerClickCtaOption.emit(option);
  };

  closePanel() {
    this.stepService.updateShowStepDetailPanel(false);
    this.stepService.setCurrentStep(null);
  }
}
