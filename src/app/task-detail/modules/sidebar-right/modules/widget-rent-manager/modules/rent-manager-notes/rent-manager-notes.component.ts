import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { TaskService } from '@services/task.service';
import { ERentManagerNotesPopup } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/enums/rent-manager-notes.enum';
import { RentManagerNotesFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/services/rent-manager-notes-form.service';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { IInputToGetListExistingNote } from './interfaces/rent-manager-notes.interface';
import { PropertiesService } from '@services/properties.service';
import { IPersonalInTab } from '@shared/types/user.interface';
import { RentManagerNoteApiService } from './services/rent-manager-note-api.service';
import { RentManagerNotesService } from './services/rent-manager-notes.service';
import { PopupManagementService } from './services/popup-management.service';
@Component({
  selector: 'rent-manager-notes',
  templateUrl: './rent-manager-notes.component.html',
  styleUrls: ['./rent-manager-notes.component.scss']
})
export class RentManagerNotesComponent implements OnInit, OnDestroy {
  constructor(
    private widgetRMService: WidgetRMService,
    private popupManagementService: PopupManagementService,
    private rentManagerNotesFormService: RentManagerNotesFormService,
    private rentManagerNotesApiService: RentManagerNoteApiService,
    private taskService: TaskService,
    private rentManagerNotesService: RentManagerNotesService,
    private propertyService: PropertiesService
  ) {}

  private destroy$ = new Subject<void>();
  public ERentManagerNotesPopup = ERentManagerNotesPopup;
  public currentPopup: ERentManagerNotesPopup;
  public optionPopup = {};
  public showBackBtn: boolean = false;
  public entityData = {} as IPersonalInTab;
  ngOnInit(): void {
    this.popupManagementService.setCurrentPopup(
      this.rentManagerNotesFormService.isEditing
        ? ERentManagerNotesPopup.SYNC_NOTES
        : ERentManagerNotesPopup.SELECT_NOTES
    );

    this.subscribeCurrentPopup();
    this.getEntityData();
  }

  private subscribeCurrentPopup() {
    this.popupManagementService.currentPopup$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.currentPopup = res;
        if (!res) {
          // handle destroy RentManagerNotesComponent after all popups closed
          this.widgetRMService.setPopupWidgetState(null);
          this.popupManagementService.setCurrentPopup(
            ERentManagerNotesPopup.SELECT_NOTES
          );
        }
      });
  }

  getEntityData() {
    this.propertyService.peopleList$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        switchMap((res) => {
          if (res) {
            this.rentManagerNotesService.setEntityDataBS(res);
            let input = {
              taskId: this.taskService.currentTaskId$?.value,
              propertyId: this.propertyService.currentPropertyId?.value,
              tenantIds: res.tenancies.map((i) => i.id),
              ownerIds: res.ownerships.map((i) => i.id)
            } as IInputToGetListExistingNote;
            return this.rentManagerNotesApiService.getListNoteExisting(input);
          }
          return [];
        })
      )
      .subscribe((res) => {
        if (res) {
          this.rentManagerNotesService.setListExistedNotesBS(res);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.rentManagerNotesFormService.clear();
    this.rentManagerNotesService.clear();
  }
}
