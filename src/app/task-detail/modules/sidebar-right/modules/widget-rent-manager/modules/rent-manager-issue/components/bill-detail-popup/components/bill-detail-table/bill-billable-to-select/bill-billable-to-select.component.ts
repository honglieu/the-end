import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';

import { TaskService } from '@services/task.service';
import {
  EUserPayloadType,
  EUserType
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { Subject, distinctUntilChanged, of, switchMap, takeUntil } from 'rxjs';
import { BillDetailPopupService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/bill-detail-popup/services/bill-detail-popup.service';
import { FormGroup } from '@angular/forms';
@Component({
  selector: 'bill-billable-to-select',
  templateUrl: './bill-billable-to-select.component.html',
  styleUrls: ['./bill-billable-to-select.component.scss'],
  providers: [BillDetailPopupService]
})
export class BillBillableToSelectComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() control: FormGroup;
  @Input() listUser: ISelectedReceivers[] = [];
  @Input() dropdownPosition;
  @Output() isOpened = new EventEmitter();
  public agencyId = '';
  public propertyId = '';
  public destroy$ = new Subject<void>();
  public EUserType = EUserType;

  public billableToOptions = [
    {
      label: 'Tenant',
      value: EUserType.TENANT,
      propertyName: 'tenant'
    },
    {
      label: 'Owner',
      value: EUserType.OWNER,
      propertyName: 'landlord'
    }
  ];

  constructor(
    private billDetailService: BillDetailPopupService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.getListData();
  }

  ngOnChanges(changes) {
    if (changes['listUser']?.currentValue) {
      const accountType = this.control?.get('accountType')?.value;
      this.listUser = this.listUser.filter((user) =>
        accountType === EUserType.TENANT
          ? user.type === EUserType.TENANCY
          : user.type === EUserType.OWNERSHIP
      );
      if (
        !this.listUser.find(
          (u) => u.id === this.control?.get('billableTo')?.value?.id
        ) &&
        this.listUser.length &&
        this.control?.get('billableTo')?.value?.id
      ) {
        this.control?.get('billableTo')?.setValue(null, { emitEvent: false });
      }
    }
  }

  fetchList(type: EUserType, payload = {}) {
    this.billDetailService.fetchListUser({
      ...payload,
      propertyId: this.propertyId,
      search: '',
      email_null: true,
      userDetails: [],
      userType:
        type === EUserType.TENANT
          ? [
              EUserPayloadType.TENANT_PROPERTY,
              EUserPayloadType.TENANT_PROSPECT,
              EUserPayloadType.TENANT_UNIT
            ]
          : [EUserPayloadType.LANDLORD]
    });
  }

  getListData() {
    this.taskService.currentTask$
      .asObservable()
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        switchMap((currentTask) => {
          if (!currentTask) return of();
          this.propertyId = currentTask?.property?.id;
          this.agencyId = currentTask?.property?.agencyId;

          return this.billDetailService.getListUser();
        })
      )
      .subscribe((listUser) => {
        if (listUser) {
          this.listUser = (listUser as ISelectedReceivers[]).map(
            this.getBindLabel
          );
        }
      });
  }

  customSearchFn(term: string, item) {
    const valueSearch = item.firstName?.trim() + ' ' + item.lastName?.trim();
    const searchByName =
      valueSearch.toLowerCase().indexOf(term.trim().toLowerCase()) > -1;
    const searchByProperty =
      item?.streetLine?.toLowerCase().indexOf(term.trim().toLowerCase()) > -1;
    const searchByEmail =
      item?.email?.toLowerCase().indexOf(term.trim().toLowerCase()) > -1;
    const searchByContactType =
      item?.contactType
        ?.replace('_', ' ')
        .toLowerCase()
        .indexOf(term.trim().toLowerCase()) > -1;
    return (
      searchByName || searchByProperty || searchByEmail || searchByContactType
    );
  }

  getBindLabel(data: ISelectedReceivers, _, res: ISelectedReceivers[]) {
    return {
      ...data,
      bindLabel: data?.firstName + '' + data?.lastName || data?.email || ''
    };
  }

  handleChangeAccountType(formGroup: FormGroup) {
    this.listUser = [];
    formGroup?.get('billableTo')?.setValue(null);
    const accountType = formGroup.value.accountType;
    this.fetchList(accountType);
  }

  urlImg(userPropertyType: EUserType) {
    switch (userPropertyType) {
      case EUserType.OWNER:
        return '/assets/icon/check-octo-landlord.svg';
      case EUserType.TENANT:
        return '/assets/icon/check-octo-tenant.svg';
      case EUserType.VENDOR:
        return '/assets/icon/gold_star.svg';
      default:
        return '';
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
