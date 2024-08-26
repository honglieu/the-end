import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import {
  EScheduledStatus,
  EStatusTicket,
  IMessage,
  IPropertyDocument,
  ITicket,
  ITicketFile,
  ITicketResponse
} from '@/app/shared/types';
import { ERequestType } from '@/app/shared/enum';
import dayjs from 'dayjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { collapseMotion } from '@core/animation/collapse';
import { RoutineInspectionService } from '@/app/services/routine-inspection.service';
import { finalize, Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

interface IRequestItemToDisplay {
  title: string;
  isUrgent: boolean;
  status?: EStatusTicket;
  replied?: boolean;
  timestamp?: string;
  originalContent?: string;
  translatedContent: string;
  showTranslation: boolean;
  ticketTrans: string;
  ticketLanguageCode: string;
  type: ERequestType;
  hasContent?: boolean;
  vacateInfo?: IVacateInfo;
  rescheduleInfo?: IRescheduleInfo;
  showRescheduleInspectionActionDetail?: boolean;
  showRequestImages?: boolean;
  ticketFile?: ITicketFile[];
}

interface IVacateInfo {
  type: string;
  intendedDate: string;
  note: string;
}

interface IRescheduleInfo {
  suggestedDate: string;
  suggestedTime: string;
  reason: string;
}

interface IFileOnClicked {
  state: boolean;
  imageId: string;
}

interface ITriggerOnRequestAction {
  conversationId: string;
  messageId: string;
  status: EScheduledStatus;
  cancelAIGenerate?: boolean;
}

@Component({
  selector: 'request-card',
  templateUrl: './request-card.component.html',
  styleUrls: ['./request-card.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [collapseMotion]
})
export class RequestCardComponent implements OnChanges, OnDestroy {
  @Input() message: IMessage;
  @Output() fileOnClicked = new EventEmitter<IFileOnClicked>();
  @Output() triggerOnRequestAction =
    new EventEmitter<ITriggerOnRequestAction>();
  isOpenDescription: boolean = false;
  requestItemToDisplay: IRequestItemToDisplay;
  requestOuterStatus: EScheduledStatus;
  isActionInProgress: boolean = false;
  readonly ERequestType = ERequestType;
  readonly EStatusTicket = EStatusTicket;
  readonly EScheduledStatus = EScheduledStatus;
  private destroy$ = new Subject<void>();

  constructor(
    private agencyDateFormatService: AgencyDateFormatService,
    private routineInspectionService: RoutineInspectionService,
    private toastrService: ToastrService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']?.currentValue) {
      const response = this.message.options?.response;
      const ticketFile = this.message.ticketFile || [];
      if (response) {
        this.requestItemToDisplay = this.mapRequestItemToDisplay(
          response,
          ticketFile
        );
        this.requestOuterStatus = this.message.options.status;
      }
    }
  }

  private mapRequestItemToDisplay(
    response: ITicketResponse,
    ticketFile: ITicketFile[]
  ): IRequestItemToDisplay {
    const {
      conversationTopic,
      isUrgent,
      status,
      updatedAt,
      maintenance_object,
      general_inquiry,
      reschedule_reason,
      availability,
      time_availability,
      move_out_date,
      vacate_type,
      note,
      ticketTrans,
      ticketLanguageCode,
      pet_description,
      key_request_reason,
      incident_detail,
      situation,
      available_time,
      call_back_reason,
      change_tenancy_details
    } = response.payload?.ticket || {};

    const showTranslation =
      ticketTrans &&
      ticketLanguageCode &&
      ticketLanguageCode !== 'en' &&
      ticketLanguageCode !== 'und';
    const translatedContent = showTranslation ? ticketTrans : null;
    const type = response.type as ERequestType;
    const showRescheduleInspectionActionDetail =
      type === ERequestType.RESCHEDULE_INSPECTION &&
      status === EStatusTicket.SUBMIT;
    const showRequestImages = [
      ERequestType.MAINTENANCE_REQUEST,
      ERequestType.GENERAL_ENQUIRY,
      ERequestType.PET_REQUEST,
      ERequestType.BREAK_IN_INCIDENT
    ].includes(type);

    const requestItemToDisplay: IRequestItemToDisplay = {
      title: conversationTopic,
      timestamp: updatedAt,
      type,
      status,
      showTranslation,
      translatedContent,
      ticketTrans,
      ticketLanguageCode,
      isUrgent,
      showRescheduleInspectionActionDetail,
      showRequestImages,
      ticketFile
    };

    requestItemToDisplay.originalContent = this.getOriginalContent(type, {
      maintenance_object,
      general_inquiry,
      reschedule_reason,
      availability,
      time_availability,
      move_out_date,
      vacate_type,
      note,
      pet_description,
      key_request_reason,
      incident_detail,
      situation,
      available_time,
      call_back_reason,
      change_tenancy_details
    });

    if (type === ERequestType.RESCHEDULE_INSPECTION) {
      requestItemToDisplay.rescheduleInfo = this.getRescheduleInfo({
        reschedule_reason,
        availability,
        time_availability
      });
    }

    if (type === ERequestType.VACATE_REQUEST) {
      requestItemToDisplay.vacateInfo = this.getVacateInfo({
        vacate_type,
        move_out_date,
        note
      });
    }

    requestItemToDisplay.hasContent = this.checkHasContent(
      type,
      requestItemToDisplay
    );

    return requestItemToDisplay;
  }

  private getOriginalContent(
    type: ERequestType,
    content: Partial<ITicket>
  ): string {
    switch (type) {
      case ERequestType.MAINTENANCE_REQUEST:
        return content.maintenance_object;
      case ERequestType.GENERAL_ENQUIRY:
        return content.general_inquiry;
      case ERequestType.RESCHEDULE_INSPECTION:
        return content.reschedule_reason;
      case ERequestType.VACATE_REQUEST:
        return content.note;
      case ERequestType.PET_REQUEST:
        return content.pet_description;
      case ERequestType.KEY_REQUEST:
        return content.key_request_reason;
      case ERequestType.BREAK_IN_INCIDENT:
        return content.incident_detail;
      case ERequestType.KEY_HANDOVER:
      case ERequestType.DOMESTIC_VIOLENCE_SUPPORT:
        return content.situation;
      case ERequestType.FINAL_INSPECTION:
        return content.available_time;
      case ERequestType.CALLBACK_REQUEST:
        return content.call_back_reason;
      case ERequestType.CHANGE_TENANT_REQUEST:
        return content.change_tenancy_details;
      default:
        return '';
    }
  }

  private getRescheduleInfo(content: Partial<ITicket>): IRescheduleInfo {
    return {
      suggestedDate: content.availability
        ? dayjs(content.availability.split(' ')?.[0].substring(0, 19)).format(
            `dddd ${this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS}`
          )
        : '',
      suggestedTime: content.time_availability,
      reason: content.reschedule_reason
    };
  }

  private getVacateInfo(content: Partial<ITicket>): IVacateInfo {
    return {
      type: content.vacate_type?.[0]?.value || '',
      intendedDate:
        content.move_out_date && content.move_out_date !== 'Invalid date'
          ? dayjs(content.move_out_date, 'DD/MM/YYYY').format(
              this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS
            )
          : '',
      note: content.note
    };
  }

  private checkHasContent(
    type: ERequestType,
    displayItem: IRequestItemToDisplay
  ): boolean {
    switch (type) {
      case ERequestType.MAINTENANCE_REQUEST:
      case ERequestType.GENERAL_ENQUIRY:
      case ERequestType.PET_REQUEST:
      case ERequestType.BREAK_IN_INCIDENT:
        return (
          !!this.message.ticketFile?.length || !!displayItem.originalContent
        );
      case ERequestType.RESCHEDULE_INSPECTION:
        return (
          this.hasPropertiesWithValues(displayItem.rescheduleInfo, [
            'suggestedDate',
            'suggestedTime',
            'reason'
          ]) || !!displayItem.originalContent
        );
      case ERequestType.VACATE_REQUEST:
        return (
          this.hasPropertiesWithValues(displayItem.vacateInfo, [
            'type',
            'intendedDate',
            'note'
          ]) || !!displayItem.originalContent
        );
      default:
        return !!displayItem.originalContent;
    }
  }

  private hasPropertiesWithValues(
    obj: IRescheduleInfo | IVacateInfo,
    properties: string[]
  ): boolean {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    return Object.entries(obj).some(
      ([key, value]) => properties.includes(key) && !!(value || '').trim()
    );
  }

  loadFile(document: IPropertyDocument): void {
    this.fileOnClicked.emit({ state: true, imageId: document.id });
  }

  changeStatusRescheduleRequestHandler(status: EScheduledStatus) {
    this.isActionInProgress = true;
    this.routineInspectionService
      .changeStatusRecheduled({ messageId: this.message.id, status })
      .pipe(
        finalize(() => (this.isActionInProgress = false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (!res) return;
          this.triggerOnRequestAction.emit({
            conversationId: this.message.conversationId,
            messageId: this.message.id,
            status,
            cancelAIGenerate: false
          });
        },
        error: (err) => this.toastrService.error(err.message)
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
