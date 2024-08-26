import { ConversationService } from '@/app/services/conversation.service';
import { PropertiesService } from '@/app/services/properties.service';
import { TaskService } from '@/app/services/task.service';
import {
  CurrentUser,
  EDataE2EReassignModal,
  TaskItem,
  TypeConversationPropertyPayload,
  UserConversation,
  UserPropertyInPeople
} from '@/app/shared';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

@Component({
  selector: 'sms-reassign-property-modal',
  templateUrl: './sms-reassign-property-modal.component.html',
  styleUrl: './sms-reassign-property-modal.component.scss'
})
export class SmsReassignPropertyModalComponent implements OnChanges {
  @Input() showModal: boolean = false;
  @Input() currentTask: TaskItem = null;
  @Input() propertyList: UserPropertyInPeople[] = [];
  @Input() currentConversation: UserConversation;
  @Input() currentUser: CurrentUser;
  @Output() closeModal = new EventEmitter();

  readonly EDataE2EReassignModal = EDataE2EReassignModal;
  public isPropertyUpdating: boolean;
  public formSelectProperty = new FormGroup({
    propertyId: new FormControl(null)
  });

  get propertyId() {
    return this.formSelectProperty.get('propertyId');
  }

  constructor(
    private taskService: TaskService,
    private propertiesService: PropertiesService,
    private toastrService: ToastrService,
    private conversationService: ConversationService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const { currentConversation } = changes;
    if (currentConversation?.currentValue && !this.isPropertyUpdating) {
      const { isTemporaryProperty, propertyId } =
        currentConversation?.currentValue;
      this.propertyId.setValue(isTemporaryProperty ? null : propertyId);
    }
  }

  handleConfirmUpdateProperty() {
    this.isPropertyUpdating = true;
    const { isTemporaryProperty, propertyId } = this.currentConversation;

    if (
      this.propertyId.value === propertyId ||
      (!this.propertyId.value && isTemporaryProperty)
    ) {
      this.isPropertyUpdating = false;
      this.closeModal.emit();
      return;
    }

    const bodyChangeConversationProperty: TypeConversationPropertyPayload = {
      conversationId: this.currentConversation?.id,
      newPropertyId: this.propertyId.value
    };

    this.propertiesService
      .updateConversationProperty(bodyChangeConversationProperty)
      .pipe(finalize(() => (this.isPropertyUpdating = false)))
      .subscribe((res) => {
        if (res) {
          this.toastrService.success(
            'The conversation property has been changed'
          );
          this.updateCurrentTaskProperty(res);
          this.updateCurrentTaskAssignees();
          this.conversationService.reloadConversationList.next(true);
        }
        this.closeModal.emit();
      });
  }

  updateCurrentTaskProperty(property) {
    this.taskService.currentTask$.next({
      ...this.currentTask,
      agencyId: property.agencyId,
      companyId: property.companyId,
      property
    });
    this.propertiesService.currentPropertyId.next(property?.id);
  }

  searchProperty(searchText: string, property: UserPropertyInPeople) {
    return (
      property?.streetline
        ?.toLowerCase()
        ?.includes(searchText?.toLowerCase()) || false
    );
  }

  updateCurrentTaskAssignees() {
    if (!this.currentTask) return;
    const { firstName, lastName, id, googleAvatar } = this.currentUser || {};
    const assigneeIds = this.currentTask.assignToAgents.map(
      (agent) => agent.id
    );
    if (!assigneeIds.includes(id)) {
      this.taskService.currentTask$.next({
        ...this.currentTask,
        assignToAgents: [
          ...this.currentTask.assignToAgents,
          { id, firstName, lastName, googleAvatar }
        ]
      });
    }
  }
}
