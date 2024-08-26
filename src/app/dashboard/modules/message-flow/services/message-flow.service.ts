import {
  EModalID,
  ModalManagementService
} from '@/app/dashboard/services/modal-management.service';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import {
  ISendMsgConfigs,
  ISendMsgServiceData,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { cloneDeep } from 'lodash-es';
import {
  getIsSendBulk,
  updateConfigs
} from '@/app/trudi-send-msg/utils/helper-functions';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { TaskService } from '@services/task.service';
import { ConversationService } from '@services/conversation.service';
import { TrudiService } from '@services/trudi.service';
import { ETypeSend } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';

@Injectable({
  providedIn: 'root'
})
export class MessageFlowService {
  private sendMsgConfigBS: BehaviorSubject<ISendMsgConfigs> =
    new BehaviorSubject<ISendMsgConfigs>(defaultConfigs);
  public sendMsgConfig$ = this.sendMsgConfigBS.asObservable();
  private isProcessingBS: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public isAddContact: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  public isProcessing$ = this.isProcessingBS.asObservable();
  public sended$: Subject<ISendMsgTriggerEvent>;
  public output$: Subject<SendMessageModalOutput>;
  public triggerCloseMsg$ = new Subject<void>();
  public sendMsgCommunicationStep$ = new BehaviorSubject<boolean>(false);

  constructor(
    private modalManagementService: ModalManagementService,
    private injector: Injector
  ) {}

  public startWorkFlow(config: Record<string, unknown>) {
    const updatedConfig = this.patchConfig(config);
    this.modalManagementService.closeAll();
    if (
      config['otherConfigs.createMessageFrom'] ===
      ECreateMessageFrom.MULTI_TASKS
    ) {
      this.modalManagementService.openModals([EModalID.SelectRecipients]);
    } else {
      this.modalManagementService.openModals([
        EModalID.SelectRecipients,
        EModalID.SendMsg
      ]);
    }

    const sended$ = new Subject<ISendMsgTriggerEvent>();
    this.sended$ = sended$;
    this.setConfig(updatedConfig);
    this.startProcess();
    return sended$;
  }

  openSendMsgModal(config: Record<string, unknown>) {
    const updatedConfig = this.patchConfig(config);
    this.modalManagementService.closeAll();
    const isSendBulk = getIsSendBulk(updatedConfig);
    if (isSendBulk) {
      this.modalManagementService.openModals([EModalID.BulkSendMsg]);
    } else {
      this.modalManagementService.open(EModalID.SendMsg);
    }
    const output$ = new Subject<SendMessageModalOutput>();
    this.output$ = output$;
    this.setConfig(updatedConfig);
    this.startProcess();
    return this.output$;
  }

  setConfig(config: ISendMsgConfigs) {
    this.sendMsgConfigBS.next(config);
  }

  resetConfig() {
    this.sendMsgConfigBS.next(defaultConfigs);
  }

  startProcess() {
    this.isProcessingBS.next(true);
  }

  stopProcess() {
    this.isProcessingBS.next(false);
  }

  get isProcessing() {
    return this.isProcessingBS.value;
  }

  public patchConfig(newConfig: Partial<ISendMsgConfigs>) {
    const serviceData = this.getServiceData();
    const config = { ...newConfig, serviceData };
    return updateConfigs<ISendMsgConfigs>(cloneDeep(defaultConfigs), config);
  }

  public closeAll() {
    this.modalManagementService.closeAll();
  }

  public get currentModal$() {
    return this.modalManagementService.openModalId$;
  }

  public get modalState$() {
    return this.modalManagementService.modalState$;
  }

  back(modalId: EModalID) {
    const configs = this.sendMsgConfigBS.value;
    const isMultiTasks =
      configs.otherConfigs.createMessageFrom === ECreateMessageFrom.MULTI_TASKS;
    const isModalRecipients = modalId === EModalID.SelectRecipients;
    this.modalManagementService.pop();
    if (this.output$) {
      this.output$.next({
        data: null,
        type: isModalRecipients
          ? ESendMessageModalOutput.BackFromSelectRecipients
          : ESendMessageModalOutput.Back
      });
    }
    if ((isMultiTasks && isModalRecipients) || !isMultiTasks) {
      this.stopProcess();
      this.output$.complete();
      this.output$ = null;
    }
  }

  openModal(modalId: EModalID) {
    this.modalManagementService.open(modalId);
  }

  getServiceData(): ISendMsgServiceData {
    const taskService = this.injector.get(TaskService);
    const conversationService = this.injector.get(ConversationService);
    const trudiService = this.injector.get(TrudiService);

    return {
      conversationService: {
        listConversationByTask:
          conversationService?.listConversationByTask?.getValue(),
        currentConversation:
          conversationService?.currentConversation?.getValue()
      },
      taskService: {
        currentTask: taskService?.currentTask$?.getValue()
      },
      trudiService: {
        trudiResponse: trudiService?.getTrudiResponse?.getValue()
      }
    };
  }
}

export type SendMessageModalOutput =
  | {
      type: ESendMessageModalOutput.MessageSent;
      data: ISendMsgTriggerEvent;
    }
  | {
      type:
        | ESendMessageModalOutput.Back
        | ESendMessageModalOutput.Quit
        | ESendMessageModalOutput.BackFromSelectRecipients;
      data: null;
    };

export enum ESendMessageModalOutput {
  MessageSent,
  Back,
  Quit,
  BackFromSelectRecipients
}
