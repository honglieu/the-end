import { Injectable } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { ILeaveNoticeDetail } from '@/app/tenant-vacate/utils/tenantVacateType';

@Injectable({
  providedIn: 'root'
})
export class TenantVacateFormService {
  public noticeDetailForm: FormGroup;
  constructor(private formBuilder: FormBuilder) {}

  buildFormLeaveNoticeDetail(customValue?: ILeaveNoticeDetail): FormGroup {
    this.noticeDetailForm = this.formBuilder.group({
      notice: new FormControl(customValue?.notice ?? '', [Validators.required]),
      beforeDate: new FormControl(customValue?.beforeDate ?? '', [
        Validators.required
      ])
    });
    return this.noticeDetailForm;
  }

  clearPopupForm() {
    this.noticeDetailForm?.reset();
  }
}
