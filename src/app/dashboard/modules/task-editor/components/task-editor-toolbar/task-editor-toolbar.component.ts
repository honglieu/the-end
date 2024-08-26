import { Component, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Toolbar } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { transition, trigger, useAnimation } from '@angular/animations';
import { openMenu } from '@/app/dashboard/animation/triggerToolbarAnimation';
import { closeMenu } from '@/app/dashboard/animation/triggerMenuAnimation';
import { TaskEditorListViewService } from '@/app/dashboard/modules/task-editor/modules/task-template-list-view/services/task-editor-list-view.service';
import { EActionShowMessageToolbar } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { SharedService } from '@services/shared.service';

@Component({
  selector: 'task-editor-toolbar',
  templateUrl: './task-editor-toolbar.component.html',
  styleUrls: ['./task-editor-toolbar.component.scss'],
  animations: [
    trigger('toolbarAnimation', [
      transition(':enter', [useAnimation(openMenu)]),
      transition(':leave', [useAnimation(closeMenu)])
    ])
  ]
})
export class TaskEditorToolbarComponent implements OnInit {
  public toolbars: Toolbar[] = [];
  public visible!: boolean;
  public actionShowMessageToolbar = EActionShowMessageToolbar;
  public isConsole: boolean;

  private destroy$ = new Subject();

  constructor(
    public taskEditorListViewService: TaskEditorListViewService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.taskEditorListViewService.listToolbarConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: Toolbar[]) => {
        this.toolbars = [...data] || [];
        this.visible = !!data.length;
      });
  }
}
