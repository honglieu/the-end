import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  Validators
} from '@angular/forms';
import { RentManagerIssueFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-form.service';
import { RentManagerIssueService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue.service';
import { Subject, takeUntil } from 'rxjs';
import { IRentManagerHistoryCategories } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { HISTORY_NOTES_FILE_VALID_TYPE } from '@services/constants';
import { FilesService } from '@services/files.service';
import { filterOutUnwantedKeys } from '@shared/feature/function.feature';
import { ERentManagerHistoryCategoryType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';

@Component({
  selector: 'issue-history-notes',
  templateUrl: './issue-history-notes.component.html',
  styleUrls: ['./issue-history-notes.component.scss']
})
export class IssueHistoryNotesComponent implements OnInit {
  constructor(
    private rentManagerIssueFormService: RentManagerIssueFormService,
    private fb: FormBuilder,
    private rentManagerIssueService: RentManagerIssueService,
    private filesService: FilesService
  ) {}
  get form() {
    return this.rentManagerIssueFormService.form;
  }
  public get historyNotesFormControls(): FormArray {
    return this.form.get('historyNotes') as FormArray;
  }
  public listHistoryNoteCategories: IRentManagerHistoryCategories[];
  public get isDisabled() {
    return this.rentManagerIssueFormService.disabled;
  }
  public dropdownPosition = {};
  public appendTo: string = null;
  public historyNotesValidType = HISTORY_NOTES_FILE_VALID_TYPE;
  public scrollControl = null;
  public isScrollAdded = false;
  private unsubscribe = new Subject<void>();
  get isSubmittedRentIssueForm() {
    return this.rentManagerIssueFormService.isSubmittedRentIssueForm;
  }
  ngOnInit(): void {
    this.rentManagerIssueService.rmIssueData$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.listHistoryNoteCategories = res.historyNoteCategories?.filter(
          (e) => e?.types.includes(ERentManagerHistoryCategoryType.ALL)
        );
      });
  }
  isOpened() {
    document.querySelectorAll('.issue-history-notes').forEach((item, index) => {
      this.dropdownPosition[index] = this.getDropdownDirection(item, index);
    });
  }
  ngAfterViewInit(): void {
    this.handleScroll();
  }
  handleScroll() {
    const viewportTable = document
      .querySelector('.trudi-table-body')
      ?.getBoundingClientRect();
    if (!viewportTable) return null;
    let shouldShowScroll = viewportTable.height >= window.innerHeight - 600;
    if (shouldShowScroll) {
      this.isScrollAdded = true;
      this.scrollControl = { y: 'calc(100vh - 515px)' };
      this.appendTo = '.ant-table-body';
    } else {
      this.appendTo = '';
      this.isScrollAdded = false;
      this.scrollControl = null;
    }
  }

  getListFile(files, control: FormControl) {
    const fileControl = control.get('files') as FormArray;
    fileControl.clear();
    files.forEach((file) => {
      fileControl.push(
        this.fb.control(
          filterOutUnwantedKeys(
            {
              fileName: file.fileName,
              fileSize: file.fileSize,
              fileType: file.fileType,
              mediaLink: file.mediaLink,
              metaTag: file.metaTag || file.fileName,
              icon: file.icon,
              fileId: file.fileId || null,
              historyAttachmentId: file.historyAttachmentId || null,
              historyId: file.historyId || null
            },
            [null, undefined, NaN]
          )
        )
      );
    });
    this.handleScroll();
  }
  public getDropdownDirection(element, index) {
    const elementRect = element.getBoundingClientRect().top;
    const viewportHeight = document
      .querySelector('.trudi-table-body')
      .getBoundingClientRect();
    const parentTop = viewportHeight.top;
    const parentHeight = viewportHeight.height;
    return elementRect < parentTop + parentHeight / 2 ? 'bottom' : 'top';
  }
  addRow(): void {
    if (this.isDisabled) return;
    const historyControl = this.fb.group({
      categoryId: [null, Validators.required],
      note: [null, Validators.required],
      files: this.fb.array([])
    });
    this.handleScroll();
    this.historyNotesFormControls.push(historyControl);
  }

  isDisabledDeleteRow(index: number): boolean {
    return !!this.historyNotesFormControls.at(index)?.value?.externalId;
  }

  deleteRow(index: number): void {
    if (this.isDisabled || this.isDisabledDeleteRow(index)) return;
    this.handleScroll();
    this.historyNotesFormControls.removeAt(index);
  }
  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
