import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { TenantVacateFormService } from '@/app/tenant-vacate/services/tenant-vacate-form.service';
import { ILeaveNoticeDetail } from '@/app/tenant-vacate/utils/tenantVacateType';
import { UserService } from '@services/user.service';
import { SHORT_ISO_DATE } from '@services/constants';
import dayjs from 'dayjs';

@Component({
  selector: 'app-leave-notice-detail-popup',
  templateUrl: './leave-notice-detail-popup.component.html',
  styleUrls: ['./leave-notice-detail-popup.component.scss']
})
export class LeaveNoticeDetailPopupComponent implements OnInit {
  @Input() modalId: string;
  @Input() isShowLeaveNoticeDetail: boolean = false;
  @Output() getLeaveNoticeDetail = new EventEmitter();
  @Output() closePopup = new EventEmitter();
  @Output() onCancel = new EventEmitter();
  @Input() hasBackButton: boolean = false;
  @Input() titleHeader: string;
  @Input() isRequired: boolean = true;

  public noticeDetailForm: FormGroup;
  public startLeaseDate: string = '';
  public startLeaseDateString: string = '';
  public invalidLeaveNoticeDetail: boolean = false;
  public dataFormChanged: ILeaveNoticeDetail;
  public invalidBeforeDate: boolean = false;

  // enum
  ModalPopupPosition = ModalPopupPosition;

  // Form
  get leaveNoticeDetailForm() {
    return this.tenantVacateFormService?.noticeDetailForm;
  }

  get notice(): AbstractControl {
    return this.leaveNoticeDetailForm?.get('notice');
  }

  get beforeDate(): AbstractControl {
    return this.leaveNoticeDetailForm?.get('beforeDate');
  }

  constructor(
    public tenantVacateFormService: TenantVacateFormService,
    public userService: UserService
  ) {}

  get inValidForm() {
    return this.invalidBeforeDate;
  }

  ngOnInit(): void {
    this.tenantVacateFormService.buildFormLeaveNoticeDetail();
    if (!this.isRequired) {
      this.notice.clearValidators();
      this.notice.updateValueAndValidity();
      this.beforeDate.clearValidators();
      this.beforeDate.updateValueAndValidity();
    }
  }

  getDataForm() {
    if (this.inValidForm) {
      return null;
    } else {
      return this.leaveNoticeDetailForm.getRawValue();
    }
  }

  handleDate(date) {
    this.invalidBeforeDate;
  }

  handleConfirm() {
    if (this.leaveNoticeDetailForm.invalid) {
      this.leaveNoticeDetailForm.markAllAsTouched();
      return;
    }
    this.getLeaveNoticeDetail.emit({
      ...this.getDataForm(),
      beforeDate: this.getDataForm()?.beforeDate
        ? dayjs(this.getDataForm()?.beforeDate).format(SHORT_ISO_DATE)
        : ''
    });
  }

  handleCancel() {
    this.onCancel.emit();
  }

  handleClose() {
    this.closePopup.emit();
    this.leaveNoticeDetailForm.reset();
  }

  triggerInputTouched(event: boolean, field: string) {
    if (!event) {
      this[field].markAsTouched();
    }
  }
}
