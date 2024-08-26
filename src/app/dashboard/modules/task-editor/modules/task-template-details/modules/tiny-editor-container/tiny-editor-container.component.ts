import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  ECRMState,
  ECalendarEvent,
  EComponentTypes,
  EDynamicType,
  EStepAction
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import {
  PT_LIST_DYNAMIC_PARAMETERS,
  RM_LIST_DYNAMIC_PARAMETERS
} from '@/app/dashboard/modules/task-editor/constants/dynamic-parameter.constant';
import { TaskTemplateService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template.service';
import { Subject, takeUntil } from 'rxjs';
import { IFile } from '@shared/types/file.interface';
import { IAiInteractiveBubbleConfigs } from '@/app/shared';

@Component({
  selector: 'tiny-editor-container',
  templateUrl: './tiny-editor-container.component.html',
  styleUrls: ['./tiny-editor-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TinyEditorContainerComponent),
      multi: true
    }
  ]
})
export class TinyEditorContainerComponent
  implements OnInit, OnChanges, ControlValueAccessor
{
  @Input() listComponentStep: EComponentTypes[] = [];
  @Input() communicationStepType = null;
  @Input() calendarEventTypes: ECalendarEvent[] = [];
  @Input() isShowSummaryRequestParams: boolean = true;
  @Input() editorError: boolean = false;
  @Input() isDisabled = false;
  @Input() listOfFiles: IFile[] = [];
  @Input() enableSetPreview: boolean = true;
  @Input() aiInteractiveBubbleConfigs: IAiInteractiveBubbleConfigs;
  @Output() dropFile = new EventEmitter();
  private destroy$ = new Subject<void>();
  public crmState;
  public listCodeOptions;
  public value: string = '';
  public disabled = false;

  @HostBinding('attr.class') get classes() {
    return 'tiny-editor-container';
  }

  constructor(private taskTemplateService: TaskTemplateService) {}

  ngOnInit(): void {
    this.taskTemplateService.taskTemplate$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.crmState = res.crmSystemKey;
        this.getListCodeOptions();
        this.handleListDynamicParameters();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes &&
      this.listCodeOptions &&
      (changes['communicationStepType']?.currentValue ||
        changes['listComponentStep']?.currentValue ||
        changes['calendarEventTypes']?.currentValue)
    ) {
      this.getListCodeOptions();
      this.handleListDynamicParameters();
    }
  }

  onDropFile(e) {
    this.dropFile.emit(e);
  }

  handleListDynamicParameters() {
    const listPTComponentDistinct = this.getListTypeDynamicParamDistinct(
      this.listComponentStep
    );
    const listEventDistinct = this.getListTypeDynamicParamDistinct(
      this.calendarEventTypes
    );
    this.getListDynamicParametersByConfig(
      this.listCodeOptions,
      listPTComponentDistinct,
      this.communicationStepType,
      listEventDistinct
    );
  }

  getListCodeOptions() {
    switch (this.crmState) {
      case ECRMState.PROPERTY_TREE:
        this.orderListCodeOptions(PT_LIST_DYNAMIC_PARAMETERS);
        break;
      case ECRMState.RENT_MANAGER:
        this.orderListCodeOptions(RM_LIST_DYNAMIC_PARAMETERS);
        break;
      default:
        break;
    }
  }

  public getListDynamicParametersByConfig(
    listData,
    componentTypes?: EComponentTypes[],
    communicationStepType?: EStepAction,
    calendarEventTypes?: ECalendarEvent[]
  ) {
    let listDynamicParameters = listData;
    listDynamicParameters.forEach((param) => {
      if (
        communicationStepType &&
        param.dynamicType === EDynamicType.COMMUNICATION_STEP
      ) {
        param.isDisplay = param.communicationStepType === communicationStepType;
      }
      if (param.dynamicType === EDynamicType.CALENDER_EVENT) {
        param.isDisplay =
          calendarEventTypes.includes(param.calendarEventType) &&
          calendarEventTypes?.length > 0;
      }
      if (param.dynamicType == EDynamicType.PT_COMPONENT) {
        param.isDisplay =
          componentTypes?.length > 0 &&
          componentTypes.includes(param.componentType);
      }
      if (param.dynamicType == EDynamicType.RM_COMPONENT) {
        param.isDisplay =
          componentTypes?.length > 0 &&
          componentTypes.includes(param.componentType);
      }
      if (param.dynamicType == EDynamicType.SUMMARY_REQUEST) {
        param.isDisplay = this.isShowSummaryRequestParams;
      }
    });
    listDynamicParameters = this.orderListCodeOptionsTypePTComponent(
      listDynamicParameters,
      componentTypes,
      calendarEventTypes
    );
    this.listCodeOptions = listDynamicParameters.filter((p) => p?.isDisplay);
  }

  orderListCodeOptions(listDynamicParameters) {
    this.listCodeOptions = listDynamicParameters;
    const titleOrder = [
      'Pre-screen',
      'Breach notice',
      'Entry notice',
      'Custom event',
      'Request summary',
      'Recipient',
      'Property',
      'Company',
      'Tenant',
      'Tenancy',
      'Landlord'
    ];
    this.listCodeOptions.sort((a, b) => {
      const aIndex = titleOrder.indexOf(a.title);
      const bIndex = titleOrder.indexOf(b.title);

      if (aIndex === -1 && bIndex === -1) {
        return 0;
      } else if (aIndex === 0) {
        return -1;
      } else if (bIndex === 0) {
        return 1;
      } else {
        return aIndex - bIndex;
      }
    });
  }

  orderListCodeOptionsTypePTComponent(
    listDynamicParameters,
    componentTypes,
    calendarEventTypes
  ) {
    const listComponentStep = this.listCodeOptions.filter(
      (item) =>
        (item.dynamicType === EDynamicType.PT_COMPONENT ||
          item.dynamicType === EDynamicType.RM_COMPONENT) &&
        componentTypes.includes(item.componentType)
    );

    const listCalendarEventStep = this.listCodeOptions.filter(
      (item) =>
        item.dynamicType === EDynamicType.CALENDER_EVENT &&
        calendarEventTypes.includes(item.calendarEventType)
    );

    const sortedByComponentTypes = Array.from(componentTypes)
      .map((type) =>
        listComponentStep.find((item) => item.componentType === type)
      )
      .filter((item) => !!item);
    const sortedByCalendarEventTypes = Array.from(calendarEventTypes)
      .map((type) =>
        listCalendarEventStep.find((item) => item.calendarEventType === type)
      )
      .filter((item) => !!item);

    let itemIndexComponent = 0;
    let itemIndexCalendarEvent = 0;

    for (let index = 0; index < listDynamicParameters.length; index++) {
      const item = listDynamicParameters[index];

      if (
        (item.dynamicType === EDynamicType.PT_COMPONENT ||
          item.dynamicType === EDynamicType.RM_COMPONENT) &&
        componentTypes.includes(item.componentType)
      ) {
        listDynamicParameters[index] =
          sortedByComponentTypes[itemIndexComponent];
        itemIndexComponent++;
      } else if (
        item.dynamicType === EDynamicType.CALENDER_EVENT &&
        calendarEventTypes.includes(item.calendarEventType)
      ) {
        listDynamicParameters[index] =
          sortedByCalendarEventTypes[itemIndexCalendarEvent];
        itemIndexCalendarEvent++;
      }
    }
    return listDynamicParameters;
  }
  private getListTypeDynamicParamDistinct(componentType) {
    const uniqueIndexes = {};

    const filteredItems = componentType.filter((item, index) => {
      const existingIndex = uniqueIndexes[item];
      if (existingIndex === undefined || index < existingIndex) {
        uniqueIndexes[item] = index;
      }
      return true;
    });

    const listDataDistinct = filteredItems.filter(
      (item, index) => index === uniqueIndexes[item]
    );
    return listDataDistinct;
  }

  onChange: any = () => {};
  onTouched: () => void = () => {};
  writeValue(value: string): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
