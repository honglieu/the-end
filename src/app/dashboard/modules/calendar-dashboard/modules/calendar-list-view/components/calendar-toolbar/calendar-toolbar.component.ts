import { transition, trigger, useAnimation } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  closeMenu,
  openMenu
} from '@/app/dashboard/animation/triggerToolbarAnimation';
import { IToolbar } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { Subject, takeUntil } from 'rxjs';
import { CalendarToolbarService } from '@/app/dashboard/modules/calendar-dashboard/services/calendarToolbar.service';

@Component({
  selector: 'calendar-toolbar',
  templateUrl: './calendar-toolbar.component.html',
  styleUrls: ['./calendar-toolbar.component.scss'],
  animations: [
    trigger('toolbarAnimation', [
      transition(':enter', [useAnimation(openMenu)]),
      transition(':leave', [useAnimation(closeMenu)])
    ])
  ]
})
export class CalendarToolbarComponent implements OnInit, OnDestroy {
  public toolbars: IToolbar[] = [];

  private destroy$ = new Subject<void>();

  constructor(private calendarToolbarService: CalendarToolbarService) {}

  ngOnInit(): void {
    this.calendarToolbarService.listToolbarConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: IToolbar[]) => {
        this.toolbars = [...data] || [];
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
