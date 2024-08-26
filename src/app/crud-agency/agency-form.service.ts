import { Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CrudAgency } from '@shared/types/agency.interface';

@Injectable({
  providedIn: 'root'
})
export class CompanyFormService {
  constructor(private fb: FormBuilder) {}

  companyForm = this.fb.group({
    syncToken: ['', Validators.required],
    primaryColor: ['', Validators.required],
    secondaryColor: ['', Validators.required],
    thirdColor: ['', Validators.required],
    splashColor: ['', Validators.required],
    companyName: ['', Validators.required],
    splashUrl: ['', Validators.required],
    trudiLogo: ['', Validators.required],
    companyLogo: ['', Validators.required]
  });

  get getCompanyForm() {
    return this.companyForm;
  }

  setCompanyForm(company: CrudAgency) {
    this.companyForm.setValue(company);
  }

  resetForm() {
    this.companyForm.reset();
  }

  generateData(): CrudAgency {
    const respond: CrudAgency = {
      syncToken: this.companyForm.value.syncToken,
      primaryColor: this.companyForm.value.primaryColor,
      secondaryColor: this.companyForm.value.secondaryColor,
      thirdColor: this.companyForm.value.thirdColor,
      splashColor: this.companyForm.value.splashColor,
      companyName: this.companyForm.value.companyName,
      splashUrl: this.companyForm.value.splashUrl,
      trudiLogo: this.companyForm.value.trudiLogo,
      companyLogo: this.companyForm.value.companyLogo
    };
    return respond;
  }
}
