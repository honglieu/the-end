import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IConfigPopup,
  IListConversationTask,
  ISelectedProperty,
  ITaskGroupItem
} from '@shared/types/task.interface';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { Subject, combineLatest, map, takeUntil } from 'rxjs';
import { PropertiesService } from '@services/properties.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { ITaskRow } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { TaskService } from '@services/task.service';
import { UserType } from '@services/constants';

@Component({
  selector: 'confirm-properties-task-pt-popup',
  templateUrl: './confirm-properties-task-pt-popup.component.html',
  styleUrls: ['./confirm-properties-task-pt-popup.component.scss']
})
export class ConfirmPropertiesTaskPtPopupComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() configPopup: IConfigPopup = {
    actionButton: 'Next',
    title: 'Assign property',
    titleWarning: 'Please select a property to continue.',
    isRmEnvironment: false,
    showModal: true
  };
  @Input() listConversationTask: IListConversationTask;
  @Output() quitModal = new EventEmitter<boolean>();
  @Output() onConfirm = new EventEmitter();
  private unsubscribe: Subject<void> = new Subject();
  public listPropertySelectBox: UserPropertyInPeople[] = [];
  public userForm: FormGroup;
  public taskFolderGroups: Partial<ITaskGroupItem>[];
  public listConversationTaskFolderGroups: Partial<ITaskGroupItem>[];
  public selectedProperty: ISelectedProperty[] = [];
  public submitted: boolean = false;
  public isDisabledProperty: boolean = false;
  public showRequired: boolean = false;
  public listConversationTaskNotMoveSelected = [];

  constructor(
    private propertyService: PropertiesService,
    private inboxSidebarService: InboxSidebarService,
    private taskService: TaskService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['listConversationTask']?.currentValue) {
      this.listConversationTask.listConversationTaskNotMove.forEach((item) => {
        this.addItemFormGroup(item);
      });
    }
  }

  ngOnInit(): void {
    combineLatest([
      this.propertyService.listofActiveProp,
      this.inboxSidebarService.taskFolders$
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([properties, taskFolder]) => {
        this.taskFolderGroups = taskFolder.flatMap((folder) =>
          folder.taskGroups?.map((taskGroup) => ({
            ...taskGroup,
            icon: folder.icon,
            taskFolderId: folder.id,
            taskFolderName: folder.name
          }))
        );
        if (this.listConversationTask && this.taskFolderGroups) {
          this.listConversationTaskFolderGroups =
            this.getListConversationTaskFolderGroups();
        }
        this.listPropertySelectBox = this.sortPropertiesByUserInteraction(
          properties,
          this.taskService.currentTask$.value?.conversations
        );
      });
    this.checkSelectedListConversationTaskNotMove();
  }

  sortPropertiesByUserInteraction(properties, conversations) {
    const userPropertyIds = new Set(
      conversations
        .flatMap((conversation) =>
          conversation.participants.filter(
            (participant) => participant.type === UserType.USER
          )
        )
        .map((userParticipant) => userParticipant.propertyId)
    );

    properties.sort((a, b) => {
      const aPriority = userPropertyIds.has(a.id) ? 1 : 0;
      const bPriority = userPropertyIds.has(b.id) ? 1 : 0;
      return bPriority - aPriority;
    });

    return properties;
  }

  initForm() {
    this.userForm = this.fb.group({
      listConversationTaskNotMove: this.fb.array([])
    });
  }
  get itemsFormArray(): FormArray {
    return this.userForm?.get('listConversationTaskNotMove') as FormArray;
  }

  getListConversationTaskFolderGroups(): Partial<ITaskGroupItem>[] {
    return this.listConversationTask.listConversationTaskNotMove.map(
      (item) => ({
        ...this.taskFolderGroups.find(
          (taskFolder) => taskFolder.id === item.taskGroupId
        ),
        taskTitle: item.title
      })
    );
  }

  handleSelectProperties(e, index) {
    if (this.submitted) {
      this.checkForUncheckedItems();
    }
    this.selectedProperty.push({ propertyId: e.id, indexItem: index });
  }

  addItemFormGroup(item: ITaskRow) {
    const itemFormGroup = this.fb.group({
      ...item,
      propertyId: null,
      isSelected: true
    });
    this.itemsFormArray.push(itemFormGroup);
  }

  checkForUncheckedItems(): void {
    this.itemsFormArray.controls.forEach(
      (itemGroup: FormGroup, index: number) => {
        const isCheckedControl = itemGroup.get('isSelected');
        const propertyControl = itemGroup.get('propertyId');
        if (isCheckedControl && propertyControl) {
          if (isCheckedControl.value && !propertyControl.value) {
            propertyControl.setValidators([Validators.required]);
            itemGroup['isRequired'] = true;
          } else {
            propertyControl.clearValidators();
            itemGroup['isRequired'] = false;
          }
          propertyControl.updateValueAndValidity();
        }
      }
    );
  }

  checkSelectedListConversationTaskNotMove() {
    const checkedItems$ = this.itemsFormArray.valueChanges.pipe(
      map((items) => items.filter((item) => item.isSelected))
    );

    checkedItems$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((checkedItems) => {
        this.listConversationTaskNotMoveSelected = checkedItems;
      });
  }

  isRequired(index: number): boolean {
    const itemGroup = this.itemsFormArray.at(index) as FormGroup;
    return itemGroup ? itemGroup['isRequired'] : false;
  }

  getControlPropertyOfIndex(index) {
    return this.itemsFormArray.controls[index].get('propertyId');
  }

  onQuit() {
    this.configPopup.showModal = false;
    this.quitModal.emit(this.configPopup.showModal);
  }
  onNext() {
    this.submitted = true;
    this.checkForUncheckedItems();
    const form = this.userForm.value;
    this.showRequired =
      !this.listConversationTask.listConversationTaskMove?.length &&
      !this.listConversationTaskNotMoveSelected?.length;
    if (this.showRequired || !this.userForm.valid) return;
    const data: ITaskRow[] = form?.listConversationTaskNotMove;
    this.taskService.setConversationsTaskConfirmProperties({
      listConversationTaskMove:
        this.listConversationTask.listConversationTaskMove,
      listConversationTaskNotMove: data
    });
    this.configPopup.showModal = false;
    this.quitModal.emit(this.configPopup.showModal);
    this.onConfirm.emit();
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
