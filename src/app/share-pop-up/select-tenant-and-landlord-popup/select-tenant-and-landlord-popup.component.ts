import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy,
  SimpleChanges
} from '@angular/core';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { PropertiesService } from '@services/properties.service';
import { RoutineInspectionService } from '@services/routine-inspection.service';
import { UserService } from '@services/user.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import {
  IPersonalInTab,
  UserPropInSelectPeople
} from '@shared/types/user.interface';

@Component({
  selector: 'select-tenant-landlord-popup',
  templateUrl: './select-tenant-and-landlord-popup.component.html',
  styleUrls: ['./select-tenant-and-landlord-popup.component.scss']
})
export class SelectTenantLandlordPopup implements OnInit, OnDestroy {
  @Input() showSelectTenantOrLandlord = false;
  @Input() headerName = 'Select People';
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() listSelectedUser = new EventEmitter<any>();
  @Output() isClickNext = new EventEmitter<boolean>();
  @Input() selectUserType:
    | EUserPropertyType.LANDLORD
    | EUserPropertyType.TENANT
    | 'TENANT_LANDLORD' = 'TENANT_LANDLORD';
  @Input() isResetForm: boolean;

  private subscribers = new Subject<void>();
  public listOfUser: IPersonalInTab;
  public selectedUser = [];
  public checkedList = [];
  public listSelectedOwnTen = [];
  public tenancyId: string;

  constructor(
    public userService: UserService,
    private propertyService: PropertiesService,
    private routineInspectionService: RoutineInspectionService
  ) {}

  ngOnInit(): void {
    combineLatest(this.propertyService.peopleList$, this.userService.tenancyId$)
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (res && res.length) {
          this.listOfUser = res[0];
          this.tenancyId = res[1];
          this.generateCheckList();
        }
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isResetForm'] && changes['isResetForm']?.currentValue) {
      this.handleResetSelectedUser();
    }
  }

  isOpenModal(status) {
    if (!status) {
      this.listSelectedOwnTen = [];
      this.isCloseModal.next(status);
      this.generateCheckList();
    }
  }

  isGroupChecked(groupId) {
    return this.selectedUser.some((el) => el.groupId === groupId && el.checked);
  }

  isChecked(idRow) {
    const item = this.selectedUser.find((i) => i.id === idRow);
    return item ? item.checked : false;
  }

  generateCheckList() {
    this.checkedList = [];
    this.selectedUser = [];

    if (this.listOfUser) {
      this.listOfUser?.ownerships?.forEach((ownership) => {
        this.checkedList.push({
          id: 'cb-' + ownership.id + '-',
          checked: false
        });
        ownership.userProperties.forEach((userProperty) => {
          this.selectedUser.push({
            id: userProperty.user.id,
            type: userProperty.type,
            firstName: userProperty.user.firstName,
            lastName: userProperty.user.lastName,
            status: ownership.status,
            inviteSent: userProperty.user.iviteSent,
            lastActivity: userProperty.user.lastActivity,
            offBoarded: userProperty.user.offBoardedDate,
            propertyId: userProperty.propertyId,
            userPropertyId: userProperty.id,
            groupId: ownership.id,
            checked: false,
            isPrimary: userProperty.isPrimary,
            email: userProperty.user?.email
          });
        });
      });
      this.listOfUser?.tenancies?.forEach((tenancy) => {
        this.checkedList.push({
          id: 'cb-' + tenancy.id + '-',
          checked: false
        });
        tenancy.userProperties.forEach((userProperty) => {
          this.selectedUser.push({
            id: userProperty.user.id,
            type: userProperty.type,
            firstName: userProperty.user.firstName,
            lastName: userProperty.user.lastName,
            status: tenancy.status,
            inviteSent: userProperty.user.iviteSent,
            lastActivity: userProperty.user.lastActivity,
            offBoarded: userProperty.user.offBoardedDate,
            propertyId: userProperty.propertyId,
            userPropertyId: userProperty.id,
            groupId: tenancy.id,
            checked: false,
            isPrimary: userProperty.isPrimary,
            email: userProperty.user?.email
          });
        });
      });

      if (this.tenancyId) {
        this.listOfUser.tenancies = this.listOfUser.tenancies.filter(
          (el) => el.id === this.tenancyId
        );
      }
      this.listSelectedOwnTen = this.getUserByType(this.selectedUser);
    }
  }

  onCheckboxChange(idRow) {
    this.selectedUser.forEach((item) => {
      if (item.userPropertyId === idRow) {
        item.checked = !item.checked;
      }
    });
    const checkedItems: UserPropInSelectPeople[] = this.selectedUser.filter(
      (el) => el.checked
    );
    this.listSelectedOwnTen = this.getUserByType(checkedItems);
  }

  getUserByType(selectedUser: UserPropInSelectPeople[]) {
    switch (this.selectUserType) {
      case EUserPropertyType.TENANT:
        return selectedUser.filter(
          (user) => user.type === EUserPropertyType.TENANT && user.checked
        );
      case EUserPropertyType.LANDLORD:
        return selectedUser.filter(
          (user) => user.type === EUserPropertyType.LANDLORD && user.checked
        );
      default:
        return selectedUser.filter((user) => user.checked);
    }
  }

  checkListChecked() {
    switch (this.selectUserType) {
      case EUserPropertyType.TENANT:
        return this.selectedUser.some(
          (user) => user.type === EUserPropertyType.TENANT && user.checked
        );
      case EUserPropertyType.LANDLORD:
        return this.selectedUser.some(
          (user) => user.type === EUserPropertyType.LANDLORD && user.checked
        );
      default:
        return this.selectedUser.some((user) => user.checked);
    }
  }

  handleCLickNext(status: boolean) {
    this.isClickNext.emit(status);
    const checkedItems = [...this.listSelectedOwnTen];
    this.listSelectedUser.next(checkedItems);
  }

  handleResetSelectedUser() {
    this.selectedUser = this.selectedUser.map((user) => {
      return {
        ...user,
        checked: false
      };
    });
  }

  ngOnDestroy(): void {
    this.subscribers.next();
    this.subscribers.complete();
  }
}
