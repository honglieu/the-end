import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { UserService } from '@/app/dashboard/services/user.service';
import { TrudiUiModule } from '@trudi-ui';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { switchMap, take } from 'rxjs';

@Component({
  selector: 'add-to-task-warning',
  templateUrl: './add-to-task-warning.component.html',
  styleUrl: './add-to-task-warning.component.scss',
  standalone: true,
  imports: [CommonModule, TrudiUiModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddToTaskWarningComponent implements OnInit {
  warningTitle: string;
  description: string;
  visible: boolean = false;

  @Input() isMultipleEmail: boolean = false;
  @Output() afterClose = new EventEmitter();

  constructor(
    private dashboardApiService: DashboardApiService,
    private userSerivce: UserService
  ) {}

  ngOnInit(): void {
    this.warningTitle = `You're about to change who has permission to read ${
      this.isMultipleEmail ? 'these emails' : 'this email'
    }.`;

    this.description = `Moving ${
      this.isMultipleEmail ? 'these emails' : 'this email'
    } to a task will give all team members the ability to read the email ${
      this.isMultipleEmail ? 'threads' : 'thread'
    }.`;
  }

  onCancel() {
    this.afterClose.emit();
  }

  onOk(event) {
    const { isChecked } = event;
    if (isChecked) {
      this.dashboardApiService
        .updateOnboardingDefaultData({ showMoveMessageWarning: false })
        .pipe(switchMap(() => this.userSerivce.getUserDetail().pipe(take(1))))
        .subscribe((currentUser) => {
          this.userSerivce.setUserDetail({
            ...currentUser,
            userOnboarding: {
              ...currentUser.userOnboarding,
              showMoveMessageWarning: false
            }
          });
        });
    }
    this.afterClose.emit(true);
  }
}
