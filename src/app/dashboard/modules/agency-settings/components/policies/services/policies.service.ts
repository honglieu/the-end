import { Injectable } from '@angular/core';
import { isEqual } from 'lodash-es';
import { BehaviorSubject } from 'rxjs';
import { PoliciesFormService } from './policies-form.service';
import { PoliciesApiService } from './policies-api.service';
import { TaskService } from '@services/task.service';
import { ConversationService } from '@services/conversation.service';
import { EEntityType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';

@Injectable({
  providedIn: 'root'
})
export class PoliciesService {
  private selectedContactCard: BehaviorSubject<ISelectedReceivers[]> =
    new BehaviorSubject<ISelectedReceivers[]>([]);
  public selectedContactCard$ = this.selectedContactCard.asObservable();

  constructor(
    public formService: PoliciesFormService,
    public policiesApiService: PoliciesApiService,
    private taskService: TaskService,
    private conversationService: ConversationService
  ) {}

  getSelectedContactCard() {
    return this.selectedContactCard.value;
  }

  setSelectedContactCard(value: ISelectedReceivers[]) {
    this.selectedContactCard.next(value);
  }

  isTheSameData(oldOption, newOption) {
    if (
      !Object.keys(oldOption || {}).length &&
      !Object.keys(newOption || {}).length
    ) {
      return true;
    }

    return isEqual(oldOption, newOption);
  }

  getIDsFromOtherService() {
    const propertyId = this.taskService.currentTask$?.value?.property?.id;
    const propertyType =
      this.conversationService.currentConversation?.getValue()?.propertyType;
    const taskType = this.taskService.currentTask$.getValue()?.taskType;
    return {
      propertyId,
      propertyType,
      taskType
    };
  }

  compareWith(
    receiverA: ISelectedReceivers,
    receiverB: ISelectedReceivers
  ): boolean {
    const areIdsEqual = receiverA.id === receiverB.id;
    const arePropertyIdsEqual = receiverA.propertyId === receiverB.propertyId;
    const areSecondaryEmailIdsEqual =
      (receiverA.secondaryEmail?.id || receiverA.secondaryEmailId) ===
      (receiverB.secondaryEmail?.id || receiverB.secondaryEmailId);

    return areIdsEqual && arePropertyIdsEqual && areSecondaryEmailIdsEqual;
  }

  checkTagExistedOtherCustomPolicy(currentProperties, newProperties) {
    return newProperties.properties.some((property) =>
      currentProperties.includes(property.id)
    );
  }

  validateTagsInCurrentCustomPolicy(
    formIndex,
    tags,
    allProperties,
    isRmEnvironment
  ) {
    if (isRmEnvironment) return allProperties;
    const tagCurrentIndex = this.formService.customPolicy
      .at(formIndex)
      ?.value?.property?.flatMap((pro) => tags.filter((tag) => tag.id === pro))
      ?.flatMap((data) => data.properties.map((pr) => pr.id));

    return (allProperties || []).filter((id) => !tagCurrentIndex?.includes(id));
  }

  getTitleMatchingPolicyReply(policyName, isRmEnvironment, sourcePropertyType) {
    const tagOrProperty = !isRmEnvironment
      ? 'tags'
      : sourcePropertyType === EEntityType.UNIT
      ? 'unit'
      : 'property';
    return `This ${tagOrProperty} is selected in “${policyName}”`;
  }
}
