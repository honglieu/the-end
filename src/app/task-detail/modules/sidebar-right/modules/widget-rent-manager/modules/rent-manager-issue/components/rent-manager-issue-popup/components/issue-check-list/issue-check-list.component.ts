import { Component, OnInit } from '@angular/core';

import { RentManagerIssueFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-form.service';
import { FormArray, FormBuilder, Validators } from '@angular/forms';
import { ERentManagerIssueCheckListStatus } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { Subject } from 'rxjs';

@Component({
  selector: 'issue-check-list',
  templateUrl: './issue-check-list.component.html',
  styleUrls: ['./issue-check-list.component.scss']
})
export class IssueCheckListComponent implements OnInit {
  constructor(
    private rentManagerFormService: RentManagerIssueFormService,
    private fb: FormBuilder,
    private rentManagerIssueFormService: RentManagerIssueFormService
  ) {}
  private unsubscribe = new Subject<void>();
  get isSubmittedRentIssueForm() {
    return this.rentManagerIssueFormService.isSubmittedRentIssueForm;
  }
  ngOnInit(): void {}
  ERentManagerIssueStatus = ERentManagerIssueCheckListStatus;

  get form() {
    return this.rentManagerFormService.form;
  }

  get checklistFormControl(): FormArray {
    return this.rentManagerFormService.form.get('checklist') as FormArray;
  }

  public get isDisabled() {
    return this.rentManagerFormService.disabled;
  }

  addRow(): void {
    if (this.isDisabled) return;
    const checklistControl = this.fb.group({
      description: ['', Validators.required],
      status: [false]
    });

    this.checklistFormControl.push(checklistControl);
  }

  isDisabledDeleteRow(index: number): boolean {
    return !!this.checklistFormControl.at(index)?.value?.externalId;
  }

  deleteRow(index: number): void {
    if (this.isDisabled || this.isDisabledDeleteRow(index)) return;
    this.checklistFormControl.removeAt(index);
  }
  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
