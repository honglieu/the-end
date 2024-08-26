import {
  EInvoiceTypeBS,
  InvoiceDataReq
} from './../../../../../shared/types/tenancy-invoicing.interface';
import { WidgetPTService } from './../../../sidebar-right/components/widget-property-tree/services/widget-property.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy,
  AfterViewInit,
  Pipe,
  PipeTransform
} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { PropertiesService } from '@/app/services/properties.service';
import { Subject, takeUntil, throttleTime, map, filter } from 'rxjs';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { Personal } from '@shared/types/user.interface';
import { PtNote } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/note/sync-note-popup/note-sync.interface';
import { IMaintenanceInvoice } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-invoice.interface';
import { InspectionSyncData } from '@shared/types/routine-inspection.interface';
import { Compliance } from '@shared/types/compliance.interface';
import dayjs from 'dayjs';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { ITaskLinkCalendarEvent } from '@/app/task-detail/modules/steps/communication/interfaces/calendar-event.interface';
import { DynamicParameterType } from '@/app/trudi-send-msg/utils/dynamic-parameter';
import { EEventStatus, EEventType } from '@shared/enum/calendar.enum';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { EActionType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { RMWidgetDataField } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { IRentManagerIssue } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import {
  getFilteredAndMappedTenancies,
  tenancyRMFilter
} from '@/app/user/utils/user.type';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { IRentManagerNote } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/interfaces/rent-manager-notes.interface';
import { IRentManagerInspection } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/interfaces/rent-manager-inspection.interface';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { SharedService } from '@services/shared.service';
import { ITenantDataRes } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/types';
import { FilesService } from '@/app/services/files.service';
import { CompanyService } from '@/app/services/company.service';
import { IDefaultConfirmEssential } from '@/app/task-detail/modules/steps/utils/communicationType';
import { CONVERSATION_STATUS, TENANCY_STATUS } from '@/app/services/constants';
import { ConversationService } from '@/app/services/conversation.service';

interface IEssentialItem {
  key: string;
  title: string;
}

@Component({
  selector: 'confirm-essential',
  templateUrl: './confirm-essential.component.html',
  styleUrls: ['./confirm-essential.component.scss']
})
export class ConfirmEssentialComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  private destroy$ = new Subject<boolean>();
  @Input() isShowPopup: boolean = false;
  @Input() options: boolean = true;
  @Input() modalId: string;
  @Output() handleClose = new EventEmitter();
  public essentialData = [
    {
      key: 'tenancy',
      values: [],
      name: 'tenancy'
    },
    {
      key: 'notes',
      values: [],
      name: 'note'
    },
    {
      key: 'creditorInvoices',
      values: [],
      name: 'creditor invoice'
    },
    {
      key: 'tenancyInvoices',
      values: [],
      name: 'tenancy invoice'
    },
    {
      key: 'maintenanceInvoice',
      values: [],
      name: 'maintenance invoice'
    },
    {
      key: 'routineInspections',
      values: [],
      name: 'routine inspection'
    },
    {
      key: 'ingoingInspections',
      values: [],
      name: 'ingoing inspection'
    },
    {
      key: 'outgoingInspections',
      values: [],
      name: 'outgoing inspection'
    },
    {
      key: 'compliances',
      values: [],
      name: 'compliance item'
    },
    {
      key: 'calendarEventBreachRemedy',
      values: [],
      name: 'breach remedy date'
    },
    {
      key: 'calendarEventEntry',
      values: [],
      name: 'entry date'
    },
    {
      key: 'rmIssues',
      values: [],
      name: 'Issues'
    },
    {
      key: 'rmInspections',
      values: [],
      name: 'Inspection'
    },
    {
      key: 'calendarEventCustom',
      values: [],
      name: 'custom date'
    },
    {
      key: 'leasing',
      values: [],
      name: 'new tenant'
    }
  ];
  public formGroup: FormGroup;
  public description: string = 'This email contains dynamic fields relevant to';
  private tenancies: Personal[] = [];
  private tenancyInvoice: InvoiceDataReq[] = [];
  private creditorInvoice: InvoiceDataReq[] = [];
  private ptNote: PtNote[] = [];
  private maintenanceInvoice: IMaintenanceInvoice[] = [];
  private routineInspection: InspectionSyncData[] = [];
  private ingoingInspection: InspectionSyncData[] = [];
  private outgoingInspection: InspectionSyncData[] = [];
  private issue: IRentManagerIssue[] = [];
  private rmNote: IRentManagerNote[] = [];
  private rmNewTenant: any[] = [];
  private inspection: IRentManagerInspection[] = [];
  private compliance: Compliance[] = [];
  PTWidgetDataField = PTWidgetDataField;
  private calendarEventBreachRemedy: ITaskLinkCalendarEvent[] = [];
  private calendarEventEntry: ITaskLinkCalendarEvent[] = [];
  private calendarCustomEvent: ITaskLinkCalendarEvent[] = [];
  crmSystemKey: ECRMSystem = ECRMSystem.PROPERTY_TREE;
  public dateFormatDay =
    this.agencyDateFormatService.dateFormat$.getValue().DATE_FORMAT_DAYJS;
  public essentialItems: IEssentialItem[] = [];
  public defaultConfirmEssential: IDefaultConfirmEssential;
  // public modalId = StepKey.communicationStep.confirmEssential;

  constructor(
    private stepService: StepService,
    private propertyService: PropertiesService,
    private widgetPTService: WidgetPTService,
    private trudiDynamicParameterService: TrudiDynamicParameterService,
    private eventCalendarService: EventCalendarService,
    private widgetRMService: WidgetRMService,
    private agencyDateFormatService: AgencyDateFormatService,
    private sharedService: SharedService,
    private filesService: FilesService,
    private companyService: CompanyService
  ) {
    this.formGroup = new FormGroup({});
  }

  ngAfterViewInit() {
    const modalElement = document.querySelector('.modal-confirm-essential');
    if (modalElement) {
      const modalHeight = modalElement.clientHeight;

      if (modalHeight > 640) {
        modalElement.classList.add('confirm-essential');
      }
    }
  }

  ngOnInit(): void {
    this.subscribeGetDefaultConfirmEssential();
    this.subscribeCRMSystem();
    this.subscribeTenancies();
    this.subscribePtNotes();
    this.subscribeCreditorInvoices();
    this.subscribeTenancyInvoices();
    this.subscribeMaintenanceInvoice();
    this.subscribeRoutineInspection();
    this.subscribeOutgoingInsepection();
    this.subscribeIssues();
    this.subscribeRmNote();
    this.subscribeIngoingInspection();
    this.subscribeCompliance();
    this.subscribeEventCalendar(EEventType.BREACH_REMEDY);
    this.subscribeEventCalendar(EEventType.ENTRY_NOTICE);
    this.subscribeEventCalendar(EEventType.CUSTOM_EVENT);
    this.subscribeRMInspections();
    this.subscribeRMTenant();

    // sync: because all subscribe flow has data
    const isNext = this.essentialData.every((item) => item.values.length <= 1);
    if (isNext) {
      this.stepService.setPopupState(null, null);
      this.stepService.setConfirmEssential(
        {
          ...this.formGroup.value,
          stepId: this.stepService.currentCommunicationStep?.value?.id,
          hideBackBtn: true
        },
        EActionType.ESSENTIAL_CONFIRM
      );
    }
    this.stepService
      .getConfirmEssential()
      .pipe(takeUntil(this.destroy$), throttleTime(200))
      .subscribe((data) => {
        if (!data) return;
        for (const key in data) {
          this.formGroup.get(key)?.setValue(data[key]);
        }
      });
  }

  subscribeGetDefaultConfirmEssential() {
    this.stepService
      .getDefaultConfirmEssential()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.defaultConfirmEssential = data;
      });
  }

  convertWordInCharacter(input) {
    return input.replace(/,(?=[^,]*$)/g, '.').replace(/,([^,]*)$/, ' and$1');
  }

  search(value: string, item) {
    value = value?.toLocaleLowerCase().trim();
    return (
      item?.name?.toLocaleLowerCase().indexOf(value) > -1 ||
      item?.subLabel?.toLocaleLowerCase().indexOf(value) > -1
    );
  }

  showSubLabel(key: string) {
    return (
      key === PTWidgetDataField.NOTES ||
      key === PTWidgetDataField.CREDITOR_INVOICES ||
      key === PTWidgetDataField.TENANCY_INVOICES ||
      key === PTWidgetDataField.MAINTENANCE_INVOICE ||
      key === DynamicParameterType.CALENDAR_EVENT_ENTRY_NOTICE ||
      key === DynamicParameterType.CALENDAR_EVENT_BREACH_REMEDY_DATE ||
      key === DynamicParameterType.CALENDAR_EVENT_CUSTOM
    );
  }

  addFormControl(key: string, title: string = null) {
    this.formGroup.addControl(key, new FormControl('', [Validators.required]));
    if (!title) return;
    if (this.startsWithVowel(key)) {
      this.essentialItems.push({ key: key, title: ` an ${title},` });
      this.description += ` an ${title},`;
    } else {
      this.essentialItems.push({ key: key, title: ` a ${title},` });
      this.description += ` a ${title},`;
    }
  }

  startsWithVowel(word: string) {
    const regex = /^(calendarEvent[ueoai])|^[ueoai]/i;
    return regex?.test(word);
  }

  handleNext() {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.invalid) {
      return;
    }
    this.handlePTWidgetDataField(PTWidgetDataField.NOTES, this.ptNote);
    this.handlePTWidgetDataField(
      PTWidgetDataField.CREDITOR_INVOICES,
      this.creditorInvoice
    );
    this.handlePTWidgetDataField(
      PTWidgetDataField.TENANCY_INVOICES,
      this.tenancyInvoice
    );
    this.handlePTWidgetDataField(
      PTWidgetDataField.MAINTENANCE_INVOICE,
      this.maintenanceInvoice
    );
    this.handlePTWidgetDataField(
      PTWidgetDataField.ROUTINE_INSPECTION,
      this.routineInspection
    );
    this.handlePTWidgetDataField(
      PTWidgetDataField.INGOING_INSPECTION,
      this.ingoingInspection
    );
    this.handlePTWidgetDataField(
      PTWidgetDataField.OUTGOING_INSPECTION,
      this.outgoingInspection
    );
    this.handlePTWidgetDataField(
      PTWidgetDataField.COMPLIANCES,
      this.compliance
    );
    this.handleRMWidgetDataField(RMWidgetDataField.RM_ISSUES, this.issue);
    this.handleDynamicParameterType(
      DynamicParameterType.TENANCY,
      this.tenancies,
      this.trudiDynamicParameterService.setDynamicParametersTenancy
    );
    this.handleDynamicParameterType(
      DynamicParameterType.CALENDAR_EVENT_BREACH_REMEDY_DATE,
      this.calendarEventBreachRemedy,
      this.trudiDynamicParameterService.setDynamicParametersCalendarEventWidget
    );
    this.handleDynamicParameterType(
      DynamicParameterType.CALENDAR_EVENT_ENTRY_NOTICE,
      this.calendarEventEntry,
      this.trudiDynamicParameterService.setDynamicParametersCalendarEventWidget
    );
    this.handleDynamicParameterType(
      DynamicParameterType.CALENDAR_EVENT_CUSTOM,
      this.calendarCustomEvent,
      this.trudiDynamicParameterService.setDynamicParametersCalendarEventWidget
    );
    this.handleRMWidgetDataField(
      RMWidgetDataField.RM_INSPECTIONS,
      this.inspection
    );
    this.handleRMWidgetDataField(RMWidgetDataField.RM_NOTES, this.rmNote);
    this.handleRMWidgetDataField(
      RMWidgetDataField.NEW_TENANT,
      this.rmNewTenant
    );
    this.stepService.setPopupState(null, null);
    this.stepService.setConfirmEssential(
      {
        ...this.formGroup.value,
        stepId: this.stepService.currentCommunicationStep?.value?.id
      },
      EActionType.ESSENTIAL_CONFIRM
    );
  }

  setFieldConfirmEssential(field) {
    this.formGroup
      .get(field)
      ?.setValue(this.defaultConfirmEssential?.[`${field}Id`]);
  }

  handlePTWidgetDataField(field, data) {
    if (data?.length === 1) {
      this.trudiDynamicParameterService.setDynamicParamaterPTWidget(
        field,
        data[0]
      );
      return;
    }
    const value = this.formGroup.get(field)?.value;
    if (value) {
      const item = data.find((item) => item.id === value);
      this.trudiDynamicParameterService.setDynamicParamaterPTWidget(
        field,
        item
      );
    }
  }

  handleRMWidgetDataField(field, data) {
    const currentValue = this.stepService.listOfFileDynamicValue;
    if (data?.length === 1) {
      this.trudiDynamicParameterService.setDynamicParamaterRMWidget(
        field,
        data[0]
      );
      if (field === RMWidgetDataField.RM_INSPECTIONS) {
        let inspectionFiles = this.getAllInspectionFiles(
          data[0].inspectionAreas
        );
        const newListFile = {
          ...currentValue,
          inspection: inspectionFiles
        };
        this.stepService.setListFileDynamic(newListFile);
      }
      if (field === RMWidgetDataField.NEW_TENANT) {
        let newTenantFile = this.getAllNewTenantFiles(
          data[0].data.userDefinedValues
        );
        const newListFile = {
          ...currentValue,
          newTenant: newTenantFile
        };
        this.stepService.setListFileDynamic(newListFile);
      }
      return;
    }
    const value = this.formGroup.get(field)?.value;
    if (value) {
      const item = data.find((item) => item.id === value);
      this.trudiDynamicParameterService.setDynamicParamaterRMWidget(
        field,
        item
      );
      if (field === RMWidgetDataField.RM_INSPECTIONS) {
        let inspectionFiles = this.getAllInspectionFiles(item?.inspectionAreas);
        const newListFile = {
          ...currentValue,
          inspection: inspectionFiles
        };
        this.stepService.setListFileDynamic(newListFile);
      }

      if (field === RMWidgetDataField.NEW_TENANT) {
        let newTenantFile = this.getAllNewTenantFiles(
          item?.data.userDefinedValues
        );
        const newListFile = {
          ...currentValue,
          newTenant: newTenantFile
        };
        this.stepService.setListFileDynamic(newListFile);
      }
    }
  }

  getAllInspectionFiles(inspectionData) {
    const allFiles = [];
    inspectionData?.forEach((area) => {
      area.inspectionAreaItems.forEach((item) => {
        if (item.files && item.files.length > 0) {
          allFiles.push(...item.files);
        }
      });
    });
    return allFiles;
  }

  getAllNewTenantFiles(userDefinedValues) {
    const result = [];
    userDefinedValues.forEach((user) => {
      if (user?.attachment) {
        const fileName = user.attachment?.fileName;
        result.push({
          ...user.attachment,
          icon: this.filesService.getFileIcon(fileName),
          fileType: this.filesService.getFileTypeDot(fileName),
          fileSize: user.attachment?.fileSize,
          extension: this.filesService.getFileExtension(fileName),
          name: fileName
        });
      }
    });
    return result;
  }

  handleDynamicParameterType(type, data, setDynamicParametersFn) {
    if (data?.length === 1) {
      setDynamicParametersFn.bind(this.trudiDynamicParameterService)(data[0]);
      return;
    }
    const value = this.formGroup.get(type)?.value;
    if (value) {
      const item = data.find((item) => item.id === value);
      setDynamicParametersFn.bind(this.trudiDynamicParameterService)(item);
    }
  }

  subscribeTenancies() {
    this.propertyService.peopleList$
      .pipe(takeUntil(this.destroy$))
      .subscribe((peopleList) => {
        if (!peopleList) return;
        if (
          this.options[DynamicParameterType.TENANCY] &&
          peopleList?.tenancies?.length > 0
        ) {
          let tenancyList;
          const filterList = [
            TENANCY_STATUS.active,
            TENANCY_STATUS.vacating,
            TENANCY_STATUS.vacated,
            TENANCY_STATUS.prospective,
            TENANCY_STATUS.prospect
          ];
          if (this.crmSystemKey === ECRMSystem.RENT_MANAGER) {
            tenancyList = getFilteredAndMappedTenancies(
              peopleList,
              tenancyRMFilter,
              false
            );
          } else {
            tenancyList = getFilteredAndMappedTenancies(
              peopleList,
              filterList,
              false
            );
          }
          this.addFormControl(
            DynamicParameterType.TENANCY,
            tenancyList?.length > 1 &&
              (this.crmSystemKey === ECRMSystem.PROPERTY_TREE
                ? 'tenancy'
                : 'tenant')
          );
          this.tenancies = tenancyList;
          if (tenancyList.length === 1) {
            this.handleDynamicParameterType(
              DynamicParameterType.TENANCY,
              tenancyList,
              this.trudiDynamicParameterService.setDynamicParametersTenancy
            );
            this.formGroup
              .get(DynamicParameterType.TENANCY)
              ?.setValue(tenancyList[0]?.id);
            return;
          }
          const tenancies = this.essentialData.find(
            (item) => item.key === DynamicParameterType.TENANCY
          );
          tenancies.values = tenancyList;
          tenancies.name =
            this.crmSystemKey === ECRMSystem.PROPERTY_TREE
              ? 'tenancy'
              : 'tenant';
          this.setFieldConfirmEssential(DynamicParameterType.TENANCY);
        }
      });
  }

  subscribeCRMSystem() {
    this.companyService.currentCompanyCRMSystemName
      .pipe(takeUntil(this.destroy$))
      .subscribe((crm) => {
        this.crmSystemKey = crm;
      });
  }

  subscribePtNotes() {
    this.widgetPTService
      .getPTWidgetStateByType<PtNote[]>(PTWidgetDataField.NOTES)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const data = this.filterListEventCompeleted(res);
        if (this.options[DynamicParameterType.PT_NOTE] && data?.length > 0) {
          this.addFormControl(
            PTWidgetDataField.NOTES,
            data.length > 1 && 'note'
          );
          const noteList = data?.map((item) => ({
            id: item.id,
            name:
              item?.entityType +
              ' note' +
              (item?.categoryName ? ' - ' + item?.categoryName : '') +
              (item?.nameUserPropertyGroup
                ? ' (' + item?.nameUserPropertyGroup + ')'
                : ''),
            subLabel: item?.description,
            value: item.id
          }));
          if (data.length === 1) {
            this.handlePTWidgetDataField(PTWidgetDataField.NOTES, data);
            this.formGroup
              .get(PTWidgetDataField.NOTES)
              ?.setValue(noteList[0]?.id);
            return;
          }
          const ptNote = this.essentialData.find(
            (item) => item.key === PTWidgetDataField.NOTES
          );
          this.ptNote = data;
          ptNote.values = noteList;
          this.setFieldConfirmEssential(PTWidgetDataField.NOTES);
        }
      });
  }

  subscribeCreditorInvoices() {
    this.widgetPTService
      .getPTWidgetStateByType<InvoiceDataReq[]>(
        PTWidgetDataField.CREDITOR_INVOICES
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        data = data?.filter(
          (item) =>
            item?.invoiceWidgetType === EInvoiceTypeBS.CREDITOR &&
            item.syncStatus === ESyncStatus.COMPLETED
        );
        if (
          this.options[DynamicParameterType.PT_CREDITOR_INVOICE] &&
          data?.length > 0
        ) {
          this.addFormControl(
            PTWidgetDataField.CREDITOR_INVOICES,
            data.length > 1 && 'creditor invoice'
          );
          const creditorInvoiceList = data?.map((item) => ({
            id: item?.id,
            name: `${item?.creditorInvoice?.description}`,
            value: item?.id,
            subLabel: `Due date: ${dayjs(item?.creditorInvoice?.dueDate).format(
              this.dateFormatDay
            )}`
          }));
          if (data.length === 1) {
            this.handlePTWidgetDataField(
              PTWidgetDataField.CREDITOR_INVOICES,
              data
            );
            this.formGroup
              .get(PTWidgetDataField.CREDITOR_INVOICES)
              ?.setValue(creditorInvoiceList[0]?.id);
            return;
          }
          const creditorInvoice = this.essentialData.find(
            (item) => item.key === PTWidgetDataField.CREDITOR_INVOICES
          );
          this.creditorInvoice = data;
          creditorInvoice.values = creditorInvoiceList;
          this.setFieldConfirmEssential(PTWidgetDataField.CREDITOR_INVOICES);
        }
      });
  }

  subscribeTenancyInvoices() {
    this.widgetPTService
      .getPTWidgetStateByType<InvoiceDataReq[]>(
        PTWidgetDataField.TENANCY_INVOICES
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        data = data?.filter(
          (item) =>
            item?.invoiceWidgetType === EInvoiceTypeBS.TENANCY &&
            item.syncStatus === ESyncStatus.COMPLETED
        );
        if (
          this.options[DynamicParameterType.PT_TENANCY_INVOICE] &&
          data?.length > 0
        ) {
          this.addFormControl(
            PTWidgetDataField.TENANCY_INVOICES,
            data.length > 1 && 'tenancy invoice'
          );
          const tenancyInvoiceList = data?.map((item) => ({
            id: item?.id,
            name: `${item?.tenancyInvoice?.description}`,
            value: item?.id,
            subLabel: `Due date: ${dayjs(item?.tenancyInvoice?.dueDate).format(
              this.dateFormatDay
            )}`
          }));
          if (data.length === 1) {
            this.handlePTWidgetDataField(
              PTWidgetDataField.TENANCY_INVOICES,
              data
            );
            this.formGroup
              .get(PTWidgetDataField.TENANCY_INVOICES)
              ?.setValue(tenancyInvoiceList[0]?.id);
            return;
          }
          const tenancyInvoice = this.essentialData.find(
            (item) => item.key === PTWidgetDataField.TENANCY_INVOICES
          );
          this.tenancyInvoice = data;
          tenancyInvoice.values = tenancyInvoiceList;
          this.setFieldConfirmEssential(PTWidgetDataField.TENANCY_INVOICES);
        }
      });
  }

  subscribeMaintenanceInvoice() {
    this.widgetPTService
      .getPTWidgetStateByType<IMaintenanceInvoice[]>(
        PTWidgetDataField.MAINTENANCE_INVOICE
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: IMaintenanceInvoice[]) => {
        const data = this.filterListEventCompeleted(res);
        if (
          this.options[DynamicParameterType.PT_MAINTENANCE_INVOICE] &&
          data.length > 0
        ) {
          this.addFormControl(
            PTWidgetDataField.MAINTENANCE_INVOICE,
            data.length > 1 && 'maintenance invoice'
          );
          const maintenanceInvoiceList = data.map((item) => ({
            id: item.id,
            name: `${item?.data?.invoice?.creditorInvoice?.invoiceDescription}`,
            value: item.id,
            subLabel: `Due date: ${dayjs(
              item?.data?.invoice?.creditorInvoice?.dueDate
            ).format(this.dateFormatDay)}`
          }));

          if (data.length === 1) {
            this.handlePTWidgetDataField(
              PTWidgetDataField.MAINTENANCE_INVOICE,
              data
            );
            this.formGroup
              .get(PTWidgetDataField.MAINTENANCE_INVOICE)
              ?.setValue(maintenanceInvoiceList[0]?.id);
            return;
          }
          const maintenanceInvoice = this.essentialData.find(
            (item) => item.key === PTWidgetDataField.MAINTENANCE_INVOICE
          );
          this.maintenanceInvoice = data;
          maintenanceInvoice.values = maintenanceInvoiceList;
          this.setFieldConfirmEssential(PTWidgetDataField.MAINTENANCE_INVOICE);
        }
      });
  }

  subscribeRoutineInspection() {
    this.widgetPTService
      .getPTWidgetStateByType<InspectionSyncData[]>(
        PTWidgetDataField.ROUTINE_INSPECTION
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: InspectionSyncData[]) => {
        const data = this.filterListEventCompeleted(res);
        if (
          this.options[DynamicParameterType.PT_ROUTINE_INSPECTION] &&
          data.length > 0
        ) {
          this.addFormControl(
            PTWidgetDataField.ROUTINE_INSPECTION,
            data.length > 1 && 'routine inspection'
          );
          const routineInspectionList = data.map((item) => ({
            id: item.id,
            name: `${
              item?.userPropertyGroup?.name
            } - ${this.agencyDateFormatService.formatTimezoneDate(
              item?.startTime,
              this.dateFormatDay
            )}`,
            value: item.id
          }));
          if (data.length === 1) {
            this.handlePTWidgetDataField(
              PTWidgetDataField.ROUTINE_INSPECTION,
              data
            );
            this.formGroup
              .get(PTWidgetDataField.ROUTINE_INSPECTION)
              ?.setValue(routineInspectionList[0]?.id);
            return;
          }
          const routineInspection = this.essentialData.find(
            (item) => item.key === PTWidgetDataField.ROUTINE_INSPECTION
          );
          this.routineInspection = data;
          routineInspection.values = routineInspectionList;
          this.setFieldConfirmEssential(PTWidgetDataField.ROUTINE_INSPECTION);
        }
      });
  }

  subscribeOutgoingInsepection() {
    this.widgetPTService
      .getPTWidgetStateByType<InspectionSyncData[]>(
        PTWidgetDataField.OUTGOING_INSPECTION
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: InspectionSyncData[]) => {
        const data = this.filterListEventCompeleted(res);
        if (
          this.options[DynamicParameterType.PT_OUTGOING_INSPECTION] &&
          data?.length > 0
        ) {
          this.addFormControl(
            PTWidgetDataField.OUTGOING_INSPECTION,
            data.length > 1 && 'outgoing inspection'
          );
          const outgoingInsepectionList = data.map((item) => ({
            id: item.id,
            name: `${
              item?.userPropertyGroup?.name
            } - ${this.agencyDateFormatService.formatTimezoneDate(
              item?.startTime,
              this.dateFormatDay
            )}`,
            value: item.id
          }));
          if (data.length === 1) {
            this.handlePTWidgetDataField(
              PTWidgetDataField.OUTGOING_INSPECTION,
              data
            );
            this.formGroup
              .get(PTWidgetDataField.OUTGOING_INSPECTION)
              ?.setValue(outgoingInsepectionList[0]?.id);
            return;
          }
          const outgoingInspection = this.essentialData.find(
            (item) => item.key === PTWidgetDataField.OUTGOING_INSPECTION
          );
          this.outgoingInspection = data;
          outgoingInspection.values = outgoingInsepectionList;
          this.setFieldConfirmEssential(PTWidgetDataField.OUTGOING_INSPECTION);
        }
      });
  }

  subscribeRMTenant() {
    this.widgetRMService
      .getRMWidgetStateByType(RMWidgetDataField.NEW_TENANT)
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (res) =>
            this.options[DynamicParameterType.RM_NEW_TENANT] && res?.length > 0
        )
      )
      .subscribe((data: ITenantDataRes[]) => {
        if (!data) return;
        const dataCompleted = data.filter(
          (item) => item.syncStatus === ESyncStatus.COMPLETED
        );
        const tenantField = RMWidgetDataField.NEW_TENANT;
        const tenantFormControl = this.formGroup.get(tenantField);

        const tenantList = dataCompleted?.map((item) => ({
          id: item.id,
          name: this.sharedService.displayName(
            item.data?.firstName,
            item.data?.lastName
          ),
          value: item.id
        }));

        if (dataCompleted.length === 1) {
          this.handleRMWidgetDataField(tenantField, dataCompleted);
          tenantFormControl?.setValue(tenantList[0]?.id);
          return;
        }

        const tenant = this.essentialData.find(
          (item) => item.key === tenantField
        );
        this.rmNewTenant = dataCompleted;
        tenant.values = tenantList;
        this.addFormControl(
          tenantField,
          dataCompleted.length > 1 && 'new tenant'
        );
        this.setFieldConfirmEssential(tenantField);
      });
  }

  subscribeRmNote() {
    this.widgetRMService
      .getRMWidgetStateByType<IRentManagerNote[]>(RMWidgetDataField.RM_NOTES)
      .pipe(
        takeUntil(this.destroy$),
        map((res) => {
          return res
            ? res.filter((item) => item.syncStatus === ESyncStatus.COMPLETED)
            : [];
        }),
        filter((res) => {
          return this.options[DynamicParameterType.RM_NOTES] && res.length > 0;
        })
      )
      .subscribe((data) => {
        this.addFormControl(
          RMWidgetDataField.RM_NOTES,
          data.length > 1 && 'notes'
        );
        const noteList = data?.map((item) => ({
          id: item.id,
          name:
            item?.entityType +
            ' note' +
            (item?.categoryName ? ' - ' + item?.categoryName : '') +
            (item?.nameUserPropertyGroup
              ? ' (' + item?.nameUserPropertyGroup + ')'
              : ''),
          subLabel: item?.description,
          value: item.id
        }));

        if (data.length === 1) {
          this.handleRMWidgetDataField(RMWidgetDataField.RM_NOTES, data);
          this.formGroup
            .get(RMWidgetDataField.RM_NOTES)
            ?.setValue(noteList[0]?.id);
          return;
        }
        const note = this.essentialData.find(
          (item) => item.key === RMWidgetDataField.RM_NOTES
        );
        this.rmNote = data;
        note.values = noteList;
        this.setFieldConfirmEssential(RMWidgetDataField.RM_NOTES);
      });
  }

  subscribeIngoingInspection() {
    this.widgetPTService
      .getPTWidgetStateByType<InspectionSyncData[]>(
        PTWidgetDataField.INGOING_INSPECTION
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: InspectionSyncData[]) => {
        const data = this.filterListEventCompeleted(res);
        if (
          this.options[DynamicParameterType.PT_INGOING_INSPECTION] &&
          data?.length > 0
        ) {
          this.addFormControl(
            PTWidgetDataField.INGOING_INSPECTION,
            data.length > 1 && 'ingoing inspection'
          );
          const ingoingInspectionList = data.map((item) => ({
            id: item.id,
            name: `${
              item?.userPropertyGroup?.name
            } - ${this.agencyDateFormatService.formatTimezoneDate(
              item?.startTime,
              this.dateFormatDay
            )}`,
            value: item.id
          }));

          if (data.length === 1) {
            this.handlePTWidgetDataField(
              PTWidgetDataField.INGOING_INSPECTION,
              data
            );
            this.formGroup
              .get(PTWidgetDataField.INGOING_INSPECTION)
              ?.setValue(ingoingInspectionList[0]?.id);
            return;
          }
          const ingoingInspection = this.essentialData.find(
            (item) => item.key === PTWidgetDataField.INGOING_INSPECTION
          );
          this.ingoingInspection = data;
          ingoingInspection.values = ingoingInspectionList;
          this.setFieldConfirmEssential(PTWidgetDataField.INGOING_INSPECTION);
        }
      });
  }

  subscribeCompliance() {
    this.widgetPTService
      .getPTWidgetStateByType<Compliance[]>(PTWidgetDataField.COMPLIANCES)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: Compliance[]) => {
        const data = res.length
          ? res?.filter(
              (item) =>
                item.syncStatus !== ESyncStatus.INPROGRESS &&
                item?.status === EEventStatus.OPENED
            )
          : [];
        if (
          this.options[DynamicParameterType.PT_COMPLIANCE] &&
          data.length > 0
        ) {
          this.addFormControl(
            PTWidgetDataField.COMPLIANCES,
            data.length > 1 && 'compliance item'
          );
          const complianceList = data.map((item) => ({
            id: item.id,
            name: item?.complianceCategory?.name,
            value: item.id
          }));
          if (data.length === 1) {
            this.handlePTWidgetDataField(PTWidgetDataField.COMPLIANCES, data);
            this.formGroup
              .get(PTWidgetDataField.COMPLIANCES)
              ?.setValue(complianceList[0]?.id);
            return;
          }
          const complience = this.essentialData.find(
            (item) => item.key === PTWidgetDataField.COMPLIANCES
          );
          this.compliance = data;
          complience.values = complianceList;
          this.setFieldConfirmEssential(PTWidgetDataField.COMPLIANCES);
        }
      });
  }

  subscribeEventCalendar(eventType: EEventType) {
    this.eventCalendarService
      .getListEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe((calendarEventData) => {
        const filterEvents = calendarEventData
          ?.filter(
            (event) =>
              event.eventType === eventType &&
              ![EEventStatus.CLOSED, EEventStatus.CANCELLED].includes(
                event.eventStatus
              )
          )
          .sort(
            (a, b) =>
              new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
          );
        const dynamicParameterType =
          eventType === EEventType.BREACH_REMEDY
            ? DynamicParameterType.CALENDAR_EVENT_BREACH_REMEDY_DATE
            : eventType === EEventType.ENTRY_NOTICE
            ? DynamicParameterType.CALENDAR_EVENT_ENTRY_NOTICE
            : DynamicParameterType.CALENDAR_EVENT_CUSTOM;

        if (this.options[dynamicParameterType] && filterEvents.length > 0) {
          const listEvent = filterEvents?.map((item) => ({
            id: item.id,
            name:
              item?.eventType === EEventType.BREACH_REMEDY
                ? `${item?.eventName?.replace('due', 'date')}`
                : `${item?.eventName}`,
            value: item.id,
            eventName: item?.eventName,
            subLabel: `Date/time: ${this.agencyDateFormatService.formatTimezoneDate(
              item?.eventDate,
              this.dateFormatDay
            )}`
          }));
          if (eventType === EEventType.BREACH_REMEDY) {
            this.addFormControl(
              DynamicParameterType.CALENDAR_EVENT_BREACH_REMEDY_DATE,
              listEvent.length > 1 && 'breach remedy date'
            );
          } else if (eventType === EEventType.ENTRY_NOTICE) {
            this.addFormControl(
              DynamicParameterType.CALENDAR_EVENT_ENTRY_NOTICE,
              listEvent.length > 1 && 'entry date'
            );
          } else if (eventType === EEventType.CUSTOM_EVENT) {
            this.addFormControl(
              DynamicParameterType.CALENDAR_EVENT_CUSTOM,
              listEvent.length > 1 && 'custom date'
            );
          }
          if (filterEvents.length === 1) {
            this.trudiDynamicParameterService.setDynamicParametersCalendarEventWidget(
              filterEvents[0]
            );
            if (eventType === EEventType.BREACH_REMEDY) {
              this.formGroup
                .get(DynamicParameterType.CALENDAR_EVENT_BREACH_REMEDY_DATE)
                ?.setValue(listEvent[0]?.id);
              return;
            }
            if (eventType === EEventType.CUSTOM_EVENT) {
              this.formGroup
                .get(DynamicParameterType.CALENDAR_EVENT_CUSTOM)
                ?.setValue(listEvent[0]?.id);
              return;
            }
            this.formGroup
              .get(DynamicParameterType.CALENDAR_EVENT_ENTRY_NOTICE)
              ?.setValue(listEvent[0]?.id);
            return;
          }
          const calendarEvent = this.essentialData.find(
            (item) => item.key === dynamicParameterType
          );

          if (eventType === EEventType.BREACH_REMEDY) {
            this.calendarEventBreachRemedy = filterEvents;
          } else if (eventType === EEventType.ENTRY_NOTICE) {
            this.calendarEventEntry = filterEvents;
          } else {
            this.calendarCustomEvent = filterEvents;
          }
          calendarEvent.values = listEvent;

          if (eventType === EEventType.BREACH_REMEDY) {
            this.setFieldConfirmEssential(
              DynamicParameterType.CALENDAR_EVENT_BREACH_REMEDY_DATE
            );
            return;
          }
          if (eventType === EEventType.CUSTOM_EVENT) {
            this.setFieldConfirmEssential(
              DynamicParameterType.CALENDAR_EVENT_CUSTOM
            );
            return;
          }
          this.setFieldConfirmEssential(
            DynamicParameterType.CALENDAR_EVENT_ENTRY_NOTICE
          );
          return;
        }
      });
  }

  subscribeIssues() {
    this.widgetRMService
      .getRMWidgetStateByType<IRentManagerIssue[]>(RMWidgetDataField.RM_ISSUES)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        data = data?.filter(
          (item) => item.syncStatus === ESyncStatus.COMPLETED
        );
        if (this.options[DynamicParameterType.RM_ISSUES] && data?.length > 0) {
          this.addFormControl(
            RMWidgetDataField.RM_ISSUES,
            data.length > 1 && 'issue'
          );
          const issueList = data?.map((item) => ({
            id: item?.id,
            name: `${item?.title}`,
            value: item?.id,
            subLabel: `Due date: ${dayjs(item?.dueDate).format(
              this.dateFormatDay
            )}`
          }));
          if (data.length === 1) {
            this.handleRMWidgetDataField(RMWidgetDataField.RM_ISSUES, data);
            this.formGroup
              .get(RMWidgetDataField.RM_ISSUES)
              ?.setValue(issueList[0]?.id);
            return;
          }
          const issue = this.essentialData.find(
            (item) => item.key === RMWidgetDataField.RM_ISSUES
          );
          this.issue = data;
          issue.values = issueList;
          this.setFieldConfirmEssential(RMWidgetDataField.RM_ISSUES);
        }
      });
  }

  subscribeRMInspections() {
    this.widgetRMService
      .getRMWidgetStateByType<IRentManagerInspection[]>(
        RMWidgetDataField.RM_INSPECTIONS
      )
      .pipe(
        takeUntil(this.destroy$),
        map((res) => {
          return res
            ? res.filter((item) => item.syncStatus === ESyncStatus.COMPLETED)
            : [];
        }),
        filter((res) => {
          return (
            this.options[DynamicParameterType.RM_INSPECTION] && res.length > 0
          );
        })
      )
      .subscribe((data) => {
        this.addFormControl(
          RMWidgetDataField.RM_INSPECTIONS,
          data.length > 1 && 'inspection'
        );
        const inspectionList = data?.map((item) => ({
          id: item?.id,
          name: `${item.inspectionType.name} inspection - ${
            item?.userPropertyGroup?.name
          } - ${dayjs(item?.inspectionDate).format(this.dateFormatDay)}`,
          value: item?.id
        }));
        if (data.length === 1) {
          this.handleRMWidgetDataField(RMWidgetDataField.RM_INSPECTIONS, data);
          this.formGroup
            .get(RMWidgetDataField.RM_INSPECTIONS)
            ?.setValue(inspectionList[0]?.id);
          return;
        }
        const inspection = this.essentialData.find(
          (item) => item.key === RMWidgetDataField.RM_INSPECTIONS
        );
        this.inspection = data;
        inspection.values = inspectionList;
        this.setFieldConfirmEssential(RMWidgetDataField.RM_INSPECTIONS);
      });
  }

  filterListEventCompeleted(listEvent) {
    return listEvent?.length
      ? listEvent?.filter(
          (item) =>
            item.syncStatus === ESyncStatus.COMPLETED ||
            (!item.syncStatus && item.ptId)
        )
      : [];
  }

  public getFormControl(key: string) {
    return this.formGroup.get(key);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

@Pipe({
  name: 'selectDynamicTitle'
})
export class SelectDynamicTitlePipe implements PipeTransform {
  transform(value: IEssentialItem[], essentialData): string {
    let stringValue = 'This email contains dynamic fields relevant to';

    if (!essentialData?.length) {
      value.forEach((i) => {
        stringValue += i.title;
      });
    } else {
      essentialData?.forEach((data) => {
        const item = value.find((i) => i.key === data?.key);
        if (item) {
          stringValue += item?.title;
        }
      });
    }

    return stringValue
      .replace(/,(?=[^,]*$)/g, '.')
      .replace(/,([^,]*)$/, ' and$1');
  }
}
