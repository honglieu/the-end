import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { users } from 'src/environments/environment';
import { ApiService } from '@services/api.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';

@Component({
  selector: 'app-send-invite',
  templateUrl: './send-app-invite.component.html',
  styleUrls: ['./send-app-invite.component.scss']
})
export class SendAppInviteComponent implements OnInit, OnDestroy {
  @Input() numberSent: number;
  @Input() listOfUser = [];
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() isOpenSuccessModal = new EventEmitter();
  @Output() isOpenQuitConfirmModal = new EventEmitter<boolean>();
  private subscribers = new Subject<void>();
  constructor(
    private apiService: ApiService,
    private toastService: ToastrService,
    private agencyService: AgencyService
  ) {}

  ngOnInit() {}

  ngOnDestroy() {
    this.subscribers.next();
    this.subscribers.complete();
  }

  public isOpenModal(status) {
    if (!status) {
      this.isCloseModal.next(status);
    }
  }

  public openQuitConfirmModal(status) {
    this.isOpenQuitConfirmModal.next(status);
  }

  public openInviteSuccessModal(status) {
    const body = {
      userProperties: []
    };
    this.listOfUser.forEach((el) => {
      body.userProperties.push({
        userId: el.userId,
        propertyId: el.propertyId
      });
    });
    this.apiService.postAPI(users, 'send-bulk-app-invite', body).subscribe();
    this.isOpenSuccessModal.next({ status: status, listUser: this.listOfUser });
    this.isCloseModal.emit(false);
  }
}
