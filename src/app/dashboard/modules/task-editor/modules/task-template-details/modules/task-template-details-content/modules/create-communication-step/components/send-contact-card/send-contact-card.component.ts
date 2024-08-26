import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommunicationStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/communication-step-form.service';
import { EContactCardType } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { IRadioButton } from '@trudi-ui';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { UserService } from '@services/user.service';
import {
  IInputToGetSupplier,
  ISupplierBasicInfo
} from '@shared/types/users-supplier.interface';
import { debounceTime, switchMap, takeUntil, tap } from 'rxjs/operators';
import { BehaviorSubject, Subject } from 'rxjs';
import { generateSendToData } from '@/app/dashboard/modules/task-editor/constants/communication.constant';
import { TaskTemplateService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template.service';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'send-contact-card',
  templateUrl: './send-contact-card.component.html',
  styleUrls: ['./send-contact-card.component.scss']
})
export class SendContactCardComponent implements OnInit {
  private destroy$ = new Subject<void>();
  @Output() openSelect = new EventEmitter();
  public supplier$: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  public sendContactCardForm: FormGroup;
  public selectedContactCardType: boolean = false;
  public listContactTypes = [];
  public listIndividualSupplier: ISupplierBasicInfo[] = [];
  public tempListIndividualSupplier: ISupplierBasicInfo[] = [];
  public listSupliers = [];
  public radioListContactCardType: IRadioButton[] = [
    {
      label: 'Individual supplier',
      value: EContactCardType.INDIVIDUAL_SUPPLIER
    },
    { label: 'Contact type', value: EContactCardType.CONTACT_TYPE }
  ];
  public readonly EContactCardType = EContactCardType;
  public isChangeContactType: boolean = false;
  public isDisabled: boolean = false;
  public crmSystemId: string;

  constructor(
    private communicationStepFormService: CommunicationStepFormService,
    private agencyService: AgencyService,
    private userService: UserService,
    private taskTemplateService: TaskTemplateService,
    private taskEditorService: TaskEditorService,
    private companyService: CompanyService
  ) {}

  public currentPage: number = 0;
  public itemsPerPage: number = 50;
  public searchText: string = '';
  public isScrollBottomOfSearchData: boolean = false;
  public isSearchText: boolean = false;
  public totalPages: number = 0;
  public isLoading: boolean = false;

  ngOnInit(): void {
    this.sendContactCardForm = this.communicationStepFormService
      .getCustomForm as FormGroup;
    if (this.taskEditorService.isConsoleSettings) {
      this.taskTemplateService.taskTemplate$
        .pipe(takeUntil(this.destroy$))
        .subscribe((template) => {
          this.listContactTypes = generateSendToData(template.crmSystemKey);
          this.sendContactCardForm.patchValue({
            crmSystemId: template.crmSystemId
          });
        });
    } else {
      this.companyService.currentCompanyCRMSystemName
        .pipe(takeUntil(this.destroy$))
        .subscribe((crm) => {
          this.listContactTypes = generateSendToData(crm);
        });
    }

    this.getCurrentCompany();
  }

  changeContactType() {
    this.handleChooseContactType();
  }

  getCurrentCompany() {
    this.companyService
      .getCurrentCompany()
      .pipe(
        switchMap((agency) => {
          this.crmSystemId = agency.CRM;
          return this.getListSuppliers();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  getPayloadListSupplier() {
    const userIds = this.sendContactCardForm.get('contactData').value;
    const payload: IInputToGetSupplier = {
      page: this.currentPage,
      size: this.itemsPerPage,
      search: this.searchText,
      email_null: true,
      userIds: this.isSearchText ? [] : userIds
    };
    if (this.isConsole) {
      payload.crmSystemId = this.crmSystemId;
    }
    return payload;
  }

  getListSuppliers() {
    this.isLoading = true;
    return this.supplier$.asObservable().pipe(
      debounceTime(500),
      switchMap(() => {
        const payload = this.getPayloadListSupplier();
        return this.userService.getListSuppliers(payload);
      }),
      tap((res) => {
        if (res) {
          this.setListSupplierData(res);
        }
      }),
      takeUntil(this.destroy$)
    );
  }

  refreshSupplierData() {
    this.supplier$.next(null);
  }

  onScroll() {
    if (this.currentPage + 1 < this.totalPages) {
      this.currentPage++;
      if (this.isSearchText) {
        this.isScrollBottomOfSearchData = true;
      }
      this.refreshSupplierData();
    }
  }

  clearAll() {
    this.sendContactCardForm.get('contactData').setValue([]);
  }

  ngAfterViewInit(): void {
    this.isDisabled = true;
  }

  public get formData(): FormGroup {
    return this.sendContactCardForm;
  }

  get contactCardTypeControl() {
    return this.sendContactCardForm.get('contactCardType');
  }

  get disabled() {
    return this.contactCardTypeControl.status === 'DISABLED';
  }

  get isConsole() {
    return this.taskEditorService.isConsoleSettings;
  }

  public updateValueAndValidity(): void {
    this.sendContactCardForm.updateValueAndValidity();
  }

  handleChooseContactType() {
    this.isChangeContactType = true;
    if (this.isChangeContactType) {
      this.sendContactCardForm.get('contactData').setValue([]);
    }
  }

  handleCheckContactExist(listIndividualSupplier) {
    let listContact = this.sendContactCardForm.get('contactData').value;
    let listIndividualSupplierId = listIndividualSupplier.map(
      (item) => item.id
    );
    let checkExist = listContact.every((element) =>
      listIndividualSupplierId.includes(element)
    );
    if (checkExist) {
      return;
    }
    let listContactValid = listContact.filter((item) =>
      listIndividualSupplierId.includes(item)
    );
    this.sendContactCardForm.get('contactData').setValue(listContactValid);
  }

  setListSupplierData(res) {
    let userIds = this.sendContactCardForm.get('contactData').value;
    if (
      (!this.isScrollBottomOfSearchData && this.isSearchText) ||
      this.currentPage == 0
    ) {
      this.listIndividualSupplier = res.suppliers;
    } else {
      let newIndividualSuppliers = res.suppliers;
      this.listIndividualSupplier = [
        ...this.listIndividualSupplier,
        ...newIndividualSuppliers
      ];
    }
    this.totalPages = res.totalPages;

    this.listIndividualSupplier.forEach((e) => {
      if (
        userIds.includes(e.id) &&
        !this.tempListIndividualSupplier.some((item) => item.id === e.id)
      ) {
        this.tempListIndividualSupplier.push(e);
      }
    });
    if (
      this.contactCardTypeControl.value === EContactCardType.INDIVIDUAL_SUPPLIER
    ) {
      this.handleCheckContactExist(this.tempListIndividualSupplier);
    }
    this.isLoading = false;
  }

  handleOpen() {
    if (this.searchText) {
      this.openSelect.emit();
      this.currentPage = 0;
      this.searchText = '';
      this.refreshSupplierData();
    }
  }

  search(event) {
    this.isSearchText = true;
    this.searchText = event.term;
    if (!event.term) {
      this.isSearchText = false;
    }
    this.currentPage = 0;
    this.refreshSupplierData();
    this.isLoading = true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
