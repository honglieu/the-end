import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { Subject } from 'rxjs';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { IFile } from '@shared/types/file.interface';
import { SharedService } from '@services/shared.service';
import { PopupState } from '@services/popup.service';
@Component({
  selector: 'send-quote-landlord',
  templateUrl: './send-quote-landlord.component.html',
  styleUrls: ['./send-quote-landlord.component.scss']
})
export class SendQuoteLandlordComponent implements OnInit, OnChanges {
  @Input() isBack = false;
  @Input() show = false;
  @Input() conversationId: string;
  @Input() listQuoteSupplier = [];
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() isOpenFile = new EventEmitter<boolean>();
  @Output() isOpenSendMessageModal = new EventEmitter<PopupState>();
  @Output() listSelected = new EventEmitter<any>();
  public selectedFiles: IFile[] = [];
  public checked = false;
  public isShowAddFilesModal = false;
  public popupModalPosition = ModalPopupPosition;
  public countCheckBox = 0;
  listItemSupplier = [];

  private subscriber = new Subject<void>();
  constructor(public shareService: SharedService) {}

  ngOnChanges(changes: SimpleChanges): void {}

  ngOnInit(): void {}
  isChecked(id) {
    const itemChecked = this.listQuoteSupplier.find((item) => item.id === id);
    return itemChecked ? itemChecked.checked : false;
  }

  onCheckboxChange(id) {
    this.listQuoteSupplier.forEach((item) => {
      if (item.id === id) {
        item.checked = !item.checked;
        if (item.checked) {
          this.countCheckBox++;
        } else {
          this.countCheckBox--;
        }
      }
    });
  }

  isOpenModal(status: boolean) {
    this.countCheckBox = 0;
    this.isCloseModal.next(status);
    // this.listQuoteSupplier.map(item => item.checked = false);
  }

  openSendMessageModal(status: boolean) {
    const listSupplierSelected = this.listQuoteSupplier.filter(
      (item) => item.checked
    );
    this.listSelected.next(listSupplierSelected);
    this.shareService.isStatusStepQuote$.next(true);
    this.isOpenSendMessageModal.next({
      display: status,
      resetField: true
    });
    // this.listQuoteSupplier.map(item => item.checked = false);
    this.countCheckBox = 0;
  }

  public openFile(status) {
    // this.isShowAddFilesModal = true;
    this.isOpenFile.next(status);
    this.shareService.isStatusStepQuote$.next(false);
  }
  showQuitConfirm(status: boolean) {
    if (status) {
      // this.isShowSendMessageModal = false;
      this.isShowAddFilesModal = false;
      // this.isShowQuitConfirm = true;
    } else {
      // this.isShowQuitConfirm = false;
      // this.isShowSendMessageModal = false;
      this.isShowAddFilesModal = false;
      // this.isShowSuccessInviteModal = false;
    }
  }

  showAppSendMessage(status: PopupState) {
    if (status.display) {
      // this.isShowSendMessageModal = true;
      // this.isResetModal = false;
      // this.isShowQuitConfirm = false;
      this.isShowAddFilesModal = false;
    } else {
      // this.resetInputForSendMessage();
      // this.isShowSendMessageModal = false;
    }
  }
  ngOnDestroy() {
    this.subscriber.next();
    this.subscriber.complete();
  }
}
