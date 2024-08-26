import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-invite-success',
  templateUrl: './invite-success.component.html',
  styleUrls: ['./invite-success.component.scss']
})
export class InviteSuccessComponent implements OnInit, OnDestroy {
  @Input() numberSent: number;
  @Output() isCloseModal = new EventEmitter<boolean>();
  private subscribers = new Subject<void>();
  constructor() {}

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
}
