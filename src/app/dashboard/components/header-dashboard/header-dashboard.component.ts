import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { Subject, takeUntil, filter } from 'rxjs';
import { CompanyService } from '@services/company.service';
import { ICompany } from '@shared/types/company.interface';

@Component({
  selector: 'header-dashboard',
  templateUrl: './header-dashboard.component.html',
  styleUrls: ['./header-dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderDashboardComponent implements OnInit {
  private destroy$ = new Subject();
  public currentCompanyId: string;
  public currentCompany: ICompany;
  constructor(
    private cdRef: ChangeDetectorRef,

    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.companyService
      .getCurrentCompany()
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => Boolean(res))
      )
      .subscribe((res) => {
        this.currentCompanyId = res?.id;
        this.currentCompany = res;
        this.cdRef.detectChanges();
      });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
