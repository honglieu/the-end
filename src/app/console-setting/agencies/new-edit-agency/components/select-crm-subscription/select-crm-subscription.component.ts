import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CompanyFormService } from '@/app/console-setting/agencies/services/company-form.service';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import { Agency } from '@shared/types/agency.interface';

@Component({
  selector: 'select-crm-subscription',
  templateUrl: './select-crm-subscription.component.html',
  styleUrls: ['./select-crm-subscription.component.scss']
})
export class SelectCrmSubscriptionComponent implements OnInit, OnDestroy {
  @Input() agencyList: Agency[] = [];
  get companyFormGroup() {
    return this.companyFormService.companyForm;
  }
  get CRMSubscriptionControl() {
    return this.companyFormGroup?.get('CRMSubscription');
  }
  get crm() {
    return this.companyFormGroup?.get('CRM');
  }

  private unsubscribe = new Subject<void>();
  public isLoading: boolean = false;
  public CRMSubscriptionList: Agency[] = [];

  constructor(private companyFormService: CompanyFormService) {}

  ngOnInit(): void {
    this.subscribeSelectCrmChange();
  }

  private subscribeSelectCrmChange() {
    this.crm.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res: string) => {
        if (!res) return;
        this.CRMSubscriptionList = this.agencyList;
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
