import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { RentManagerIssueService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue.service';
import { RentManagerIssueFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-form.service';
import {
  Subject,
  combineLatest,
  concatMap,
  debounceTime,
  filter,
  switchMap,
  takeUntil
} from 'rxjs';
import {
  IRmIssueTenants,
  ISupplierBasicInfo
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { TaskService } from '@services/task.service';
import { RentManagerIssueApiService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-api.service';
import { EUserPayloadType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { AISummaryFacadeService } from '@/app/task-detail/modules/app-chat/components/ai-summary/ai-summary-facade.service';

@Component({
  selector: 'issue-details',
  templateUrl: './issue-details.component.html',
  styleUrls: ['./issue-details.component.scss']
})
export class IssueDetailsComponent implements OnInit {
  public fromIssueDetails: FormGroup;
  public issueDetails;
  public tenantsOrProspects: IRmIssueTenants[];
  public vendor: ISupplierBasicInfo[];
  public agencyId: string;
  public searchListUser: string = '';
  public searchListSuppliers: string = '';
  private searchListUser$ = new Subject<string>();
  private searchListSuppliers$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  public propertyId: string;
  public loadingListUser: boolean = false;
  public loadingListSuppliers: boolean = false;
  public isDisabledVendorField: boolean = false;
  public isDisabledJobField: boolean = false;
  private userRaisedRequest: string;
  constructor(
    public rentManagerIssueService: RentManagerIssueService,
    private rentManagerIssueFormService: RentManagerIssueFormService,
    private rentManagerIssueApiService: RentManagerIssueApiService,
    private taskService: TaskService,
    private aiSummaryFacadeService: AISummaryFacadeService
  ) {
    this.fromIssueDetails = this.rentManagerIssueFormService.form.get(
      'details'
    ) as FormGroup;
  }

  ngOnInit(): void {
    this.taskService.currentTask$
      .pipe(
        takeUntil(this.destroy$),
        concatMap((value) => {
          this.propertyId = value.property.id;
          this.agencyId = value.agencyId;
          return combineLatest([
            this.rentManagerIssueApiService.getListUserApi({
              propertyId: this.propertyId,
              search: this.searchListUser,
              email_null: true,
              userType: [
                EUserPayloadType.TENANT_PROPERTY,
                EUserPayloadType.TENANT_UNIT,
                EUserPayloadType.TENANT_PROSPECT
              ]
            }),
            this.rentManagerIssueApiService.getListSuppliers({
              search: this.searchListSuppliers,
              email_null: true,
              onlySyncData: true,
              userIds: [],
              propertyId: this.propertyId,
              agencyId: this.agencyId
            })
          ]);
        })
      )
      .subscribe((value) => {
        [this.tenantsOrProspects, this.vendor] = value as [
          IRmIssueTenants[],
          ISupplierBasicInfo[]
        ];

        if (
          this.userRaisedRequest &&
          this.tenantsOrProspects?.find(
            (item) => item.id === this.userRaisedRequest
          )
        ) {
          this.fromIssueDetails
            .get('tenantId')
            .setValue(this.userRaisedRequest);
        }
      });

    this.rentManagerIssueService.rmIssueData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.issueDetails = value;
      });

    this.searchListUser$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        filter((value) => !!value),
        switchMap((valueSearchListUser) => {
          this.loadingListUser = true;
          return this.rentManagerIssueApiService.getListUserApi({
            propertyId: this.propertyId,
            search: valueSearchListUser,
            email_null: true,
            userType: [
              EUserPayloadType.TENANT_PROPERTY,
              EUserPayloadType.TENANT_UNIT,
              EUserPayloadType.TENANT_PROSPECT
            ]
          });
        })
      )
      .subscribe((userResult) => {
        this.tenantsOrProspects = [...(userResult as IRmIssueTenants[])];
        this.loadingListUser = false;
      });

    this.searchListSuppliers$
      .pipe(
        takeUntil(this.destroy$),
        filter((value) => !!value),
        debounceTime(300),
        switchMap((searchListSuppliers) => {
          this.loadingListSuppliers = true;
          return this.rentManagerIssueApiService.getListSuppliers({
            search: searchListSuppliers,
            email_null: true,
            onlySyncData: true,
            userIds: [],
            propertyId: this.propertyId,
            agencyId: this.taskService.currentTask$.value.agencyId
          });
        })
      )
      .subscribe((suppliersResult) => {
        this.vendor = [...(suppliersResult as ISupplierBasicInfo[])];
        this.loadingListSuppliers = false;
      });
    this.getDataWorkOrderChange();
    this.handlePrefillForm();
  }

  async handlePrefillForm() {
    if (this.rentManagerIssueFormService.isEditing) {
      return;
    }

    this.userRaisedRequest =
      this.taskService.currentTask$.value?.idUserPropertyGroup;

    if (
      this.userRaisedRequest &&
      this.tenantsOrProspects?.find(
        (item) => item.id === this.userRaisedRequest
      )
    ) {
      this.fromIssueDetails.get('tenantId').setValue(this.userRaisedRequest);
    }
  }

  handleSearchListSuppliers($event) {
    // this.searchListSuppliers$.next($event.term); // TODO; handle paging lazy load
  }

  handleSearchListUser($event) {
    // this.searchListUser$.next($event.term); // TODO; handle paging lazy load
  }

  getDataWorkOrderChange() {
    const issueForm = this.rentManagerIssueFormService.form;
    this.rentManagerIssueFormService.form
      .get('workOrder')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.disableFieldByWorkOrderValue(rs, issueForm);
      });
  }

  disableFieldByWorkOrderValue(workOrderValues, issueForm) {
    const vendorIdControl = issueForm.get('details.vendorId');
    const jobIdControl = issueForm.get('details.jobId');
    const isHasJobIdValue = workOrderValues
      .map((item) => item.jobId)
      .some((item) => !!item);
    const isHasVendorIdValue = workOrderValues
      ?.map((item) => item.vendorId)
      .some((item) => !!item);
    if (!jobIdControl.value) {
      if (isHasJobIdValue) {
        this.isDisabledJobField = true;
      } else {
        this.isDisabledJobField = false;
      }
    }
    if (!vendorIdControl.value) {
      if (isHasVendorIdValue) {
        this.isDisabledVendorField = true;
      }
      if (!isHasVendorIdValue) {
        this.isDisabledVendorField = false;
      }
    }
  }

  customSearchFn(term: string, item) {
    const valueSearch = item.firstName?.trim() + ' ' + item.lastName?.trim();
    const searchByName =
      valueSearch.toLowerCase().indexOf(term.trim().toLowerCase()) > -1;
    return searchByName;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
