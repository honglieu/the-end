import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { FormControl, FormGroup } from '@angular/forms';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ChangeDetectorRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { TaskNameId } from '@shared/enum/task.enum';
import { listImageTypeDot, listVideoTypeDot } from '@services/constants';
import { TaskService } from '@services/task.service';
import { BehaviorSubject, Subject, filter, fromEvent, takeUntil } from 'rxjs';
import { NewTaskOptions, PhotoType } from '@shared/types/task.interface';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { ConversationService } from '@services/conversation.service';
import { HeaderService } from '@services/header.service';
import {
  CONVERT_TO_TASK,
  CREATE_TASK_SUCCESSFULLY
} from '@services/messages.constants';
import { FileUploadService } from '@services/fileUpload.service';
import { IFile } from '@shared/types/file.interface';
import { ETrudiRaiseByType } from '@shared/enum/trudi';
import { ECategoryType } from '@shared/enum/category.enum';
import { FilesService } from '@services/files.service';
import { fileLimit } from 'src/environments/environment';
import { EmergencyMaintenanceAPIService } from '@/app/emergency-maintenance/services/emergency-maintenance-api.service';
import { ShareValidators } from '@shared/validators/share-validator';
import { AgencyService as DashboardAgencyService } from '@/app/dashboard/services/agency.service';
import { NavigatorService } from '@services/navigator.service';
import { SharedService } from '@services/shared.service';
import { AppRoute } from '@/app/app.route';
import { stringFormat } from '@core';

export enum InjectFrom {
  VOICE_MAIL = 'VOICE_MAIL'
}

export enum CreateTaskByCateOpenFrom {
  MESSAGE = 'MESSAGE',
  ADD_ITEM_TO_TASK = 'ADD_ITEM_TO_TASK',
  TASK = 'TASK',
  CALENDAR = 'CALENDAR',
  CONVERT_TO_TASK = 'CONVERT_TO_TASK',
  TASK_DETAIL = 'TASK_DETAIL',
  CREATE_NEW_TASK = 'CREATE_NEW_TASK',
  CREATE_MULTIPLE_TASK = 'CREATE_MULTIPLE_TASK',
  CREATE_BULK_MULTIPLE_TASK = 'CREATE_BULK_MULTIPLE_TASK',
  EMERGENCY_MAINTENANCE_TASK = 'EMERGENCY_MAINTENANCE_TASK', // Open from 'EMERGENCY_MAINTENANCE_TASK' when Emergency maintenance downgrade to routine maintenance
  CALENDAR_EVENT_BULK_CREATE_TASKS = 'CALENDAR_EVENT_BULK_CREATE_TASKS'
}
export interface PrefillValue {
  objects?: string[];
  description?: string;
  files?: PhotoType[];
}

@Component({
  selector: 'create-task-by-category',
  templateUrl: './create-task-by-category.component.html',
  styleUrls: ['./create-task-by-category.component.scss']
})
export class CreateTaskByCategoryComponent
  implements OnInit, OnDestroy, OnChanges, AfterViewInit
{
  @Input() taskNameId: TaskNameId;
  @Input() show: boolean = false;
  @Input() taskNameRegionId: string = '';
  @Input() propertyId: string;
  @Input() assignedUserIds: string[];
  @Input() openFrom: CreateTaskByCateOpenFrom;
  @Input() showBackBtn: boolean = true;
  @Input() prefillValue: PrefillValue;
  @Input() sendViaApp: ETrudiRaiseByType = null;
  @Input() isEdit: boolean = false;
  @Input() mediaFilesInConversation: number = 0;
  @Input() emailSummary: string = '';
  @Input() taskNameTitle: string = '';
  @Input() eventId: string = '';
  /* NOTE: pass categoryID when task created in message index page */
  @Input() categoryID?: string;
  @Output() onCloseModal = new EventEmitter();
  @Output() onBack = new EventEmitter();
  @Output() onConfirm = new EventEmitter<any>();

  @ViewChild('textarea') taskSummaryTextArea: ElementRef<HTMLTextAreaElement>;

  readonly CreateTaskByCateOpenFrom = CreateTaskByCateOpenFrom;
  private subscribers = new Subject<void>();
  readonly acceptFileType = [...listImageTypeDot, ...listVideoTypeDot];

  private inputSummaryManually$ = new BehaviorSubject<boolean>(null);

  public initObj = {
    [TaskNameId.routineMaintenance]: {
      title: 'Create routine maintenance',
      label2: 'Summary of the issue',
      valueOptions: []
    },
    [TaskNameId.petRequest]: {
      title: 'Create pet request',
      label2: 'Additional information or conditions',
      valueOptions: []
    },
    [TaskNameId.emergencyMaintenance]: {
      title: 'Create emergency request',
      label2: 'Summary of the issue',
      valueOptions: []
    },
    [TaskNameId.taskTemplate]: {
      title: 'Create request summary',
      label2: 'Request summary',
      valueOptions: []
    }
  };
  public formGroup = new FormGroup({
    value1: new FormControl([]),
    value2: new FormControl('', [ShareValidators.containsLineBreak()])
  });
  public MAX_TEXT_MESS_LENGTH = 300;
  public images: PhotoType[] = [];
  public isFocusSelectInput = false;
  public formatSrc = '';
  public listFile: IFile[] = [];
  public overFileSize = false;
  public isLoadingConfirm = false;
  public hasOriginalMediaFile: boolean = true;
  public currentAgencyId: string;
  public mailBoxId: string;
  public isConsole: boolean;

  constructor(
    private fileUpload: FileUploadService,
    private taskService: TaskService,
    private toastService: ToastrService,
    private router: Router,
    private conversationService: ConversationService,
    private headerService: HeaderService,
    private readonly elr: ElementRef,
    private filesService: FilesService,
    private emergencyMaintenanceAPIService: EmergencyMaintenanceAPIService,
    private dashboardAgencyService: DashboardAgencyService,
    private cdr: ChangeDetectorRef,
    private navigatorService: NavigatorService,
    private inboxService: InboxService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.taskService.getListDefaultObject().subscribe((res) => {
      if (res) {
        switch (this.taskNameId) {
          case TaskNameId.petRequest:
            this.initObj[TaskNameId.petRequest].valueOptions = res.petType;
            break;

          case TaskNameId.routineMaintenance:
            this.initObj[TaskNameId.routineMaintenance].valueOptions =
              res.maintenanceObject;
            break;

          case TaskNameId.emergencyMaintenance:
            this.initObj[TaskNameId.emergencyMaintenance].valueOptions =
              res.emergencyEvent;
            break;

          default:
            break;
        }
        this.prefillObjectsData();
      }
    });

    if (
      [
        TaskNameId.petRequest,
        TaskNameId.routineMaintenance,
        TaskNameId.emergencyMaintenance,
        TaskNameId.requestLandlord,
        TaskNameId.requestTenant,
        TaskNameId.taskTemplate
      ].includes(this.taskNameId)
    ) {
      this.setMaxlength(100);
    }

    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (res) this.mailBoxId = res;
      });
  }

  ngAfterViewInit(): void {
    fromEvent(this.taskSummaryTextArea?.nativeElement, 'input')
      .pipe(
        takeUntil(
          this.inputSummaryManually$.pipe(
            filter((value) => typeof value == 'boolean')
          )
        ),
        takeUntil(this.subscribers)
      )
      .subscribe((event: InputEvent) => {
        if (event?.data) {
          this.inputSummaryManually$.next(true);
        }
      });
  }

  setMaxlength(length: number) {
    this.MAX_TEXT_MESS_LENGTH = length;
  }

  prefillObjectsData() {
    if (this.prefillValue?.objects) {
      const objectsToMatch = this.prefillValue?.objects || [];

      const matchedObjects = objectsToMatch.filter((object) =>
        this.initObj[this.taskNameId].valueOptions.includes(object)
      );

      matchedObjects.length !== 0 && this.objectValues.setValue(matchedObjects);
    }
  }

  shouldPrefillObject() {
    switch (this.openFrom) {
      case CreateTaskByCateOpenFrom.MESSAGE:
      case CreateTaskByCateOpenFrom.CONVERT_TO_TASK:
      case CreateTaskByCateOpenFrom.EMERGENCY_MAINTENANCE_TASK:
      case CreateTaskByCateOpenFrom.TASK_DETAIL:
        return true;
      case CreateTaskByCateOpenFrom.CREATE_NEW_TASK:
        return (
          this.taskNameId ===
          this.conversationService.superHappyPathTrudiResponse.value?.data[0]
            ?.body?.newSuggestion?.convertToTask?.id
        );
      default:
        return false;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      !this.inputSummaryManually$?.getValue() &&
      this.formGroup &&
      this.emailSummary
    ) {
      this.formGroup.get('value2').setValue(this.emailSummary);
    }
    if (
      changes['prefillValue']?.currentValue ||
      changes['taskNameId']?.currentValue
    ) {
      let { description, objects, files } = this.prefillValue || {};
      if (objects && this.shouldPrefillObject()) {
        objects = objects.filter(
          (item, index) => index !== objects.indexOf(item)
        );
        this.objectValues.setValue(objects);
      }

      if (
        description &&
        this.shouldPrefillObject() &&
        (this.openFrom ===
          CreateTaskByCateOpenFrom.EMERGENCY_MAINTENANCE_TASK ||
          this.sendViaApp === ETrudiRaiseByType.APP ||
          this.isEdit) &&
        !this.emailSummary
      ) {
        this.descriptionValue.setValue(description);
      }

      if (files?.length) {
        files = files?.slice(-5);
        files.forEach((file) => {
          const formatSrc = this.filesService.getFileTypeSlash(
            typeof file?.fileType === 'string'
              ? file?.fileType
              : file?.fileType?.name
          );
          if (formatSrc !== 'file') {
            this.images.push({
              id: file?.id,
              fileName: file?.fileName,
              fileType: file?.fileType,
              fileSize: file?.fileSize,
              mediaLink: file?.mediaLink,
              checked: true,
              formatSrc,
              mediaType: file?.mediaType,
              isUserUpload: true,
              thumbMediaLink: file?.thumbMediaLink,
              isOriginalMediaFile: file?.isOriginalMediaFile
            });
          }
        });
      }

      this.getTitle();
    }

    this.checkHasOriginalMediaFile();
  }

  getTitle() {
    if (this.isEdit) {
      this.initObj[this.taskNameId].title = this.initObj[
        this.taskNameId
      ].title.replace('Create', 'Edit');
    } else {
      this.initObj[this.taskNameId].title = this.initObj[
        this.taskNameId
      ].title.replace('Edit', 'Create');
    }
  }

  closeModal() {
    this.onCloseModal.emit();
    this.mediaFilesInConversation = 0;
  }
  onOpenSearchItem() {
    this.isFocusSelectInput = true;
    setTimeout(() => {
      const searchDropDown = this.elr.nativeElement.querySelector(
        '.search-box ng-select .ng-dropdown-panel'
      );
      searchDropDown.setAttribute('data-e2e', 'item-list');
    }, 0);
  }

  onChangeSearchItem() {
    setTimeout(() => {
      const searchItem = this.elr.nativeElement.querySelector(
        '.search-box ng-select .ng-value-container .ng-value'
      );
      searchItem.setAttribute('data-e2e', 'item-label');
    }, 0);
  }

  fileBrowseHandler(event) {
    this.overFileSize = false;
    const file = event.target.files && event.target.files[0];
    if (file) {
      const fileSizeMb = file.size / 1024 ** 2;
      if (fileSizeMb < fileLimit) {
        this.overFileSize = false;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        if (file.type.indexOf('image') > -1) {
          this.formatSrc = 'photo';
        } else if (file.type.indexOf('video') > -1) {
          this.formatSrc = 'video';
        }
        this.listFile.push(file);
        reader.onload = (e) => {
          this.images.push({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            src: (<FileReader>e.target).result as string,
            checked: true,
            formatSrc: this.formatSrc,
            isUserUpload: false
          });
          this.cdr.markForCheck();
          event.target.value = '';
        };
      } else {
        this.overFileSize = true;
      }
    }
  }

  onBackClick() {
    this.onBack.emit();
    this.mediaFilesInConversation = 0;
  }

  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
        control.markAsDirty({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

  async uploadPhotos(isCreateNewTask: boolean = false) {
    let checkedFilesFromLocal = [];
    let checkedFilesFromBE = [];
    this.images.forEach((item) => {
      const findIndex = this.listFile.findIndex(
        (it) => it.name === item?.fileName && item?.checked
      );
      if (item.checked && item.mediaLink) {
        checkedFilesFromBE.push(item);
      }
      if (item.checked && findIndex > -1 && !item?.mediaLink) {
        checkedFilesFromLocal.push(this.listFile[findIndex]);
      }
    });
    let photos: PhotoType[] = [];
    if (checkedFilesFromLocal.length) {
      await Promise.all(
        checkedFilesFromLocal.map(async (file) => {
          const dataImg = await this.fileUpload.uploadFile2(
            file,
            this.propertyId
          );
          photos.push({
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            mediaLink: dataImg.Location,
            checked: true,
            isUserUpload: false,
            mediaType: this.filesService.getFileTypeSlash(file.type)
          });
        })
      );
    }
    if (checkedFilesFromBE.length) {
      checkedFilesFromBE.forEach((file) => {
        let fileExtension = file.fileType;
        if (file.fileType && typeof file.fileType !== 'string') {
          fileExtension = file.fileType.name;
        }
        photos.push({
          id: file.id,
          fileName: file.fileName,
          fileSize: file.fileSize,
          fileType: file.fileType,
          mediaLink: file.mediaLink,
          checked: true,
          isUserUpload: true,
          mediaType: this.filesService.getFileTypeSlash(fileExtension),
          thumbMediaLink: file?.thumbMediaLink,
          isOriginalMediaFile: file?.isOriginalMediaFile || isCreateNewTask
        });
      });
    }

    return photos;
  }

  async createTask() {
    if (this.formGroup.invalid) {
      this.validateAllFormFields(this.formGroup);
      return;
    }
    const options: NewTaskOptions = {};
    switch (this.taskNameId) {
      case TaskNameId.routineMaintenance:
        const maintenanceObject = this.objectValues.value;
        options.routineMaintenance = {
          description: this.descriptionValue.value,
          photos: await this.uploadPhotos(true),
          maintenanceObject: maintenanceObject?.join(', ') || '',
          maintenanceObjectList: maintenanceObject || []
        };
        break;
      case TaskNameId.emergencyMaintenance:
        options.emergencyMaintenance = {
          description: this.descriptionValue.value,
          photos: await this.uploadPhotos(true),
          emergencyEvent: this.objectValues.value?.join(', ') || '',
          emergencyEventList: this.objectValues.value || []
        };
        break;
      case TaskNameId.petRequest:
        options.petRequest = {
          petType: this.objectValues.value,
          description: this.descriptionValue.value,
          photos: await this.uploadPhotos(true)
        };
        break;
      case TaskNameId.taskTemplate:
        options.summary = {
          summaryNote: this.descriptionValue.value,
          summaryPhotos: await this.uploadPhotos(true)
        };
        break;
      default:
        break;
    }
    this.handleCreateNewTask(
      this.openFrom,
      this.taskNameRegionId,
      this.propertyId,
      options,
      this.assignedUserIds,
      this.taskNameTitle,
      this.mailBoxId
    );
  }

  async handleEditTask() {
    if (this.formGroup.invalid) {
      this.validateAllFormFields(this.formGroup);
      return;
    }
    const photos = await this.uploadPhotos();
    photos.filter((item) => item.checked);
    const categoryIdTask =
      this.taskService.currentTask$?.value.trudiResponse.setting.categoryId;
    switch (categoryIdTask) {
      case ECategoryType.petReq:
        this.onConfirm.emit({
          description: this.descriptionValue.value,
          petType: this.objectValues.value,
          photos: photos
        });
        break;

      case ECategoryType.routineMaintenance:
        this.onConfirm.emit({
          description: this.descriptionValue.value,
          maintenanceObjectList: this.objectValues.value,
          maintenanceObject: this.objectValues.value.join(', '),
          photos: photos
        });
        break;

      case ECategoryType.emergencyMaintenance:
        this.onConfirm.emit({
          description: this.descriptionValue.value,
          emergencyEventList: this.objectValues.value,
          emergencyEvent: this.objectValues.value.join(', '),
          photos: photos
        });
        break;

      default:
        this.onConfirm.emit({
          description: this.descriptionValue.value,
          photos: photos
        });
        break;
    }
  }

  handleCreateNewTask(
    openFrom: CreateTaskByCateOpenFrom,
    taskNameRegionId: string,
    propertyId: string,
    options: NewTaskOptions,
    assignedUserIds: string[],
    taskNameTitle: string,
    mailBoxId: string
  ) {
    this.isLoadingConfirm = true;
    const event = this.taskService.calendarEventSelected$.value;
    const currentCategoryID =
      this.categoryID ||
      this.conversationService.selectedCategoryId.value ||
      this.taskService.currentTask$.value?.conversations?.[0]?.categoryId;
    switch (openFrom) {
      // create new task
      case CreateTaskByCateOpenFrom.CALENDAR:
      case CreateTaskByCateOpenFrom.TASK:
      case CreateTaskByCateOpenFrom.TASK_DETAIL:
        this.onConfirm.emit(true);
        this.taskService
          .convertMessageToTask(
            '',
            taskNameRegionId,
            propertyId,
            assignedUserIds,
            options,
            taskNameTitle,
            this.eventId || event?.id || '',
            false,
            taskNameTitle,
            taskNameTitle,
            '',
            mailBoxId
          )
          .subscribe((res) => {
            if (res) {
              this.taskService.openTaskFromNotification$.next(null);
              this.toastService.success(CREATE_TASK_SUCCESSFULLY);
              this.taskService.taskJustCreated$.next(res);
              this.headerService.headerState$.next({
                ...this.headerService.headerState$.getValue(),
                currentTask: res
              });
              // keep current url to return after create task
              const url = this.router.url;
              this.router
                .navigate([stringFormat(AppRoute.TASK_DETAIL, res.id)], {
                  replaceUrl: true,
                  queryParams: {
                    type: 'TASK'
                  }
                })
                .then((rs) => {
                  this.taskService.onResetTrudiResPet$.next(res);
                  this.taskService.currenTaskTrudiResponse$.next(res);
                  this.taskService.currentTaskId$.next(res.id);
                  this.taskService.currentTask$.next(res);
                  this.conversationService.currentConversation.next(
                    res?.conversations
                  );
                  this.conversationService.reloadConversationList.next(true);
                  this.taskService.resetAllFilter();
                  this.taskService.calendarEventSelected$.next(null);
                  // set return url
                  this.navigatorService.setReturnUrl(url);
                });
            }
          });
        break;
      // convert emergency maintenance task to routine maintenance
      case CreateTaskByCateOpenFrom.EMERGENCY_MAINTENANCE_TASK:
        this.emergencyMaintenanceAPIService
          .convertToMaintenanceTask(
            this.taskService.currentTaskId$.value,
            this.propertyId,
            options
          )
          .subscribe({
            next: (res) => {
              if (res) {
                this.taskService.openTaskFromNotification$.next(null);
                this.toastService.success(CREATE_TASK_SUCCESSFULLY);
                this.taskService.reloadTaskDetail.next(true);
                this.onConfirm.emit();
              }
            },
            error: (error) => {
              console.error(error);
            }
          });
        break;
      // convert message to task
      default:
        this.conversationService
          .convertToTask(
            this.conversationService.currentConversation.value?.id,
            currentCategoryID,
            taskNameRegionId,
            this.propertyId,
            assignedUserIds,
            options,
            false,
            taskNameTitle,
            taskNameTitle,
            taskNameTitle
          )
          .subscribe((res) => {
            if (res) {
              this.toastService.success(CONVERT_TO_TASK);
              this.router
                .navigate(
                  [
                    stringFormat(
                      AppRoute.TASK_DETAIL,
                      this.conversationService.currentConversation.value?.taskId
                    )
                  ],
                  {
                    replaceUrl: true
                  }
                )
                .then((rs) => {
                  this.taskService.reloadTaskArea$.next(true);
                  this.conversationService.reloadConversationList.next(true);
                  this.taskService.currenTaskTrudiResponse$.next(res);
                  this.taskService.reloadTaskDetail.next(true);
                });
              this.onConfirm.next(res);
            }
          });
    }
    this.mediaFilesInConversation = 0;
  }

  checkHasOriginalMediaFile() {
    if (this.openFrom === CreateTaskByCateOpenFrom.TASK_DETAIL) {
      this.hasOriginalMediaFile = this.prefillValue.files?.some(
        (photo) => photo?.isOriginalMediaFile
      );
    }
  }

  get objectValues() {
    return this.formGroup.get('value1');
  }

  get descriptionValue() {
    return this.formGroup.get('value2');
  }

  ngOnDestroy(): void {
    this.subscribers.next();
    this.subscribers.complete();
    this.isLoadingConfirm = false;
  }
}
