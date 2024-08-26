import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TaskItem } from '@shared/types/task.interface';
import { IConversationMove } from '@shared/types/conversation.interface';

@Injectable({
  providedIn: 'root'
})
export class SharedMessageViewService {
  private prefillCreateTaskData = new BehaviorSubject<TaskItem>(null);
  private isSelectingMode = new BehaviorSubject<boolean>(false);
  private isSearchBoxFocused = new BehaviorSubject<boolean>(false);
  private isRightClickDropdownVisible = new BehaviorSubject<boolean>(false);
  private rightClicKSelectedMessageId = new BehaviorSubject<string>('');
  private isShowSelect = new BehaviorSubject<boolean>(false);
  private messageToReOpen = new BehaviorSubject<IConversationMove>(null);

  constructor() {}

  setPrefillCreateTaskData(data: TaskItem) {
    this.prefillCreateTaskData.next(data);
  }

  setIsSelectingMode(data: boolean) {
    this.isSelectingMode.next(data);
  }

  setIsSearchBoxFocused(data: boolean) {
    this.isSearchBoxFocused.next(data);
  }

  setIsRightClickDropdownVisible(data: boolean) {
    this.isRightClickDropdownVisible.next(data);
  }

  setRightClickSelectedMessageId(data: string) {
    this.rightClicKSelectedMessageId.next(data);
  }

  setIsShowSelect(value) {
    this.isShowSelect.next(value);
  }

  get isShowSelect$() {
    return this.isShowSelect.asObservable();
  }

  get isShowSelectValue() {
    return this.isShowSelect.getValue();
  }

  get rightClicKSelectedMessageId$() {
    return this.rightClicKSelectedMessageId.asObservable();
  }

  get rightClickSelectedMessageIdValue() {
    return this.rightClicKSelectedMessageId.getValue();
  }

  get isRightClickDropdownVisibleValue() {
    return this.isRightClickDropdownVisible.getValue();
  }

  get isRightClickDropdownVisible$() {
    return this.isRightClickDropdownVisible.asObservable();
  }

  get isSearchBoxFocused$() {
    return this.isSearchBoxFocused.asObservable();
  }

  get prefillCreateTaskData$() {
    return this.prefillCreateTaskData.asObservable();
  }

  get prefillCreateTaskDataValue() {
    return this.prefillCreateTaskData.getValue();
  }

  get isSelectingMode$() {
    return this.isSelectingMode.asObservable();
  }

  get isSelectModeValue() {
    return this.isSelectingMode.getValue();
  }

  getMessageToReOpen() {
    return this.messageToReOpen.asObservable();
  }

  setMessageToReOpen(data: IConversationMove) {
    this.messageToReOpen.next(data);
  }
}
