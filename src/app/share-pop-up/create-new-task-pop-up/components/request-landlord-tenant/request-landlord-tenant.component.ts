import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { AppRoute } from '@/app/app.route';
import { stringFormat } from '@core';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyService as DashboardAgencyService } from '@/app/dashboard/services/agency.service';
import { AgencyService } from '@services/agency.service';
import { listImageTypeDot, listVideoTypeDot } from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { FileUploadService } from '@services/fileUpload.service';
import { FilesService } from '@services/files.service';
import { HeaderService } from '@services/header.service';
import {
  CONVERT_TO_TASK,
  CREATE_TASK_SUCCESSFULLY
} from '@services/messages.constants';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { ETrudiRaiseByType } from '@shared/enum/trudi';
import { IFile } from '@shared/types/file.interface';
import { PhotoType } from '@shared/types/task.interface';
import { fileLimit } from 'src/environments/environment';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';

@Component({
  selector: 'request-landlord-tenant',
  templateUrl: './request-landlord-tenant.component.html',
  styleUrls: ['./request-landlord-tenant.component.scss']
})
export class RequestLandlordTenantComponent implements OnInit, OnDestroy {
  @Input() title = 'Create request for landlord';
  @Input() labelRequest = 'Request summary';
  @Input() imageCheckList: PhotoType[] = [];
  @Input() propertyId: string;
  @Input() summaryText: string = '';
  @Input() leftButtonText: string = 'Back';
  /* NOTE: pass categoryID when task created in message index page */
  @Input() categoryID?: string;
  @Input() taskNameRegionId = '';
  @Input() openFrom: CreateTaskByCateOpenFrom;
  @Input() isEdit: boolean = false;
  @Input() sendViaApp: ETrudiRaiseByType = null;
  @Input() mediaFilesInConversation: number = 0;
  @Input() assignedUserIds: string[];
  @Input() dataRequestLandlordTenant;
  @Input() emailSummary: string = '';

  @Output() onCloseModal = new EventEmitter();
  @Output() onBack = new EventEmitter();
  @Output() onNext = new EventEmitter();

  readonly acceptFileType = [...listImageTypeDot, ...listVideoTypeDot];
  public MAX_TEXT_MESS_LENGTH = 800;
  public overFileSize = false;
  public formatSrc = '';
  public listFile: IFile[] = [];
  public hasOriginalMediaFile: boolean = true;
  public formGroup: FormGroup = new FormGroup({
    summary: new FormControl('', Validators.required)
  });
  private currentAgencyId: string;
  private subscribers = new Subject<void>();
  public currentMailBoxId: string;

  constructor(
    private fileUpload: FileUploadService,
    private taskService: TaskService,
    private toastService: ToastrService,
    private router: Router,
    private conversationService: ConversationService,
    private headerService: HeaderService,
    private agencyService: AgencyService,
    private readonly elr: ElementRef,
    private filesService: FilesService,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private dashboardAgencyService: DashboardAgencyService,
    private inboxService: InboxService
  ) {}

  ngOnDestroy(): void {
    this.subscribers.next();
  }

  ngOnInit(): void {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (res) this.currentMailBoxId = res;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.onChangePrefillValue(changes);
    this.checkHasOriginalMediaFile();
    if (this.formGroup && changes['emailSummary']?.currentValue) {
      this.formGroup.get('summary').setValue(this.emailSummary);
    }
  }

  onChangePrefillValue(changes: SimpleChanges) {
    if (changes['imageCheckList']?.currentValue) {
      this.imageCheckList = this.imageCheckList.slice(-5);
      this.imageCheckList.forEach((img) => {
        const formatSrc = this.filesService.getFileTypeSlash(
          typeof img?.fileType === 'string'
            ? img?.fileType
            : img?.fileType?.name
        );
        if (formatSrc !== 'file') {
          img.formatSrc = formatSrc;
          img.checked = true;
        }
      });
    }

    if (changes['sendViaApp']?.currentValue) {
      if (this.sendViaApp === ETrudiRaiseByType.APP) {
        this.formGroup.get('summary').setValue(this.summaryText);
      }
    }
    if (changes['isEdit']?.currentValue) {
      if (this.isEdit) {
        this.formGroup.get('summary').setValue(this.summaryText);
      }
    }
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
          this.imageCheckList.push({
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

  checkHasOriginalMediaFile() {
    if (this.openFrom === CreateTaskByCateOpenFrom.TASK_DETAIL) {
      this.hasOriginalMediaFile = this.imageCheckList?.some(
        (photo) => photo?.isOriginalMediaFile
      );
    }
  }

  async uploadPhotos(isCreateNewTask: boolean = false) {
    let checkedFilesFromLocal = [];
    let checkedFilesFromBE = [];
    this.imageCheckList.forEach((item) => {
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

  isFormValidate() {
    return this.formGroup.get('summary').value;
  }

  handleCreateNewTask(options) {
    if (
      this.openFrom === CreateTaskByCateOpenFrom.TASK ||
      this.openFrom === CreateTaskByCateOpenFrom.CALENDAR
    ) {
      const event = this.taskService.calendarEventSelected$.value;
      this.onNext.emit();
      this.taskService
        .convertMessageToTask(
          '',
          this.taskNameRegionId,
          this.propertyId,
          this.assignedUserIds,
          options,
          this.dataRequestLandlordTenant.taskNameTitle,
          event?.id || '',
          false,
          this.dataRequestLandlordTenant.taskTitle,
          this.dataRequestLandlordTenant.indexTitle,
          this.dataRequestLandlordTenant?.notificationId,
          this.currentMailBoxId
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

            this.router
              .navigate([stringFormat(AppRoute.TASK_DETAIL, res.id)], {
                replaceUrl: true,
                queryParams: {
                  type: 'TASK'
                }
              })
              .then((rs) => {
                this.taskService.currenTaskTrudiResponse$.next(res);
                this.taskService.currentTaskId$.next(res.id);
                this.taskService.currentTask$.next(res);
                this.conversationService.currentConversation.next(
                  res?.conversations
                );
                this.conversationService.reloadConversationList.next(true);
                this.taskService.resetAllFilter();
              });
          }
        });
    } else {
      const currentCategoryID =
        this.categoryID ||
        this.conversationService.selectedCategoryId.value ||
        this.taskService.currentTask$.value?.conversations?.[0]?.categoryId;
      this.conversationService
        .convertToTask(
          this.conversationService.currentConversation.value?.id,
          currentCategoryID,
          this.taskNameRegionId,
          this.propertyId,
          this.assignedUserIds,
          options,
          false,
          this.dataRequestLandlordTenant.taskNameTitle,
          this.dataRequestLandlordTenant.indexTitle,
          this.dataRequestLandlordTenant.taskTitle
        )
        .subscribe((res) => {
          if (res) {
            this.openFrom !== CreateTaskByCateOpenFrom.CONVERT_TO_TASK &&
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
            this.onNext.next(res);
          }
        });
    }
  }

  async onNextRequest() {
    if (!this.isFormValidate()) {
      this.formGroup.get('summary').markAsDirty();
      return;
    }

    const options = {
      tenantLandlordRequest: {
        description: this.formGroup.get('summary').value,
        photos: await this.uploadPhotos(true)
      }
    };

    this.handleCreateNewTask(options);
  }

  async handleEditTask() {
    if (!this.isFormValidate()) {
      this.formGroup.get('summary').markAsDirty();
      return;
    }
    const photos = await this.uploadPhotos();
    photos.filter((item) => item.checked);
    this.onNext.emit({
      description: this.formGroup.get('summary').value,
      photos: photos
    });
  }
}
