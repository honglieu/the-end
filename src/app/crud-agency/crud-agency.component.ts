import { Component, OnInit } from '@angular/core';
import { LoaderService } from '@services/loader.service';
import { AgencyService } from '@services/agency.service';
import { CrudAgency } from '@shared/types/agency.interface';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-crud-agency',
  templateUrl: './crud-agency.component.html',
  styleUrls: ['./crud-agency.component.scss']
})
export class CrudAgencyComponent implements OnInit {
  public agencies!: CrudAgency[];
  public indexAgency: number = 0;
  private unsubscribe = new Subject<void>();

  constructor(
    private loaderService: LoaderService,
    private agencyService: AgencyService
  ) {}

  ngOnInit(): void {
    this.loaderService.removeLoadingLayer();
    this.agencyService
      .getListCrudAgencies()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.agencyService.agenciesCrudList.next(data);
      });
    this.agencyService.agenciesCrudList.subscribe((data) => {
      this.agencies = data;
    });
  }

  changeAgency(index: number) {
    this.indexAgency = index;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
