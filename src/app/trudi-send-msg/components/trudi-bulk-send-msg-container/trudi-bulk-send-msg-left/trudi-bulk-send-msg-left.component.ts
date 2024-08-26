import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Subject } from 'rxjs';
import {
  ISendMsgConfigs,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { TrudiSendMsgUserService } from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { TaskType } from '@shared/enum';
import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';

@Component({
  selector: 'trudi-bulk-send-msg-left',
  templateUrl: './trudi-bulk-send-msg-left.component.html',
  styleUrls: ['./trudi-bulk-send-msg-left.component.scss']
})
export class TrudiBulkSendMsgLeftComponent implements OnInit, OnDestroy {
  @Input() visible: boolean = false;
  @Input() configs: ISendMsgConfigs = defaultConfigs;
  @Input() selectedTaskIds: string[];
  @Input() isRmEnvironment: boolean;
  @Input() selectedTasks: ITasksForPrefillDynamicData[] = [];
  @Input() isSubmitted: boolean = false;
  @Output() editConfirmRecipient = new EventEmitter();

  private destroy$ = new Subject<void>();
  readonly TaskType = TaskType;
  readonly ISendMsgType = ISendMsgType;
  readonly ECreateMessageFrom = ECreateMessageFrom;
  public isHasRecipientEdit = false;

  public userListLoading$ = this.trudiSendMsgUserService.isLoading$;

  constructor(
    private trudiSendMsgUserService: TrudiSendMsgUserService,
    private trudiSendMsgFormService: TrudiSendMsgFormService
  ) {}

  get sendMsgForm() {
    return this.trudiSendMsgFormService.sendMsgForm;
  }
  get selectedReceivers() {
    return this.sendMsgForm?.get('selectedReceivers');
  }
  get ccReceivers() {
    return this.sendMsgForm?.get('ccReceivers');
  }
  get bccReceivers() {
    return this.sendMsgForm?.get('bccReceivers');
  }

  ngOnInit(): void {
    this.selectedTaskIds = this.configs.inputs.selectedTasksForPrefill?.map(
      (item) => item.taskId
    );
  }

  handleEdit() {
    this.editConfirmRecipient.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
