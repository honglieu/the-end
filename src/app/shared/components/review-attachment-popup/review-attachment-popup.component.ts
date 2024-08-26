import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { AgencyService } from '@services/agency.service';
import { ReiFormService } from '@services/rei-form.service';
import { TaskService } from '@services/task.service';
import { ReiFormData, ReiFormLink } from '@shared/types/rei-form.interface';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { FilesService } from '@services/files.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

@Component({
  selector: 'review-attachment-popup',
  templateUrl: './review-attachment-popup.component.html',
  styleUrls: ['./review-attachment-popup.component.scss']
})
export class ReviewAttachmentPopupComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() isResizableModal: boolean = false;
  @Input() modalId: string;
  @Input() showReviewAttachPopup: boolean = false;
  @Input() showAttachDaftFormPopup: boolean = false;
  @Input() isHideBottomWrapper: boolean = false;
  @Input() isEnableClickClickOutside: boolean = false;
  @Input() reiFormLink: ReiFormLink;
  @Input() isStep: boolean = false;
  @Input() currentTaskId: string;
  @Output() onHandleBack = new EventEmitter();
  @Output() onHandleBackDraftForm = new EventEmitter();
  @Output() onHandleContinue = new EventEmitter<ReiFormData>();
  @Output() onHandleContinueDraftForm = new EventEmitter();
  @Output() onHandleClickOutside = new EventEmitter();
  @Output() onHandleClose = new EventEmitter();
  @Output() closeAndResetAllPopup = new EventEmitter();
  popupModalPosition = ModalPopupPosition;
  url: SafeResourceUrl;
  isFullyLoaded: boolean = false;
  reiFormStatus = '';
  public isEdit = false;
  public inputControl = new FormControl('', [Validators.required]);
  public reiFormGroup = new FormGroup({
    inputControl: this.inputControl
  });
  isArchiveMailbox: boolean;

  private unsubscribe = new Subject<void>();

  constructor(
    public sanitizer: DomSanitizer,
    private reiFormService: ReiFormService,
    private agencyService: AgencyService,
    private taskService: TaskService,
    private filesService: FilesService,
    private trudiSendMsgService: TrudiSendMsgService,
    private trudiDynamicParamater: TrudiDynamicParameterService,
    private inboxService: InboxService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  get popupState() {
    return this.trudiSendMsgService.getPopupState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reiFormLink']?.currentValue) {
      this.url = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.reiFormLink?.formInline || ''
      );
    }
    this.updateReiFormStatus();
  }

  ngOnInit(): void {
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  updateReiFormStatus() {
    const status = this.reiFormLink?.formDetail?.status;
    const updatedDate = this.reiFormLink?.formDetail?.updated;
    this.inputControl.setValue(this.reiFormLink?.formDetail.name);
    if (status?.length && updatedDate)
      this.reiFormStatus =
        status +
        ' • ' +
        'Last updated: ' +
        this.agencyDateFormatService.formatTimezoneDate(
          updatedDate,
          this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS
        );
  }

  onLoad() {
    this.isFullyLoaded = true;
  }

  get input() {
    return this.reiFormGroup.get('inputControl');
  }

  handleCloseModal() {
    this.onHandleClose.emit();
    this.closeAndResetAllPopup.emit();
    this.isFullyLoaded = false;
    this.reiFormService.currentReiFormData$.next(null);
    this.trudiSendMsgService.resetCheckBox();
  }

  handleOpenNewTab() {
    window.open(this.reiFormLink?.formLive, '_blank');
  }

  handleRefresh() {
    this.reiFormService
      .createLinkReiForm(this.reiFormLink?.formDetail?.id.toString())
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.reiFormLink = res;
          this.isFullyLoaded = false;
          this.url = this.sanitizer.bypassSecurityTrustResourceUrl(
            this.reiFormLink?.formInline
          );
          this.updateReiFormStatus();
        }
      });
  }

  handleBackToReviewAttachment() {
    this.onHandleBackDraftForm.emit();
    this.isFullyLoaded = false;
    this.reiFormService.currentReiFormData$.next(null);
  }

  handleBack() {
    this.onHandleBack.emit();
    this.isFullyLoaded = false;
    this.reiFormService.currentReiFormData$.next(null);
    this.isEdit = false;
  }

  handleConfirm() {
    if (this.isArchiveMailbox) return;
    this.isFullyLoaded = false;
    this.reiFormService
      .createLinkReiForm(
        this.reiFormLink?.formDetail?.id.toString(),
        this.currentTaskId
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((reiFormLink) => {
        if (reiFormLink) {
          this.isEdit = false;
          this.reiFormLink = reiFormLink;
          this.updateReiFormStatus();
          this.reiFormService.setReiFormLink(reiFormLink, this.popupState);
          if (this.reiFormLink?.formDetail?.status === 'Draft') {
            this.onHandleContinueDraftForm.emit();
          } else {
            this.handleOpenSendMessage();
          }
        }
      });
  }

  handleOpenSendMessage() {
    this.isFullyLoaded = false;
    this.confirmCreateLinkReiForm(
      this.currentTaskId || this.taskService.currentTaskId$.value
    );
    this.reiFormService
      .uploadReiFormData(this.reiFormLink.formDetail.id)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          if (!this.trudiSendMsgService.getPopupState().addReiForm) {
            const { formFileInfo, formDetail } = res;
            const formatCurrentReiFormData = [
              {
                ...res,
                formDetail: {
                  ...formDetail,
                  formFiles: formDetail?.formFiles.map((x) => ({
                    ...x,
                    fileIcon: this.filesService.getFileIcon(x.filename),
                    shortName: x.filename.split('.')[0]
                  }))
                },
                formFileInfo: {
                  ...formFileInfo,
                  fileIcon: this.filesService.getFileIcon(
                    formFileInfo.fileName
                  ),
                  shortName: formFileInfo.fileName.split('.')[0]
                }
              }
            ];
            this.trudiSendMsgService.setListFilesReiFormSignRemote(
              formatCurrentReiFormData
            );
          }
          this.reiFormService.currentReiFormData$.next(res);
          //To hide closeable file icon in message modal when attached from "REI form" modal
          res.formFileInfo['isHideRemoveIcon'] = true;
          this.onHandleContinue.emit(res);
        }
      });
  }

  confirmCreateLinkReiForm(taskId: string) {
    if (this.popupState.addReiFormWidget) {
      const formIdsArr =
        this.reiFormService.createReiFormLink$.value.inPopup.map((value) =>
          value.formDetail.id.toString()
        );
      const formIds = [...new Set(formIdsArr)];
      this.reiFormService
        .confirmCreateLinkReiForm(formIds, taskId)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((reiFormLinks) => {
          if (reiFormLinks) {
            this.reiFormService.clearReiFormLinkPopUp();
            reiFormLinks.forEach((reiFormLink) => {
              if (reiFormLink.formDetail.isCompleted) {
                this.filesService.reloadAttachments.next(true);
              }
            });
          }
        });
      this.trudiSendMsgService.resetCheckBox();
      this.trudiSendMsgService.setPopupState({
        addReiFormWidget: false
      });
    }
  }

  handleClickOutSide() {
    if (this.isEnableClickClickOutside) {
      this.onHandleClickOutside.emit();
    }
  }

  confirmUpdate() {
    if (this.inputControl.valid) {
      const name = this.inputControl.value;
      this.reiFormService
        .updateReiformName(
          name,
          this.taskService.currentTask$?.value?.agencyId,
          this.reiFormLink.formDetail.id,
          this.taskService.currentTaskId$.value || this.currentTaskId
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((rs) => {
          this.isEdit = false;
          this.reiFormLink.formDetail = rs;
          this.reiFormService.updateReiFormData$.next(rs);
        });
    }
    return;
  }

  onEdit() {
    this.isEdit = true;
    setTimeout(() => {
      const inputElem = document.getElementById('editName') as HTMLInputElement;
      inputElem?.focus();
    }, 100);
  }

  onCancel() {
    this.isEdit = false;
    this.inputControl.markAsUntouched();
    this.inputControl.reset();
    this.inputControl.setValue(this.reiFormLink.formDetail.name);
  }
}
