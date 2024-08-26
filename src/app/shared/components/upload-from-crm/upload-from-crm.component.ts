import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { UploadFromCRMService } from './upload-from-crm.service';
import { Subject, takeUntil } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { ISendMsgConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { cloneDeep } from 'lodash-es';
import { EUploadFileType, IFileFromCRM } from './upload-from-crm.interface';
import { updateConfigs } from '@/app/trudi-send-msg/utils/helper-functions';
import { PropertiesService } from '@services/properties.service';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { MappingFiles } from '@shared/types/profile-setting.interface';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import uuid4 from 'uuid4';

@Component({
  selector: 'upload-from-crm',
  templateUrl: './upload-from-crm.component.html',
  styleUrls: ['./upload-from-crm.component.scss']
})
export class UploadFromCrmComponent implements OnInit, OnDestroy, OnChanges {
  @Input() configs: ISendMsgConfigs = cloneDeep(defaultConfigs);
  @Input() backFromCheckList: boolean = false;
  @Output() onTrigger = new EventEmitter<MappingFiles[]>();
  @Output() onClose = new EventEmitter<any>();
  @Output() changeValue = new EventEmitter<any>();
  currentProperty;
  form: FormGroup;
  defaultConfigs: ISendMsgConfigs = {
    ...defaultConfigs
  };
  public currentAgencyId: string = '';
  activeProperty: UserPropertyInPeople[] = [];
  isShowBackButtonAttachFile: boolean = false;
  get popupState() {
    return this.uploadFromCRMService.getPopupState();
  }
  visibleAttachFile: boolean = false;
  visibleSelect: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private uploadFromCRMService: UploadFromCRMService,
    private agencyService: AgencyService,
    private propertiesService: PropertiesService,
    private conversationService: ConversationService,
    private filesService: FilesService,
    private formBuilder: FormBuilder
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['configs']?.currentValue) {
      this.configs = updateConfigs(
        cloneDeep(this.defaultConfigs),
        this.configs
      );
      this.subscribeSelectProperty();
    }
  }

  ngOnInit() {
    this.subscribeProperties();
    this._buildForm();
    this.subscribeSelectProperty();
  }

  subscribeProperties() {
    if (!this.currentProperty) this._getProperties();
  }

  _buildForm() {
    const property = new FormControl(null, Validators.required);
    this.form = this.formBuilder.group({
      property: property
    });
  }

  subscribeSelectProperty() {
    this.uploadFromCRMService.selectedProperty$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.uploadFromCRMService.setSelectedFiles([]);
        if (res?.streetline) {
          this.currentProperty = res;
          this.uploadFromCRMService.setPopupState({
            visibleSelect: false,
            visibleAttachFile: true
          });
        } else {
          this.uploadFromCRMService.setPopupState({
            visibleSelect: true,
            visibleAttachFile: false
          });
          this.isShowBackButtonAttachFile = true;
        }
      });
  }

  onCloseSelectProperty() {
    this.uploadFromCRMService.setPopupState({
      visibleSelect: false
    });
    this.resetValue();
    this.onClose.emit();
  }

  onCloseAttachFiles() {
    this.uploadFromCRMService.setPopupState({
      visibleAttachFile: false
    });
    this.resetValue();
    this.onClose.emit();
  }

  resetValue() {
    this.form.reset();
    this.uploadFromCRMService.setSelectedProperty(null);
    this.uploadFromCRMService.setSelectedFiles([]);
  }

  onSelectedFiles(files: IFileFromCRM[]) {
    const formatFiles = this.getMapFilesUpload(files);
    this.uploadFromCRMService.setSelectedFiles(formatFiles);
    this.changeValue.emit();
    this.onTrigger.emit(formatFiles);
  }

  onTriggerSelectProperty() {
    this.onTrigger.emit();
  }

  onTriggerAttachFileFromCrm() {
    this.onTrigger.emit();
  }

  _getProperties() {
    this.propertiesService
      .getAgencyProperty(
        this.conversationService.currentConversation.value?.userId,
        ''
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.activeProperty = res;
        }
      });
  }

  private getMapFilesUpload(files: IFileFromCRM[]): MappingFiles[] {
    if (!files) return null;
    return files.map((file) => {
      const fileTypeDot = this.filesService.getFileTypeDot(file.name);
      const fileIcon = this.filesService.getFileIcon(file.name);
      if (fileTypeDot?.indexOf(EUploadFileType.VIDEO) > -1) {
        file.isSupportedVideo = true;
        file.localThumb = file.thumbMediaLink;
      } else if (fileTypeDot?.indexOf(EUploadFileType.PHOTO) > -1) {
        file.localThumb = file.mediaLink;
      }
      if (!file?.fileType?.name) {
        file.fileType.name = fileTypeDot;
      }
      if (!file?.fileType?.icon) {
        file.fileType.icon = fileIcon;
      }
      const formatedFile = {
        ...file,
        fileType: {
          icon: fileIcon,
          name: fileTypeDot
        },
        parentId: file?.id
      };
      return {
        '0': formatedFile,
        icon: this.filesService.getFileIcon(file?.name),
        id: uuid4()
      };
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
