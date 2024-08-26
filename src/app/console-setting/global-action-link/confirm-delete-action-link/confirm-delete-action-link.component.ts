import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { conversations } from 'src/environments/environment';
import { ActionLinkService } from '@services/action-link.service';
import { ApiService } from '@services/api.service';
import { PopupService } from '@services/popup.service';

@Component({
  selector: 'app-confirm-delete-action-link',
  templateUrl: './confirm-delete-action-link.component.html',
  styleUrls: ['./confirm-delete-action-link.component.scss']
})
export class ConfirmDeleteActionLinkComponent implements OnInit {
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() isDeleteSuccessModal = new EventEmitter<boolean>();

  public returnToFile: boolean;
  public returnToActionLink: boolean;
  public returnToMessage: boolean;

  private selectedActionLink: any;

  constructor(
    private popupService: PopupService,
    private actionLinkService: ActionLinkService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.actionLinkService.globalActionLink.subscribe((res) => {
      if (res) {
        this.selectedActionLink = res;
      }
    });
    this.popupService.getFromMessageModal().subscribe((res) => {
      if (res) {
        this.returnToMessage = true;
        this.returnToActionLink = false;
        this.returnToFile = false;
      }
    });
    this.popupService.getFromActionLinkModal().subscribe((res) => {
      if (res) {
        this.returnToActionLink = true;
        this.returnToFile = false;
        this.returnToMessage = false;
      }
    });
    this.popupService.getFromFileModal().subscribe((res) => {
      if (res) {
        this.returnToFile = true;
        this.returnToActionLink = false;
        this.returnToMessage = false;
      }
    });
  }

  public isShowDeleteSuccessModal(status) {
    const actionLinks = [];
    actionLinks.push(this.selectedActionLink.id);
    const body = {
      actionLinks
    };
    this.apiService
      .deleteAPI(conversations, 'action-link/', body)
      .subscribe((res) => {
        if (res?.message === 'Successfully deleted') {
          this.isDeleteSuccessModal.next(status);
        }
      });
  }

  public isOpenModal(status) {
    if (!status) {
      this.isCloseModal.next(status);
    }
  }
}
