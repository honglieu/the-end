import { ButtonKey, EButtonType, TrudiUiModule } from '@trudi-ui';
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { NzDropDownDirective, NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { TrudiButtonEnumStatus } from '@/app/shared';
import {
  StepDetail,
  TrudiStep
} from '@/app/task-detail/modules/steps/utils/stepType';
import { EStepType } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';

export enum ECtaOption {
  EXECUTE = 'Execute',
  MARK_AS_COMPLETED = 'Mark as completed',
  MARK_AS_INCOMPLETE = 'Mark as incomplete',
  IGNORE = 'Ignore',
  UN_IGNORE = 'Unignore'
}

@Component({
  selector: 'cta-buttons',
  standalone: true,
  imports: [CommonModule, TrudiUiModule, NzDropDownModule],
  templateUrl: './cta-buttons.component.html',
  styleUrl: './cta-buttons.component.scss'
})
export class CtaButtonsComponent implements OnChanges {
  @ViewChild('dropdownBtn') dropdownBtn: NzDropDownDirective;
  @Input() currentStep: TrudiStep = null;
  @Input() buttonKey: ButtonKey;
  @Input() disabled = false;
  @Output() triggerClickCtaOption = new EventEmitter();
  public showCtaOptions: boolean = false;
  public ctaOptionValues: ECtaOption[] = [
    ECtaOption.EXECUTE,
    ECtaOption.MARK_AS_COMPLETED,
    ECtaOption.MARK_AS_INCOMPLETE,
    ECtaOption.IGNORE
  ];
  public selectedCtaOption = this.ctaOptionValues[0];
  public dropdownOptions = this.ctaOptionValues.slice(1);
  public readonly TrudiButtonEnumStatus = TrudiButtonEnumStatus;
  public readonly EButtonType = EButtonType;
  constructor(protected stepService: StepService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentStep']?.currentValue) {
      const { firstOption, dropdownOptions } = this.getStepCTAButton(
        this.currentStep as StepDetail
      );
      this.selectedCtaOption = firstOption;
      this.dropdownOptions = dropdownOptions;
    }
  }

  onClickOption = (option: ECtaOption) => {
    this.stepService.setCtaButtonOption({
      stepId: this.currentStep.id,
      stepType: this.currentStep.stepType as EStepType,
      option: option
    });
    this.triggerClickCtaOption.emit(option);
  };

  getStepCTAButton(step: StepDetail) {
    const getIgnoreAction = (step: StepDetail) => {
      return step.isIgnored ? ECtaOption.UN_IGNORE : ECtaOption.IGNORE;
    };

    const getCompletedActions = (step: StepDetail) => {
      return step.isRequired
        ? step.isIgnored
          ? [getIgnoreAction(step)]
          : [ECtaOption.MARK_AS_INCOMPLETE, getIgnoreAction(step)]
        : [ECtaOption.MARK_AS_INCOMPLETE, getIgnoreAction(step)];
    };
    const defaultUnexecutedActions = step.isRequired
      ? [ECtaOption.EXECUTE, ECtaOption.MARK_AS_COMPLETED]
      : [
          ECtaOption.EXECUTE,
          ECtaOption.MARK_AS_COMPLETED,
          getIgnoreAction(step)
        ];

    const checkListUnexecutedActions = [
      ECtaOption.MARK_AS_COMPLETED,
      getIgnoreAction(step)
    ];

    const actions =
      step.status === TrudiButtonEnumStatus.COMPLETED
        ? getCompletedActions(step)
        : step.stepType === EStepType.CHECK_LIST
        ? checkListUnexecutedActions
        : defaultUnexecutedActions;
    return {
      firstOption: actions[0] || null,
      dropdownOptions: actions.slice(1) || []
    };
  }
}
