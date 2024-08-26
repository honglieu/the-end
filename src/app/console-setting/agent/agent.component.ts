import {
  Component,
  OnInit,
  OnDestroy,
  ViewChildren,
  QueryList,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  Renderer2
} from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '@services/api.service';
import { users } from 'src/environments/environment';
import {
  catchError,
  debounceTime,
  pluck,
  switchMap,
  takeUntil
} from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { UserService } from '@services/user.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Agent } from '@shared/types/agent.interface';
import { PodService } from '@services/pod.service';
import { Pod } from '@shared/types/pod.interface';
import {
  AGENT_MANAGEMENT_ROLE_ARRAY,
  PHONE_NUMBER_PATTERN_04,
  PHONE_NUMBER_PATTERN_OTHER
} from '@services/constants';
import { NgSelectComponent } from '@ng-select/ng-select';
import { LoadingService } from '@services/loading.service';

@Component({
  selector: 'app-agent',
  templateUrl: './agent.component.html',
  styleUrls: ['./agent.component.scss']
})
export class AgentComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChildren(NgSelectComponent) selectElements: QueryList<any>;
  @ViewChild('selectPodFilter') public selectPodFilter: NgSelectComponent;
  @ViewChild('selectRoleFilter') public selectRoleFilter: NgSelectComponent;
  @ViewChild('searchInput') public searchElement: ElementRef;
  @ViewChild('agentTable') agentTable: ElementRef;

  public listOfAgent: Agent[] = [];
  public tabs = {
    active: 'active',
    inactive: 'inactive'
  };
  public currentTab = this.tabs.active;
  public meetCheckedList = [];
  public emergencyCheckedList = [];
  public agencyListBackup = [];

  private unsubscribe = new Subject<void>();
  public isAdmin = false;
  public isEditing = false;
  public meetBackup: boolean;
  public emerBackup: boolean;
  public rowIndexEditing: number;
  public agentEditForm: FormGroup;
  public filterAgentForm: FormGroup;
  public userId: string;
  public listOfPod: Pod[] = [];
  public listOfRole = [...AGENT_MANAGEMENT_ROLE_ARRAY];
  public listOfFilterRole = [...AGENT_MANAGEMENT_ROLE_ARRAY];

  public searchText = '';
  public isShowClose = false;
  public isShowClear = false;
  public isClearEnable = false;
  public searchValue = '';

  public selectedPodFilter: string;
  public selectedRoleFilter: string;
  public placeholderText: string = 'Roles';
  maskPattern = PHONE_NUMBER_PATTERN_OTHER;
  public searchField = new FormControl('');
  public loading: boolean = true;
  constructor(
    private router: Router,
    private apiService: ApiService,
    public userService: UserService,
    private renderer: Renderer2,
    private podService: PodService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.listOfFilterRole = [
      ...this.listOfFilterRole,
      {
        id: '',
        text: 'Clear'
      }
    ];
    this.filterAgentForm = new FormGroup({
      pod: new FormControl(''),
      role: new FormControl(''),
      search: new FormControl('')
    });
    this.agentEditForm = new FormGroup({
      title: new FormControl('', Validators.required),
      phone: new FormControl(''),
      role: new FormControl('')
    });
    this.loadingService.onLoading();
    this.apiService.getAPI(users, 'current-user').subscribe((res) => {
      this.isAdmin = res.isAdministrator;
      this.userId = res.id;
      this.loadingService.stopLoading();
    });
    this.podService
      .getListOfPod()
      .pipe(
        pluck('body'),
        catchError(() => of([]))
      )
      .subscribe((result) => {
        if (result) {
          this.listOfPod = result;
          this.listOfPod.push({
            id: '',
            name: 'Clear all'
          });
        }
      });
    this.agentEditForm.controls?.['phone'].valueChanges.subscribe(
      (phoneText: string) => {
        if (
          phoneText?.startsWith('04') ||
          phoneText?.startsWith('1300') ||
          phoneText?.startsWith('1800')
        ) {
          this.maskPattern = PHONE_NUMBER_PATTERN_04;
        } else {
          this.maskPattern = PHONE_NUMBER_PATTERN_OTHER;
        }
      }
    );
    this.handleSearch();
  }

  handleSearch() {
    this.searchField.valueChanges
      .pipe(
        takeUntil(this.unsubscribe),
        debounceTime(300),
        switchMap((keyWord) => {
          this.loading = true;
          this.searchValue = keyWord || '';
          return this.userService.getListOfAgent(
            this.searchValue,
            this.filterRoleValue?.id || '',
            this.filterPodValue?.id || ''
          );
        })
      )
      .subscribe({
        next: (res) => {
          this.listOfAgent = res || [];
          this.listOfAgent.forEach((item, idx: number) => {
            this.meetCheckedList.push({
              id: 'cb-meet-' + idx,
              checked: item.isMeetTheTeam
            });
            this.emergencyCheckedList.push({
              id: 'cb-emer-' + idx,
              checked: item.isEmergencyContact
            });
          });
          this.loading = false;
        },
        error: () => (this.loading = false)
      });
    this.reloadData();
  }

  reloadData(keyWord = '') {
    this.searchField.setValue(keyWord || this.searchField.value || '');
  }

  isEditingCurrentUser(idRow: number) {
    return this.isEditing && this.listOfAgent[idRow].id === this.userId;
  }

  closeOtherSelects(element) {
    this.placeholderText = '';
    if (element.optionsOpened === true) {
      const elementsToclose = this.selectElements.filter(function (el: any) {
        return el !== element && el.optionsOpened === true;
      });
      elementsToclose.forEach(function (e) {
        e.clickedOutside();
      });
    }
  }
  closeSelect() {
    this.placeholderText = 'Roles';
  }
  onRoleChanged(event) {
    this.setRoleValue(event.id);
  }
  getAgentType(type: string): string {
    return this.listOfRole.find((el) => el.id === type)?.text;
  }
  rolesChanged(value): void {
    if (!value) return;
    if (value.text === 'Clear') {
      this.selectedRoleFilter = null;
      this.setRoleFilterValue({ id: '', name: '' });
      this.selectRoleFilter.handleClearClick();
    } else {
      this.setRoleFilterValue(value);
    }

    this.reloadData();
  }

  podChanged(value): void {
    if (value.name === 'Clear all') {
      this.selectedPodFilter = null;
      this.setPodFilterValue({ id: '', name: '' });
    } else {
      this.setPodFilterValue(value);
    }
    this.reloadData();
  }

  setRoleFilterValue(value): void {
    this.filterAgentForm.get('role').setValue(value);
  }

  setPodFilterValue(value): void {
    this.filterAgentForm.get('pod').setValue(value);
  }

  setRoleValue(value): void {
    this.agentEditForm.get('role').setValue(value);
  }

  setTitleValue(value): void {
    this.agentEditForm.get('title').setValue(value);
  }

  setPhoneValue(value): void {
    this.agentEditForm.get('phone').setValue(value);
  }

  get filterRoleValue() {
    return this.filterAgentForm.get('role').value;
  }

  get filterPodValue() {
    return this.filterAgentForm.get('pod').value;
  }

  get roleValue() {
    return this.agentEditForm.get('role');
  }

  get titleValue() {
    return this.agentEditForm.get('title');
  }

  get phoneValue() {
    return this.agentEditForm.get('phone');
  }

  conversation() {
    this.router.navigate(['dashboard']);
  }

  onCheckboxChange(idx: number, list, callbackCheckAdmin?: boolean) {
    if (list && list.length && list[idx]) {
      list[idx].checked = !list[idx].checked;
    }

    if (callbackCheckAdmin) {
      this.listOfAgent[idx].pods.map((pod) => (pod.isChecked = true));
    }
  }

  onCheckboxAgenciesChange(idx: number) {
    this.listOfAgent[this.rowIndexEditing].pods[idx].isChecked =
      !this.listOfAgent[this.rowIndexEditing].pods[idx].isChecked;
  }

  isChecked(idx: number, list) {
    return list && list[idx] ? list[idx].checked : false;
  }

  onCloneRowData(idxCloneRow: number) {
    this.meetBackup = this.meetCheckedList[idxCloneRow].checked;
    this.emerBackup = this.emergencyCheckedList[idxCloneRow].checked;
    this.agencyListBackup = [];
    this.listOfAgent[idxCloneRow].pods.forEach((agency) =>
      this.agencyListBackup.push(agency.isChecked)
    );
  }

  onRecoveryCloneData() {
    this.listOfAgent[this.rowIndexEditing]?.pods?.forEach(
      (agency, idx: number) => (agency.isChecked = this.agencyListBackup[idx])
    );
    this.meetCheckedList[this.rowIndexEditing].checked = this.meetBackup;
    this.emergencyCheckedList[this.rowIndexEditing].checked = this.emerBackup;
  }

  ngAfterViewChecked(): void {
    this.checkShowDropdown();
  }

  checkShowDropdown() {
    const element = this.agentTable.nativeElement;
    const tbody = element.querySelector('table tbody');
    const agentList = tbody.querySelectorAll('tr');
    const agentCount = agentList.length;
    if (agentCount < 9) {
      const hasDropdown =
        agentList[agentCount - 1]?.querySelector('.ng-dropdown-panel-items') ??
        agentList[agentCount - 2]?.querySelector('.ng-dropdown-panel-items');
      if (hasDropdown) {
        this.renderer.setStyle(element, 'border', 'none');
        this.renderer.setStyle(element, 'min-height', 'calc(100vh - 150px)');
      } else {
        this.renderer.setStyle(element, 'min-height', 'initial');
      }
    } else {
      this.renderer.setStyle(element, 'border', '1px solid var(--gray-200)');
      this.renderer.setStyle(element, 'min-height', 'initial');
    }
  }

  onOpenEditMode(idxRow: number) {
    this.setPhoneValue(this.getPhoneNumber(idxRow));
    this.setTitleValue(this.listOfAgent[idxRow].title);
    this.setRoleValue(this.listOfAgent[idxRow].type);
    if (this.isEditing && this.rowIndexEditing >= 0) {
      this.onRecoveryCloneData();
    } else {
      this.isEditing = true;
    }
    this.onCloneRowData(idxRow);
    this.rowIndexEditing = idxRow;
  }

  onSaveEdit() {
    if (this.agentEditForm.invalid) {
      return;
    }
    let podIds: string[] = [];
    const agentEditing = this.listOfAgent[this.rowIndexEditing];
    agentEditing.pods.forEach((pod) =>
      pod.isChecked ? podIds.push(pod.id) : null
    );
    const body = {
      userId: agentEditing.id,
      title: this.titleValue.value || '',
      phoneNumber: this.phoneValue.value
        ? '+' + this.phoneValue.value.replace(/\s/g, '')
        : '',
      type: this.roleValue.value || '',
      isMeetTheTeam: this.meetCheckedList[this.rowIndexEditing].checked,
      isEmergencyContact:
        this.emergencyCheckedList[this.rowIndexEditing].checked,
      podIds
    };
    this.loadingService.onLoading();
    this.apiService.putAPI(users, 'v2/update-agent', body).subscribe(
      () => {
        this.loadingService.stopLoading();
        agentEditing.phoneNumber = this.phoneValue.value
          ? '+' + this.phoneValue.value
          : '';
        agentEditing.title = this.titleValue.value;
        agentEditing.type = this.roleValue.value;
        this.isEditing = false;
        this.rowIndexEditing = null;
      },
      () => this.loadingService.stopLoading()
    );
  }

  onCancelEdit() {
    this.onRecoveryCloneData();
    this.isEditing = false;
    this.rowIndexEditing = null;
  }

  getAvtOfAgency(name: string) {
    return name.charAt(0);
  }

  getPhoneNumber(idxRow: number) {
    if (this.listOfAgent[idxRow].phoneNumber) {
      return this.listOfAgent[idxRow].phoneNumber.substring(1);
    }

    return null;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
