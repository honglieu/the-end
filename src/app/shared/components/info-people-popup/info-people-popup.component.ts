import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { BehaviorSubject, Subject, filter, switchMap, takeUntil } from 'rxjs';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { ECrmSystemId } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import { LoadingService } from '@services/loading.service';
import { PropertiesService } from '@services/properties.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { IPersonalInTab, PropertyManager } from '@shared/types/user.interface';
import { WidgetNoteService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-note.service';
import { UserAgentService } from '@/app/user/services/user-agent.service';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { ERmCrmStatus } from '@shared/enum/user.enum';
import {
  combineNames,
  getFirstCharOfName
} from '@shared/feature/function.feature';
import { listPropertyNoteInterface } from '@shared/types/property.interface';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
@Component({
  selector: 'info-people-popup',
  templateUrl: './info-people-popup.component.html',
  styleUrls: ['./info-people-popup.component.scss'],
  providers: [LoadingService]
})
export class InforPeopleComponent implements OnInit {
  @ViewChild('decriptionNote') decriptionNote: ElementRef;
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() isShowModalAddNote = new EventEmitter<boolean>();
  @Output() statusProperty = new EventEmitter<boolean>();

  @Input() streetline: string;
  @Input() propertyManager: PropertyManager | PropertyManager[];
  @Input() isExpandProperty: boolean;
  @Input() propertyId: string = null;
  @Input() isShow: boolean = false;
  @Input() crmSystemId = '';

  public propertyManagerName: string = '';
  public listPropertyNote: listPropertyNoteInterface[] = [];
  public isOpenExpand: boolean = true;
  public isLoading: boolean = false;
  public isExpandMaintenance = true;
  public popupModalPosition = ModalPopupPosition;
  public isStatusSync: SyncMaintenanceType;
  public listOfUser: IPersonalInTab;
  public togglePropertyChanged = new EventEmitter<boolean>();
  public TYPE_SYNC_MAINTENANCE = SyncMaintenanceType;
  public selectedItem: string = '';
  public maintenanceNote: string = '';
  public expenditureLimit: string = '';
  public isShowStatus = false;
  public isConsole: boolean;
  private hideSyncTimeout: NodeJS.Timeout;
  private decriptionTimeout: NodeJS.Timeout;
  private propertyIdSubject = new BehaviorSubject<string>('');
  private subscribers = new Subject<void>();
  private unsubscribe = new Subject<void>();
  readonly ECrmSystemId = ECrmSystemId;
  readonly statusMap = {
    [ERmCrmStatus.RMCurrent]: 'current',
    [ERmCrmStatus.RMFuture]: 'future',
    [ERmCrmStatus.RMPast]: 'past'
  };
  isArchiveMailbox: boolean;
  public descriptionInitial = '';

  constructor(
    public userService: UserService,
    public taskService: TaskService,
    public loadingService: LoadingService,
    private inboxService: InboxService,
    private propertyService: PropertiesService,
    private sharedService: SharedService,
    private widgetNoteservice: WidgetNoteService,
    private userAgentService: UserAgentService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
    this.getMaintenanceNote();
    this.getListPropertyNote();
    this.getListUserProperty();
    this.userAgentService.getListNoteOfUser$
      .pipe(
        takeUntil(this.unsubscribe),
        filter((notes) => !!notes)
      )
      .subscribe((notes) => {
        this.listPropertyNote = notes;
        this.isShowStatus = true;
        const existInprogress = notes.some(
          (item) => item.syncStatus === SyncMaintenanceType.INPROGRESS
        );
        if (!existInprogress) {
          this.hideSyncTimeout = setTimeout(() => {
            this.isShowStatus = false;
          }, 2000);
        }
      });
    this.propertyIdSubject
      .pipe(
        takeUntil(this.subscribers),
        filter((propertyId) => Boolean(propertyId)),
        switchMap((propertyId) =>
          this.propertyService.getPropertyManagerContacts(propertyId)
        )
      )
      .subscribe((propertyManagers) => {
        this.propertyManager = propertyManagers;
        this.propertyManagerName = this.getPortfoliosName(propertyManagers);
        this.loadingService.stopLoading();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { propertyManager, propertyId, crmSystemId } = changes || {};

    if (propertyManager?.currentValue) {
      this.propertyManagerName = this.getPortfoliosName(
        propertyManager.currentValue
      );
    }

    this.propertyIdSubject.next(
      propertyId?.currentValue && !this.propertyManager
        ? propertyId.currentValue
        : ''
    );

    if (crmSystemId?.currentValue) {
      this.crmSystemId = changes['crmSystemId']?.currentValue;
    }
  }

  getMaintenanceNote() {
    this.propertyService
      .getMaintenanceNotes(this.propertyId)
      .pipe(filter((note) => !!note))
      .subscribe((note) => {
        this.maintenanceNote = note?.maintenanceNote;
        this.expenditureLimit = note?.expenditureLimit;
      });
  }

  getPortfoliosName(propertyManager: PropertyManager[] | PropertyManager) {
    if (!Array.isArray(propertyManager))
      return combineNames(propertyManager.firstName, propertyManager.lastName);

    const managersNumber = propertyManager?.length || 0;
    if (!managersNumber) return '';

    const remainingCount =
      managersNumber > 2 ? `, + ${managersNumber - 2}` : '';

    const propertyManagerName = propertyManager
      ?.slice(0, 2)
      ?.map((person) => combineNames(person?.firstName, person?.lastName))
      ?.join(', ');

    return propertyManagerName + remainingCount;
  }

  getListUserProperty() {
    switch (this.crmSystemId) {
      case ECrmSystemId.PROPERTY_TREE:
        this.getListUserPT();
        break;
      case ECrmSystemId.RENT_MANAGER:
        this.getListUserRM();
        break;
      default:
        break;
    }
  }

  getListUserPT() {
    this.propertyService.getPeople(this.propertyId);
    this.propertyService.peopleList$
      .pipe(
        takeUntil(this.subscribers),
        filter((user) => !!user)
      )
      .subscribe((user) => {
        this.listOfUser = user;
        this.getUserProperties();
      });
  }

  getListUserRM() {
    this.propertyService.getListUserOfRM(this.propertyId).subscribe((res) => {
      if (res) {
        res.ownerships.forEach((data) => {
          data.userProperties.sort((a, b) => {
            return a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1;
          });
        });
        res.tenancies = res.tenancies
          .filter((item) =>
            [
              ERmCrmStatus.RMCurrent,
              ERmCrmStatus.RMFuture,
              ERmCrmStatus.RMPast
            ].includes(item.status)
          )
          .map((data) => {
            data.userProperties.sort((a, b) => {
              return a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1;
            });
            return data;
          });
        res.tenancies = this.propertyService.sortTenanciesAndOwnerships(
          res.tenancies
        );
        res.ownerships = this.propertyService.sortTenanciesAndOwnerships(
          res.ownerships
        );
        this.listOfUser = res;
        this.getUserProperties();
      }
    });
  }

  public getListPropertyNote() {
    this.loadingService.onLoading();
    this.widgetNoteservice
      .getListPropertyNote(this.propertyId)
      .subscribe((notes) => {
        let newNote;
        switch (this.crmSystemId) {
          case ECrmSystemId.PROPERTY_TREE:
            newNote = notes;
            break;
          case ECrmSystemId.RENT_MANAGER:
            newNote = notes.notes;
            break;
          default:
            break;
        }
        const data = newNote?.map((note) => ({
          ...note,
          syncStatus: null
        }));
        this.userAgentService.setListNoteOfUser(data);
        this.loadingService.stopLoading();
      });
  }

  handleOpenModalAddNote() {
    this.isOpenModal(false);
    this.isShowModalAddNote.emit(true);
    this.statusProperty.emit(this.isExpandProperty);
  }

  toggleProperty() {
    this.isExpandProperty = !this.isExpandProperty;
  }

  toggleMaintenance() {
    this.isExpandMaintenance = !this.isExpandMaintenance;
  }
  public isOpenModal(status) {
    if (!status) {
      this.isCloseModal.emit(status);
    }
  }

  editNote(item) {
    if (this.isArchiveMailbox) return;
    this.selectedItem = item.id;
    this.descriptionInitial = item.description;
    clearTimeout(this.decriptionTimeout);
    this.decriptionTimeout = setTimeout(() => {
      this.decriptionNote?.nativeElement?.focus();
    }, 0);
  }

  handleFocusOut(item) {
    this.selectedItem = null;
    this.listPropertyNote = this.listPropertyNote.map((note) => {
      if (note.id === item.id) {
        return {
          ...item,
          description: this.descriptionInitial
        };
      }
      return note;
    });
  }

  updateNote(item: listPropertyNoteInterface) {
    if (this.isArchiveMailbox) return;
    const { id, description, lastModified } = item;
    this.selectedItem = null;
    const updateLocalList = (
      idToUpdate: string,
      updatedDescription: string,
      lastModified: string,
      syncStatus: SyncMaintenanceType
    ) => {
      return this.userAgentService.getListNoteOfUser.map((item) => {
        if (item.id === idToUpdate) {
          return {
            ...item,
            description: updatedDescription,
            lastModified,
            syncStatus
          };
        }
        return {
          ...item,
          syncStatus: null
        };
      });
    };
    this.userAgentService.setListNoteOfUser(
      updateLocalList(
        id,
        description,
        lastModified,
        SyncMaintenanceType.INPROGRESS
      )
    );
    const payload = this.getPayloadUpdateNote(item);
    this.propertyService.updatePropertyNote(payload).subscribe(
      (note) => {
        if (!note) return;
        this.userAgentService.setListNoteOfUser(
          updateLocalList(
            id,
            note.description,
            note.lastModified,
            note.syncStatus
          )
        );
      },
      (err) => {
        const currentList = this.userAgentService.getListNoteOfUser.map(
          (note) =>
            note.id === id ? { ...note, syncStatus: ESyncStatus.FAILED } : note
        );

        this.userAgentService.setListNoteOfUser(currentList);
      }
    );
  }

  getPayloadUpdateNote(item: listPropertyNoteInterface) {
    const { id, categoryId, description } = item || {};
    const propertyId = this.propertyId;
    return {
      propertyId,
      categoryId,
      description,
      id,
      crmId: this.crmSystemId
    };
  }

  getUserProperties() {
    this.listOfUser.tenancies = this.mapUserProperties(
      this.listOfUser.tenancies
    );
    this.listOfUser.ownerships = this.mapUserProperties(
      this.listOfUser.ownerships
    );
  }

  mapUserProperties(usersData) {
    if (!usersData) return;
    return usersData.map((item) => {
      if (item.userProperties) {
        item.userProperties = item.userProperties.map((u) => {
          if (u.user) {
            u.user.statusInvite = this.userService.getStatusInvite(
              u.user.iviteSent,
              u.user.lastActivity,
              u.user.offBoardedDate,
              u.user.trudiUserId
            );
            u.user.fullName = this.sharedService.displayName(
              u.user?.firstName,
              u.user?.lastName
            );
          }
          return u;
        });
      }
      if (!item.userPropertyGroupLeases?.length) {
        item.userPropertyGroupLeases = [
          {
            startDate: null,
            endDate: null,
            dayRemaining: null,
            rentAmount: null,
            frequency: null
          }
        ];
      }
      if (this.crmSystemId === ECrmSystemId.RENT_MANAGER) {
        return {
          ...item,
          status: this.mapStatusRMSystem(item.status)
        };
      }
      return item;
    });
  }

  mapStatusRMSystem(status) {
    return this.statusMap[status] || '';
  }

  getShortName(firstName: string, lastName: string): string {
    return getFirstCharOfName(firstName, lastName);
  }

  ngOnDestroy() {
    this.subscribers.next();
    this.subscribers.complete();
    this.sharedService.isLoadingSyncCard$.next(false);
    this.userAgentService.setListNoteOfUser([]);
    clearTimeout(this.hideSyncTimeout);
    clearTimeout(this.decriptionTimeout);
  }
}
