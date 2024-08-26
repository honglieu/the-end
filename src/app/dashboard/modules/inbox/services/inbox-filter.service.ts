import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { Agent } from '@shared/types/agent.interface';
import { GroupType } from '@shared/enum/user.enum';
import {
  ICalendarEventFilterTask,
  ISelectedCalendarEventId
} from '@shared/types/calendar.interface';
import { ITaskTypeEditor } from '@shared/types/task.interface';
import { IMailBox } from '@shared/types/user.interface';
import { ESortTaskTypeParam } from '@/app/dashboard/modules/task-page/utils/enum';

@Injectable({
  providedIn: 'root'
})
export class InboxFilterService {
  private _selectedItem$ = new BehaviorSubject({
    assignee: 0,
    portfolio: 0,
    eventType: 0,
    taskType: 0,
    messageStatus: 0,
    showTaskMessage: 0
  });
  public selectedItem$ = this._selectedItem$.asObservable();

  private selectedPortfolio: BehaviorSubject<string[]> = new BehaviorSubject<
    string[]
  >([]);
  private selectedAgency: BehaviorSubject<string[]> = new BehaviorSubject<
    string[]
  >([]);
  private selectedStatus: BehaviorSubject<string[]> = new BehaviorSubject<
    string[]
  >([]);

  private listTaskEditor: BehaviorSubject<ITaskTypeEditor[]> =
    new BehaviorSubject<ITaskTypeEditor[]>([]);

  private selectedTaskEditorId: BehaviorSubject<string[]> = new BehaviorSubject<
    string[]
  >([]);

  private selectedSortTaskType: BehaviorSubject<string> =
    new BehaviorSubject<string>(ESortTaskTypeParam.NEWEST_TO_OLDEST);

  private selectedInboxType: BehaviorSubject<GroupType> =
    new BehaviorSubject<GroupType>(GroupType.MY_TASK);
  private searchDashboard: BehaviorSubject<string> =
    new BehaviorSubject<string>(null);
  private listDataFilter: BehaviorSubject<Agent[]> = new BehaviorSubject<
    Agent[]
  >([]);

  private calendarEventFilterList: BehaviorSubject<ICalendarEventFilterTask[]> =
    new BehaviorSubject<ICalendarEventFilterTask[]>([]);

  private selectedCalendarEventId: BehaviorSubject<ISelectedCalendarEventId> =
    new BehaviorSubject<ISelectedCalendarEventId>({
      eventType: [],
      startDate: null,
      endDate: null
    });

  private isSelectedItemAssignee: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  private isFilterDisabled: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  private currentGlobalSearchMailBox = new BehaviorSubject<IMailBox[]>([]);

  public triggerTurnOffFocusView$ = new Subject<boolean>();

  get getCurrentGlobalSearchMailBox$(): Observable<IMailBox[]> {
    return this.currentGlobalSearchMailBox.asObservable();
  }

  private showMessageInTask: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  get isSelectedItemAssignee$(): Observable<boolean> {
    return this.isSelectedItemAssignee.asObservable();
  }

  get isFilterDisabled$(): Observable<boolean> {
    return this.isFilterDisabled.asObservable();
  }

  get showMessageInTask$(): Observable<boolean> {
    return this.showMessageInTask.asObservable();
  }

  get listDataFilter$(): Observable<Agent[]> {
    return this.listDataFilter.asObservable();
  }

  get selectedCalendarEventId$(): Observable<ISelectedCalendarEventId> {
    return this.selectedCalendarEventId.asObservable();
  }

  get selectedPortfolio$(): Observable<string[]> {
    return this.selectedPortfolio.asObservable();
  }

  get selectedAgency$(): Observable<string[]> {
    return this.selectedAgency.asObservable();
  }

  get selectedTaskEditorId$(): Observable<string[]> {
    return this.selectedTaskEditorId.asObservable();
  }

  get selectedInboxType$(): Observable<GroupType> {
    return this.selectedInboxType.asObservable();
  }

  get searchDashboard$(): Observable<string> {
    return this.searchDashboard.asObservable();
  }

  get selectedStatus$(): Observable<string[]> {
    return this.selectedStatus.asObservable();
  }

  get selectedSortTaskType$(): Observable<string> {
    return this.selectedSortTaskType.asObservable();
  }

  getSelectedAgency() {
    return this.selectedAgency.asObservable();
  }

  getSelectedInboxType() {
    return this.selectedInboxType.value;
  }

  getSelectedCalendarEventId() {
    return this.selectedCalendarEventId.asObservable();
  }

  getSelectedCalendarEventCurrentId() {
    return this.selectedCalendarEventId;
  }

  getSelectedPortfolio() {
    return this.selectedPortfolio.asObservable();
  }

  getCalendarEventFilterList() {
    return this.calendarEventFilterList.asObservable();
  }
  getSelectedTaskEditorId() {
    return this.selectedTaskEditorId.asObservable();
  }

  getCurrentSelectedTaskEditorId() {
    return this.selectedTaskEditorId;
  }

  getListDataFilter() {
    return this.listDataFilter.asObservable();
  }

  getlistTaskEditor() {
    return this.listTaskEditor.asObservable();
  }

  setIsSelectedItemAssignee(status: boolean) {
    return this.isSelectedItemAssignee.next(status);
  }

  setIsFilterDisabled(value: boolean) {
    return this.isFilterDisabled.next(value);
  }

  setShowMessageInTask(value: boolean) {
    return this.showMessageInTask.next(value);
  }

  setSelectedStatus(value: string[] | string) {
    this.selectedStatus.next(Array.isArray(value) ? value : [value]);
  }

  setSelectedAgency(value: string[]) {
    this.selectedAgency.next(value);
  }

  setSelectedInboxType(value: GroupType) {
    this.selectedInboxType.next(value);
  }

  setSearchDashboard(value: string) {
    this.searchDashboard.next(value);
  }

  setSelectedPortfolio(value: string[]) {
    this.selectedPortfolio.next(value);
  }

  setListDataFilter(value: Agent[]) {
    this.listDataFilter.next(value);
  }
  setCalendarEventFilterList(value) {
    this.calendarEventFilterList.next(value);
  }

  setSelectedCalendarEventId(value) {
    this.selectedCalendarEventId.next(value);
  }

  setlistTaskEditor(value) {
    this.listTaskEditor.next(value);
  }

  setSelectedTaskEditorId(value: string[]) {
    this.selectedTaskEditorId.next(value);
  }

  setSelectedSortTaskType(value: string) {
    this.selectedSortTaskType.next(value);
  }

  setGlobalSearchMailBox(mailBoxes: IMailBox[]) {
    this.currentGlobalSearchMailBox.next(mailBoxes);
  }

  getSelectedSortTaskType() {
    return this.selectedSortTaskType.asObservable();
  }

  clearInboxFilter() {
    this.selectedInboxType.next(GroupType.TEAM_TASK);
    this.selectedPortfolio.next([]);
    this.selectedStatus.next([]);
    this.selectedAgency.next([]);
    this.searchDashboard.next('');
  }

  patchValueSelectedItem(key: string, value: number) {
    const currentValue = this._selectedItem$.getValue();
    this._selectedItem$.next({ ...currentValue, [key]: value });
  }
}
