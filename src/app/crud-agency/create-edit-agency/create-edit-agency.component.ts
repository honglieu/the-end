import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CompanyFormService } from '@/app/crud-agency/agency-form.service';
import { AgencyService } from '@services/agency.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-create-edit-agency',
  templateUrl: './create-edit-agency.component.html',
  styleUrls: ['./create-edit-agency.component.scss']
})
export class CreateEditAgencyComponent implements OnInit, OnChanges {
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Input() isData: string;

  companyForm: FormGroup = this.companyFormService.getCompanyForm as FormGroup;
  title: string = 'Create Agency';
  private unsubscribe = new Subject<void>();

  constructor(
    private companyFormService: CompanyFormService,
    private agencyService: AgencyService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isData !== '') {
      this.title = `Edit Agency: ${this.isData}`;
    }
  }

  ngOnInit(): void {}

  isOpenModal(status) {
    if (!status) {
      this.isCloseModal.next(status);
    }
    this.companyFormService.resetForm();
  }

  saveCompany() {
    if (this.title === 'Create Agency') {
      this.agencyService
        .postSaveAgency(this.companyFormService.generateData())
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(() => {
          this.agencyService
            .getListCrudAgencies()
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((data) => {
              this.agencyService.agenciesCrudList.next(data);
            });
          this.companyFormService.resetForm();
          this.isCloseModal.next(false);
        });
    } else {
      this.agencyService
        .putSaveAgency(this.companyFormService.generateData())
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(() => {
          this.agencyService
            .getListCrudAgencies()
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((data) => {
              this.agencyService.agenciesCrudList.next(data);
            });
          this.companyFormService.resetForm();
          this.isCloseModal.next(false);
        });
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
