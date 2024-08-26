import { PoliciesApiService } from '@/app/dashboard/modules/agency-settings/components/policies/services/policies-api.service';
import { PoliciesService } from '@/app/dashboard/modules/agency-settings/components/policies/services/policies.service';
import { IGetListUserResponse } from '@/app/dashboard/modules/agency-settings/components/policies/utils/polices-interface';
import { EContactCardOpenFrom, crmStatusType } from '@shared/enum';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import {
  BehaviorSubject,
  Subject,
  debounceTime,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { EUserPropertyType } from '@shared/enum/user.enum';

import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';

@Component({
  selector: 'add-supplier',
  templateUrl: './add-supplier.component.html',
  styleUrl: './add-supplier.component.scss',
  providers: [PoliciesService]
})
export class AddSupplierComponent implements OnInit, OnChanges {
  @Input() openFrom: EContactCardOpenFrom;
  @Input() visible: boolean = false;
  @Input() form: FormGroup;
  @Input() closable: boolean = false;
  @Input() userType: EUserPropertyType = null;
  @Output() onAddCard: EventEmitter<boolean> = new EventEmitter(false);
  @Output() onClose: EventEmitter<any> = new EventEmitter();
  @Output() changeValue: EventEmitter<any> = new EventEmitter();
  @Output() closePopup: EventEmitter<boolean> = new EventEmitter(false);
  ModalPopupPosition = ModalPopupPosition;
  isShowAddContactCard: boolean = false;
  EUserPropertyType = EUserPropertyType;
  private destroy$: Subject<void> = new Subject<void>();
  public listReceiver: ISelectedReceivers[] = [];
  public currentPage: number = 1;
  public totalPage: number = 0;
  public search: string = '';
  public supplierList$: BehaviorSubject<string> = new BehaviorSubject<string>(
    null
  );
  public isLoading: boolean = true;
  public totalUser: number = null;
  public compareWith = this.policiesService.compareWith;
  constructor(
    private policiesService: PoliciesService,
    public cdr: ChangeDetectorRef,
    private policiesApiService: PoliciesApiService
  ) {}

  get selectedContactCard(): AbstractControl {
    return this.form?.get('selectedContactCard');
  }

  ngOnInit(): void {
    this.getListSupplier();
    this.subscribeSupplierChange();
  }

  ngOnChanges(changes: SimpleChanges): void {}

  searchUser(value: string) {
    this.isLoading = true;
    this.listReceiver = [];
    this.currentPage = 1;
    this.search = value;
    this.supplierList$.next(null);
  }

  getNextPage() {
    if (this.currentPage >= this.totalPage) return;
    this.isLoading = true;
    this.currentPage = this.currentPage + 1;
    this.supplierList$.next(null);
  }

  onCloseContactCard() {
    const selectedContactCard = this.policiesService.getSelectedContactCard();
    if (!selectedContactCard?.length) this.selectedContactCard.reset();
    this.onClose.emit();
  }

  onAddSupplier() {
    this.onAddCard.emit();
    this.selectedContactCard.setValue([...this.selectedContactCard.value]);
  }

  onClosePopup() {
    this.closePopup.emit();
  }

  subscribeSupplierChange() {
    this.selectedContactCard.valueChanges.subscribe((value) => {
      this.listReceiver = this.listReceiver.map((supplier) => ({
        ...supplier,
        disabled:
          !value.some((item) => supplier.id === item.id) &&
          supplier?.status === crmStatusType.archived
      }));
    });
  }

  refreshData() {
    if (this.selectedContactCard) {
      this.policiesService.setSelectedContactCard(
        this.selectedContactCard.value
      );
    }
    const selectedContactCard = this.policiesService.getSelectedContactCard();
    return this.supplierList$.asObservable().pipe(
      debounceTime(500),
      switchMap(() => {
        const payload = {
          email_null: true,
          limit: 20,
          page: this.currentPage,
          search: this.search,
          types: [this.userType, EUserPropertyType.LEAD],
          isContactCard: true,
          filterAll: true,
          userDetails: selectedContactCard?.map((user) => ({
            id: user.id,
            propertyId: user.propertyId
          }))
        };
        return this.policiesApiService.getListSupplierApi(payload);
      }),
      tap((res: IGetListUserResponse) => {
        const users = res.users.map((user) => {
          const selectedCard = selectedContactCard?.find(
            (contactCard) => contactCard?.id === user?.id
          );
          const supplier = selectedCard || user;
          return {
            ...supplier,
            disabled:
              !selectedContactCard?.some((item) => supplier.id === item.id) &&
              supplier?.status === crmStatusType.archived
          };
        });
        this.isLoading = false;

        this.listReceiver = [...this.listReceiver, ...users];
        this.currentPage = res.currentPage;
        this.totalPage = res.totalPage;

        if (!this.totalUser) this.totalUser = res.totalUser;
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$)
    );
  }

  getListSupplier() {
    this.refreshData().pipe(takeUntil(this.destroy$)).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
