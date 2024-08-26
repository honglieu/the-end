import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PopupService, PopupState } from '@services/popup.service';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';

export enum QuitConfirmOpenFrom {
  sendMaintenance = 'SendMaintenance',
  deleteTask = 'DeleteTask',
  messageModal = 'MessageModal',
  actionLinkModal = 'ActionLinkModal',
  fileModal = 'FileModal',
  deleteEmail = 'DeleteEmail',
  deletePhone = 'DeletePhone',
  normal = 'normal'
}
@Component({
  selector: 'app-quit-confirm',
  templateUrl: './quit-confirm.component.html',
  styleUrls: ['./quit-confirm.component.scss']
})
export class QuitConfirmComponent implements OnInit {
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() isBackMaintenance = new EventEmitter<{
    close: boolean;
    confirmQuit: boolean;
  }>();
  @Output() isOpenSendMessageModal = new EventEmitter<PopupState>();
  @Output() isOpenFileModal = new EventEmitter<boolean>();
  @Output() isOpenActionLinkModal = new EventEmitter<PopupState | boolean>();
  @Output() delete = new EventEmitter<boolean>();
  @Output() targetOpenForm = new EventEmitter<QuitConfirmOpenFrom>();
  @Input() openFrom: QuitConfirmOpenFrom;
  @Input() disable: boolean = false;
  private unsubscribe = new Subject<void>();
  public quitConfirmOpenFrom = QuitConfirmOpenFrom;
  public rightBtnText = 'Yes, cancel';
  public leftBtnText = 'Go Back';
  public cannotText = '';
  public sureText = '';

  constructor(
    public popupService: PopupService,
    private phoneNumberFormatPipe: PhoneNumberFormatPipe
  ) {}

  ngOnInit() {
    this.popupService.isResetFile$.next(true);
    this.popupService
      .getFromMessageModal()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.setPopUpContent(
            QuitConfirmOpenFrom.messageModal,
            'Go Back',
            'Yes, cancel'
          );
        }
      });
    this.popupService
      .getFromActionLinkModal()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.setPopUpContent(
            QuitConfirmOpenFrom.actionLinkModal,
            'Go Back',
            'Yes, cancel'
          );
        }
      });
    this.popupService
      .getFromFileModal()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.setPopUpContent(
            QuitConfirmOpenFrom.fileModal,
            'Go Back',
            'Yes, cancel'
          );
        }
      });
    this.popupService
      .getFromQuitMaintenance()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.setPopUpContent(
            QuitConfirmOpenFrom.sendMaintenance,
            'Keep the job',
            'Yes, cancel'
          );
        }
      });
    this.popupService.fromDeleteTask
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res && res.display) {
          this.setPopUpContent(
            QuitConfirmOpenFrom.deleteTask,
            'Cancel',
            'Delete'
          );
          if (res.isFromCompletedSection) {
            this.cannotText = '';
          } else {
            this.cannotText =
              'All open conversations will be marked as resolved.';
          }
          this.cannotText = res.isFromTrudiTab ? '' : this.cannotText;
        }
      });
    this.popupService.fromDeleteEmail
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.setPopUpContent(
            QuitConfirmOpenFrom.deleteEmail,
            'Cancel',
            'Delete'
          );
          this.sureText = `Are you sure you want to delete the email ${res}?`;
        }
      });
    this.popupService.fromDeletePhone
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.setPopUpContent(
            QuitConfirmOpenFrom.deletePhone,
            'Cancel',
            'Delete'
          );
          this.sureText = `Are you sure you want to delete the phone ${this.phoneNumberFormatPipe.transform(
            res
          )}?`;
        }
      });
    this.popupService.defaultQuitPopup
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res && Object.keys(res).length) {
          this.setPopUpContent(
            QuitConfirmOpenFrom.normal,
            res.leftBtnText,
            res.rightBtnText
          );
          this.sureText = res.sureText;
          this.cannotText = res.cannotText;
        }
      });
  }

  setPopUpContent(
    openFrom: QuitConfirmOpenFrom,
    leftBtnText: string,
    rightBtnText: string
  ) {
    this.openFrom = openFrom;
    this.leftBtnText = leftBtnText;
    this.rightBtnText = rightBtnText;
    this.targetOpenForm.next(openFrom);
  }

  public isOpenModal(status) {
    this.popupService.selectPeople$.next(false);
    if (!status) {
      this.isCloseModal.next(status);
    }
  }

  showAppMaintenance(status) {
    this.isBackMaintenance.next(status);
  }

  showAppSendMessage(status: boolean) {
    this.isOpenSendMessageModal.next({
      display: status,
      resetField: false
    });
  }

  showAppSendMaintenance(status: boolean) {
    this.isOpenSendMessageModal.next({
      display: status,
      resetField: false
    });
  }

  showAppFile(status: boolean) {
    this.isOpenFileModal.next(status);
  }

  showAppActionLink(status: boolean) {
    this.isOpenActionLinkModal.next({
      display: status,
      resetField: false
    });
  }

  leftBtnClick() {
    switch (this.openFrom) {
      case QuitConfirmOpenFrom.actionLinkModal:
        this.showAppActionLink(true);
        break;
      case QuitConfirmOpenFrom.fileModal:
        this.showAppFile(true);
        break;
      case QuitConfirmOpenFrom.messageModal:
        this.showAppSendMessage(true);
        break;
      case QuitConfirmOpenFrom.sendMaintenance:
        this.showAppMaintenance(false);
        break;
      case QuitConfirmOpenFrom.deleteTask:
        this.isOpenModal(false);
        break;
      case QuitConfirmOpenFrom.deleteEmail:
        this.isOpenModal(false);
        break;
      case QuitConfirmOpenFrom.deletePhone:
        this.isOpenModal(false);
        break;
      case QuitConfirmOpenFrom.normal:
        this.isOpenModal(false);
        break;
    }
    this.setNullAllPopupService();
  }

  rightBtnClick() {
    if (
      [
        QuitConfirmOpenFrom.deleteTask,
        QuitConfirmOpenFrom.deleteEmail,
        QuitConfirmOpenFrom.deletePhone,
        QuitConfirmOpenFrom.normal
      ].includes(this.openFrom)
    ) {
      this.delete.next(true);
    }
    this.isOpenModal(false);
    this.setNullAllPopupService();
    this.popupService.sendMessageData.next(null);
  }

  setNullAllPopupService() {
    this.popupService.setFromMessageModal(false);
    this.popupService.setFromActionLinkModal(false);
    this.popupService.setFromFileModal(false);
    this.popupService.setQuitSendMain(false);
    this.popupService.fromDeleteTask.next(null);
    this.popupService.fromDeleteEmail.next(null);
    this.popupService.fromDeletePhone.next(null);
    this.popupService.defaultQuitPopup.next(null);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
