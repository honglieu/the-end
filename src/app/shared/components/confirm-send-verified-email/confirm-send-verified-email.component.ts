import {
  Component,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
  Input
} from '@angular/core';
import { Subject } from 'rxjs';
import { LoadingService } from '@services/loading.service';
import { UserService } from '@services/user.service';

declare const loader: any;

@Component({
  selector: 'app-confirm-send-verified-email',
  templateUrl: './confirm-send-verified-email.component.html',
  styleUrls: ['./confirm-send-verified-email.component.scss']
})
export class ConfirmSendVerifiedEmailComponent implements OnInit, OnDestroy {
  @Input() email: string;
  @Input() userId: string;
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() isSuccessfullySendVerified = new EventEmitter<boolean>();
  private unsubscribe = new Subject<void>();

  constructor(
    private userService: UserService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {}

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  public closeModal(status) {
    this.isCloseModal.emit(status);
  }

  public send() {
    if (!this.userId) {
      return;
    }
    this.loadingService.onLoading();
    this.userService.sendVerifiedChangeEmail(this.userId).subscribe(
      (res) => {
        this.loadingService.stopLoading();
        if (res && res.message) {
          this.isSuccessfullySendVerified.emit(true);
        }
      },
      (err) => this.loadingService.stopLoading()
    );
  }
}
