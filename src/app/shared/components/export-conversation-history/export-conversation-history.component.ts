import { UserService } from '@services/user.service';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'export-conversation-history',
  templateUrl: './export-conversation-history.component.html',
  styleUrls: ['./export-conversation-history.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExportConversationHistoryComponent implements OnInit, OnDestroy {
  @Input() visible: boolean = false;
  @Input() disableExportButton: boolean = false;
  @Output() visibleChange = new EventEmitter<void>();
  @Output() exportConversationHistory = new EventEmitter<void>();

  public pmEmail: string;
  public readonly headerTitle = 'Export conversation history?';
  public readonly okBtnText = 'Export';
  private unsubscribe$ = new Subject<void>();

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.getCurrentUserInfo();
  }

  getCurrentUserInfo() {
    this.userService.userInfo$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((userInfo) => {
        if (userInfo) {
          this.pmEmail = userInfo.email;
        }
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
