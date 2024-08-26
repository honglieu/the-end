import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { conversations } from 'src/environments/environment';
import { AgentUserService } from '@/app/user/agent-user/agent-user.service';
import { ActionLinkService } from '@services/action-link.service';
import { ApiService } from '@services/api.service';
import { ConversationService } from '@services/conversation.service';
import { PopupService } from '@services/popup.service';
import {
  ConversationCategoryConfig,
  FormInputProps,
  FormProps
} from '@shared/types/action-link.interface';
import { TaskService } from '@services/task.service';

interface SelectItem {
  color: string;
  id: string;
  message: string;
  svg: string;
  text: string;
}

@Component({
  selector: 'app-create-edit-action-link-popup',
  templateUrl: './create-edit-action-link-popup.component.html',
  styleUrls: ['./create-edit-action-link-popup.component.scss']
})
export class NewActionLinkPopupComponent
  implements OnInit, OnDestroy, OnChanges
{
  @ViewChild('createBody') scrollBody!: ElementRef<HTMLDivElement>;
  @Input() selectedActionLinkToEdit: FormInputProps;
  @Output() isOpenQuitConfirmModal = new EventEmitter<boolean>();
  @Output() isCreateEditSucccessfully = new EventEmitter<boolean>(false);
  @Output() formValueChanged = new EventEmitter<any>();
  @Input() formMode: 'create' | 'update' = 'create';
  private subscribers = new Subject<void>();
  public selectTopicItems: SelectItem[] = [];
  public selectedTopic: string;
  public configList: ConversationCategoryConfig[] = [];
  public actionLinkForm!: FormGroup;
  private urlRegex =
    /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  scrollTimeout: NodeJS.Timeout;
  actionLinkProps: Pick<ConversationCategoryConfig, 'color' | 'svg'> = {
    svg: '',
    color: ''
  };
  previousProps!: FormProps;
  currentUpdateId = '';
  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private taskService: TaskService,
    private alService: ActionLinkService,
    public conversationService: ConversationService,
    private agentUserService: AgentUserService,
    private popupService: PopupService
  ) {}

  ngOnChanges(changes) {
    this.selectedActionLinkToEdit &&
      this.selectedActionLinkToEdit.id &&
      (this.currentUpdateId = this.selectedActionLinkToEdit.id);
  }

  ngOnInit() {
    const fullCategoryList = JSON.parse(
      localStorage.getItem('listCategoryTypes')
    );
    if (fullCategoryList) {
      const table = [];
      this.configList = fullCategoryList.filter((e) => e.consoleOnly === true);
      this.configList.forEach((el) => {
        table.push({
          id: el.id,
          text: el.name,
          color: el.color,
          svg: el.svg,
          message: el.message
        });
      });
      this.selectTopicItems = table;
    } else {
      this.apiService.getAPI(conversations, 'list').subscribe((res) => {
        if (res && res.list) {
          this.configList = res.list.filter((e) => e.consoleOnly === true);
          localStorage.setItem('listCategoryTypes', JSON.stringify(res.list));
          const table = [];
          this.configList.forEach((el) => {
            table.push({
              id: el.id,
              text: el.name,
              color: el.color,
              svg: el.svg,
              message: el.message
            });
          });
          this.selectTopicItems = table;
        }
      });
    }

    this.actionLinkForm = this.fb.group({
      topicId: this.fb.control(
        this.selectTopicItems?.find((el) => el.text === 'General Question')
          ?.id || this.selectTopicItems[0]?.id
      ),
      topic: this.fb.control(''),
      title: this.fb.control('', [
        Validators.required,
        Validators.maxLength(32)
      ]),
      subHeading: this.fb.control('', [
        Validators.required,
        Validators.maxLength(100)
      ]),
      primaryButtonText: this.fb.control('', [
        Validators.required,
        Validators.maxLength(14)
      ]),
      primaryButtonUrl: this.fb.control('', [
        Validators.required,
        Validators.pattern(this.urlRegex)
      ]),
      secondaryButton: this.fb.control(false),
      secondaryButtonText: this.fb.control(''),
      secondaryButtonUrl: this.fb.control('')
    });
    this.previousProps = this.getModel(true);
    this.actionLinkForm.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((form) => {
        this.previousProps = this.getModel(true);
        if (form) {
          this.formValueChanged.next({
            ...form
          });
        }
      });
    this.getBtnSecond.valueChanges.subscribe((val: boolean) => {
      this.scrollTimeout = setTimeout(() => {
        this.scrollBody.nativeElement.scrollTo({
          left: 0,
          top: this.scrollBody.nativeElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
      if (val) {
        this.actionLinkForm
          .get('secondaryButtonText')
          .setValidators([Validators.required, Validators.maxLength(14)]);
        this.actionLinkForm.get('secondaryButtonText').updateValueAndValidity();
        this.actionLinkForm
          .get('secondaryButtonUrl')
          .setValidators([
            Validators.required,
            Validators.pattern(this.urlRegex)
          ]);
        this.actionLinkForm.get('secondaryButtonUrl').updateValueAndValidity();
      } else {
        this.actionLinkForm.get('secondaryButtonText').setValidators(null);
        this.actionLinkForm.get('secondaryButtonText').updateValueAndValidity();
        this.actionLinkForm.get('secondaryButtonUrl').setValidators(null);
        this.actionLinkForm.get('secondaryButtonUrl').updateValueAndValidity();
      }
    });
    this.actionLinkForm.get('topicId').valueChanges.subscribe((val: string) => {
      const t = this.configList.find((cat) => cat.id === val);
      this.actionLinkProps = {
        ...this.actionLinkProps,
        color: t.color,
        svg: t.svg
      };
    });

    this.agentUserService
      .getIsCloseAllModal()
      .pipe(takeUntil(this.subscribers))
      .subscribe((el) => {
        if (el === true) {
          this.resetForm();
        }
      });
    this.popupService.isShowNewActionLinkModal
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (
          res &&
          res.display &&
          this.selectedActionLinkToEdit &&
          !res.resetField
        ) {
          this.actionLinkForm.patchValue({
            topicId: this.selectedActionLinkToEdit.topicId || '',
            topic: this.selectedActionLinkToEdit.topic || '',
            title: this.selectedActionLinkToEdit.title || '',
            subHeading: this.selectedActionLinkToEdit.subHeading || '',
            primaryButtonText:
              this.selectedActionLinkToEdit.primaryButtonText || '',
            primaryButtonUrl:
              this.selectedActionLinkToEdit.primaryButtonUrl || '',
            secondaryButton:
              this.selectedActionLinkToEdit.secondaryButton || false,
            secondaryButtonText:
              this.selectedActionLinkToEdit.secondaryButtonText || '',
            secondaryButtonUrl:
              this.selectedActionLinkToEdit.secondaryButtonUrl || ''
          });
        } else if (res && res.resetField && res.display) {
          this.resetForm();
        }
      });
    this.selectedTopic =
      this.selectTopicItems?.find((el) => el.text === 'General Question')?.id ||
      this.selectTopicItems[0]?.id;
  }

  resetForm() {
    this.actionLinkForm.reset({
      topicId:
        this.selectTopicItems.find((el) => el.text === 'General Question').id ||
        this.selectTopicItems[0].id,
      topic: '',
      title: '',
      subHeading: '',
      primaryButtonText: '',
      primaryButtonUrl: '',
      secondaryButton: false,
      secondaryButtonText: '',
      secondaryButtonUrl: ''
    });
  }
  getModel(stubData = false): FormProps {
    const controls = this.actionLinkForm.controls;
    return {
      topic: '',
      topicId: this.selectedTopic,
      title:
        stubData && !controls['title'].value
          ? 'Heading text goes here'
          : controls['title'].value,
      subHeading:
        stubData && !controls['subHeading'].value
          ? 'Sub heading text goes here right here'
          : controls['subHeading'].value,
      primaryButtonText:
        stubData && !controls['primaryButtonText'].value
          ? 'Primary button'
          : controls['primaryButtonText'].value,
      primaryButtonUrl: controls['primaryButtonUrl'].value,
      secondaryButton: controls['secondaryButton'].value,
      secondaryButtonText:
        stubData && !controls['secondaryButtonText'].value
          ? 'Secondary button'
          : controls['secondaryButtonText'].value,
      secondaryButtonUrl: controls['secondaryButtonUrl'].value
    };
  }

  public openQuitConfirmModal(status) {
    this.isOpenQuitConfirmModal.next(status);
    this.popupService.setFromActionLinkModal(status);
  }

  public openActionLinkModal(status) {
    let body = this.actionLinkForm.value;
    delete body.topic;
    const hasSecond = this.getBtnSecond.value;
    if (!hasSecond) {
      body = { ...body, secondaryButtonText: '', secondaryButtonUrl: '' };
    }
    if (this.actionLinkForm.valid) {
      if (this.formMode === 'create') {
        this.apiService
          .postAPI(conversations, 'action-link', body)
          .subscribe((res) => {
            if (res.message === 'Successfully') {
              this.isCreateEditSucccessfully.next(true);
            }
          });
        this.alService.setCreateNewActionLink(status);
        this.resetForm();
      } else {
        this.apiService
          .putAPI(
            conversations,
            'action-link-change/' + this.currentUpdateId,
            body
          )
          .subscribe((res) => {
            if (res.message === 'Successfully Update') {
              this.isCreateEditSucccessfully.next(true);
            }
          });
        this.alService.setCreateNewActionLink(status);
      }
    }
  }

  get getBtnSecond() {
    return this.actionLinkForm.get('secondaryButton');
  }

  topicChanged(event) {
    if (event) {
      this.actionLinkForm.get('topic').setValue(event);
      this.selectedTopic = event;
    }
  }

  titleChanged(event) {
    if (event) {
      this.actionLinkForm.get('title').setValue(event);
    }
  }

  get getTopic() {
    return this.actionLinkForm.get('topic').value;
  }

  public ngOnDestroy(): void {
    clearTimeout(this.scrollTimeout);
    this.subscribers.next();
    this.subscribers.complete();
    this.isCreateEditSucccessfully.next(false);
  }
}
