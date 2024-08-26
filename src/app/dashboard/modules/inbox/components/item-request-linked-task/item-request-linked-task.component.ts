import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { stringFormat } from '@/app/core';
import { AppRoute } from '@/app/app.route';
import { IActionLinkedTaskHistory } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { NavigatorService } from '@/app/services/navigator.service';
import { TaskType } from '@/app/shared';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';

enum typeLink {
  Unlink = 'UNLINK',
  Link = 'LINK'
}

@Component({
  selector: 'item-request-linked-task',
  templateUrl: './item-request-linked-task.component.html',
  styleUrls: ['./item-request-linked-task.component.scss'],
  standalone: true
})
export class ItemRequestLinkedTaskComponent {
  @Input() linkedData: IActionLinkedTaskHistory;
  public typeLinkItems = typeLink;
  constructor(
    private router: Router,
    private showSidebarRightService: ShowSidebarRightService,
    private navigatorService: NavigatorService
  ) {}

  handleNavigateTask() {
    this.showSidebarRightService.handleToggleSidebarRight(true);
    this.navigatorService.setReturnUrl(this.router.url);
    this.router.navigate(
      [stringFormat(AppRoute.TASK_DETAIL, this.linkedData.taskId)],
      {
        replaceUrl: true,
        queryParams: {
          type: TaskType.TASK,
          keepReturnUrl: true
        }
      }
    );
  }
}
