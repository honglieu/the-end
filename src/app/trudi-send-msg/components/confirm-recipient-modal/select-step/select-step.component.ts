import { ICommunicationStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { ISendMsgConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { OnInit, OnDestroy } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { TaskTemplate } from '@shared/types/task.interface';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import {
  ESelectStepType,
  EStepAction,
  ETypeElement
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';

@Component({
  selector: 'select-step',
  templateUrl: './select-step.component.html',
  styleUrls: ['./select-step.component.scss']
})
export class SelectStepComponent implements OnInit, OnChanges, OnDestroy {
  @Input() configs: ISendMsgConfigs = defaultConfigs;
  @Input() templateTask: TaskTemplate;
  @Input() currentStepControl: ICommunicationStep;
  @Output() changeStepTemplate = new EventEmitter();
  public stepDescription: string;
  public taskTemplate: TaskTemplate;
  public listTaskStep: ICommunicationStep[] = [];
  public currentStep: ICommunicationStep;
  public isRmEnvironment: boolean = false;

  private unsubscribe = new Subject<void>();
  public taskTemplateId: string;

  readonly ESelectStepType = ESelectStepType;

  constructor(private inboxService: InboxService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['configs']?.currentValue) {
      this.handleConvertData(this.configs.inputs.taskTemplate);
    }
  }
  ngOnInit(): void {
    if (
      this.configs.inputs.openFrom !==
        CreateTaskByCateOpenFrom.CALENDAR_EVENT_BULK_CREATE_TASKS &&
      this.templateTask
    ) {
      this.inboxService.taskTemplate$
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          if (res) {
            this.handleConvertData(res);
          }
        });
    }
  }

  handleConvertData(data) {
    const convertSectionsToSteps = (sections) => {
      return sections
        .map((section) => {
          if (section.type === ETypeElement.SECTION) {
            return section.buttons.map((button) => ({
              ...button,
              decision: null,
              disabled: ![
                EStepAction.SEND_BASIC_EMAIL,
                EStepAction.SEND_REQUEST
              ].includes(button?.action)
            }));
          } else {
            return [
              {
                ...section,
                decision: null,
                disabled: ![
                  EStepAction.SEND_BASIC_EMAIL,
                  EStepAction.SEND_REQUEST
                ].includes(section?.action)
              }
            ];
          }
        })
        .flat();
    };

    const mergeExtraData = (list, extraData) => {
      return list?.map((item) => ({
        ...extraData,
        ...item,
        disabled: ![
          EStepAction.SEND_BASIC_EMAIL,
          EStepAction.SEND_REQUEST
        ].includes(item?.action)
      }));
    };

    let rawStepList = convertSectionsToSteps(data?.steps || []);

    data?.decisions?.forEach((decision) => {
      const steps = decision.steps
        .filter((step) => step.type !== ETypeElement.SECTION)
        .concat(
          decision.steps
            .filter((step) => step.type === ETypeElement.SECTION)
            .flatMap((section) => section.buttons)
        );

      let childDecisionsSteps = [];
      decision.decisions?.forEach((childDecision) => {
        const rawStepsDate =
          childDecision.steps
            .filter((step) => step.type !== ETypeElement.SECTION)
            .concat(
              childDecision.steps
                .filter((step) => step.type === ETypeElement.SECTION)
                .flatMap((section) => section.buttons)
            ) || [];

        childDecisionsSteps = [
          ...childDecisionsSteps,
          ...mergeExtraData(rawStepsDate, {
            decision: decision.decision,
            index: decision.index,
            decisionId: childDecision.id,
            parentDecisionId: decision.id
          })
        ];
      });

      rawStepList = [
        ...rawStepList,
        ...(mergeExtraData(steps, {
          decision: decision.decision,
          index: decision.index,
          decisionId: decision.id
        }) || [])
      ];
      rawStepList = [...rawStepList, ...childDecisionsSteps];
    });

    this.listTaskStep = this.mapToGetDynamicFieldActions(rawStepList);
  }

  mapToGetDynamicFieldActions(steps = []) {
    const stepType = [
      ESelectStepType.CALENDAR_EVENT,
      ESelectStepType.PROPERTY_TREE_ACTION,
      ESelectStepType.RENT_MANAGER_ACTION
    ];

    return steps.map((currentStep, idx) => {
      const dynamicFieldActions = currentStep.disabled
        ? []
        : [
            ...Array.from(
              new Set([
                ...steps.slice(0, idx).reduce((arr, step) => {
                  if (
                    (step.decisionId === currentStep?.decisionId ||
                      step.decisionId === currentStep?.parentDecisionId ||
                      !step.decision) &&
                    stepType.includes(step?.stepType)
                  ) {
                    arr.push(step?.componentType || step?.fields?.eventType);
                  }
                  return arr;
                }, [])
              ])
            ),
            currentStep.action
          ];
      return {
        ...currentStep,
        dynamicFieldActions
      };
    });
  }

  onTaskSelectChanged(step?: ICommunicationStep): void {
    this.changeStepTemplate.emit(step);
  }

  handleCancel() {
    this.inboxService.currentSelectedTaskTemplate$.next(null);
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
