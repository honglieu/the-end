import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-success-modal-popup',
  templateUrl: './success-modal-popup.component.html',
  styleUrls: ['./success-modal-popup.component.scss']
})
export class SuccessModalPopupComponent implements OnDestroy {
  @Input() message: string;
  @Input() message2: string;
  @Input() title: string;
  @Input() showOk: boolean = false;
  @Input() closeOverflowAble: boolean = false;

  @Output() onOk = new EventEmitter<boolean>();
  @Output() onClose = new EventEmitter<boolean>();
  private subscribers = new Subject<void>();

  public handleOk() {
    this.onOk.next(true);
  }

  ngOnDestroy() {
    this.subscribers.next();
    this.subscribers.complete();
  }

  clickout(event: Event) {
    if (!this.closeOverflowAble) return;
    if (
      (event.target as HTMLInputElement).classList.contains('modal-popup-bk')
    ) {
      this.onClose.next(true);
    }
  }
}
