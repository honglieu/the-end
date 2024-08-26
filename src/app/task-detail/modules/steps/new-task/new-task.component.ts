import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { StepBaseComponent } from '@/app/task-detail/modules/steps/communication/step-base/step-base.component';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { TaskNameId } from '@shared/enum/task.enum';
import { TaskItemDropdown } from '@shared/types/task.interface';
import { ToastrService } from 'ngx-toastr';
import { ChatGptService } from '@services/chatGpt.service';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { SendMessageService } from '@services/send-message.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { defaultConfigs } from '@/app/mailbox-setting/utils/out-of-office-config';
import { IConfigs } from '@/app/mailbox-setting/utils/out-of-office.interface';
import { EButtonStepKey, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { HeaderService } from '@/app/services/header.service';

@Component({
  selector: 'new-task-step',
  templateUrl: './new-task.component.html',
  styleUrls: ['./new-task.component.scss']
})
export class NewTaskComponent
  extends StepBaseComponent
  implements OnChanges, OnInit
{
  constructor(
    public override taskService: TaskService,
    public override trudiService: TrudiService,
    public override sendMessageService: SendMessageService,
    public override conversationService: ConversationService,
    public override toastService: ToastrService,
    public override filesService: FilesService,
    public override stepService: StepService,
    public agencyService: AgencyService,
    public override chatGptService: ChatGptService,
    public override trudiDynamicParameterService: TrudiDynamicParameterService,
    public override toastCustomService: ToastCustomService,
    private preventButtonService: PreventButtonService,
    private headerService: HeaderService
  ) {
    super(
      taskService,
      trudiService,
      sendMessageService,
      conversationService,
      toastService,
      filesService,
      stepService,
      chatGptService,
      trudiDynamicParameterService,
      toastCustomService
    );
  }
  public readonly createTaskByCateOpenFrom = CreateTaskByCateOpenFrom;
  public listTaskName: TaskItemDropdown[] = [];
  public taskNameId = '';
  public configs: IConfigs = {
    ...defaultConfigs,
    header: {
      ...defaultConfigs.header,
      showDropdown: false
    }
  };
  public buttonKey = EButtonStepKey.NEW_TASK;

  override ngOnInit(): void {
    this.getTaskList();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']?.currentValue) {
      this.modelData = this.model;
    }
  }

  public openCreateTaskPopup() {
    this.handlePopupState({ createTask: true });
  }

  public handleStopProcessCreateNewTask(createTask: boolean) {
    this.preventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    const taskJustCreated = this.taskService.taskJustCreated$.getValue();
    const nextTaskId =
      this.headerService.headerState$.getValue()?.currentTask?.id;
    if (createTask && taskJustCreated) {
      this.complete(null, { nextTaskId });
    } else {
      this.handlePopupState({ createTask: false });
    }
  }

  private getTaskList() {
    this.agencyService.listTask$.subscribe((res) => {
      if (res) {
        this.listTaskName = this.taskService.createTaskNameList();

        this.taskNameId = this.model.newTaskTemplateId as TaskNameId;
      }
    });
  }
}
