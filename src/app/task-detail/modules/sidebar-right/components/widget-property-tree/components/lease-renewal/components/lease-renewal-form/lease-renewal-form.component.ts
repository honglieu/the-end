import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { PropertiesService } from '@services/properties.service';
import { Subject, filter, merge, takeUntil } from 'rxjs';
import {
  DEFAULT_CHAR_TRUDI_NUMBER_FIELD,
  TENANCY_STATUS
} from '@services/constants';
import { differenceInCalendarDays } from 'date-fns';
import {
  LeaseRenewalSyncDateType,
  LeaseRenewalSyncStatus
} from '@shared/enum/lease-renewal-Request.enum';
import dayjs from 'dayjs';
import { IPersonalInTab, Personal } from '@shared/types/user.interface';
import { WidgetFormPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property-form.service';
import {
  EPropertyTreeType,
  LIST_TYPE_RENT
} from '@/app/task-detail/utils/functions';
import { FormControl, FormGroup } from '@angular/forms';
import { TrudiService } from '@services/trudi.service';
import { IFile } from '@shared/types/file.interface';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { FilesService } from '@services/files.service';
import { FileUploadProp } from '@shared/types/share.model';
import { LeaseRenewalService } from '@services/lease-renewal.service';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ITenanciesMapped } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { FrequencyRental } from '@shared/types/trudi.interface';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

interface IFileSync extends IFile {
  isReiForm: boolean;
}

@Component({
  selector: 'lease-renewal-form',
  templateUrl: './lease-renewal-form.component.html',
  styleUrls: ['./lease-renewal-form.component.scss']
})
export class LeaseRenewalFormComponent implements OnInit, OnDestroy {
  @Input() readonly: boolean = false;
  @Input() readonlyTenancy: boolean = false;
  @Input() disableRemoveButton: boolean = false;
  @Input() showLeaseRenewalModal: boolean = false;
  @ViewChild('selectRentType') selectRentType!: NgSelectComponent;
  @ViewChild('selectTenancy') selectTenancy!: NgSelectComponent;
  @Output() clickCancel = new EventEmitter();
  @Output() listOfFile = new EventEmitter();
  @Output() setStatusSyncButton = new EventEmitter<boolean>();
  private componentDestroyed$ = new Subject<void>();
  private originalLeaseStartDate;
  public tenanciesOptions = [];
  public dataDateType = LeaseRenewalSyncDateType;
  public listRent = LIST_TYPE_RENT;
  public listOfFiles: IFileSync[] = [];
  public listTenancies: Personal[];
  public labelAttachFile = 'Attach file';
  public iconAttachFile = 'iconUploadV2';
  readonly DEFAULT_CHAR_TRUDI_NUMBER_FIELD = DEFAULT_CHAR_TRUDI_NUMBER_FIELD;

  get leaseRenewalForm() {
    return this.widgetFormPTService.leaseRenewalForm;
  }

  get tenancyControl() {
    return this.leaseRenewalForm.get('tenancy');
  }

  get leaseStartControl() {
    return this.leaseRenewalForm.get('leaseStart');
  }

  get leaseEndControl() {
    return this.leaseRenewalForm.get('leaseEnd');
  }

  get rentScheduleControl() {
    return this.leaseRenewalForm.get('rentSchedule');
  }

  get rentTypeControl() {
    return this.leaseRenewalForm.get('rentType');
  }

  get rentEffectiveControl() {
    return this.leaseRenewalForm.get('rentEffective');
  }

  constructor(
    private widgetFormPTService: WidgetFormPTService,
    private propertyService: PropertiesService,
    private trudiService: TrudiService,
    private widgetPTService: WidgetPTService,
    private filesService: FilesService,
    private leaseRenewalService: LeaseRenewalService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  ngOnInit(): void {
    const popupWidgetState$ = this.widgetPTService.popupWidgetState$;
    const openPopupWidgetState$ =
      this.leaseRenewalService.openPopupWidgetState$;

    merge(popupWidgetState$, openPopupWidgetState$)
      .pipe(
        takeUntil(this.componentDestroyed$),
        filter((state) => state === EPropertyTreeType.LEASE_RENEWAL)
      )
      .subscribe(() => {
        this.resetControlNgSelect();
        this.getSelectTenancy();
        this.getOriginalLeaseStartDate();
      });
  }

  getOriginalLeaseStartDate() {
    this.propertyService.peopleList$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((res) => {
        const filterList = [TENANCY_STATUS.active, TENANCY_STATUS.vacating];
        this.tenanciesOptions = this.getFilteredAndMappedTenancies(
          res,
          filterList
        );
        const matchedLeaseItem = this.leaseRenewalService.findGroupLeaseById(
          this.tenanciesOptions[0]?.id,
          res?.tenancies
        );
        this.originalLeaseStartDate = matchedLeaseItem?.originalLeaseStartDate;
      });
  }

  getSelectTenancy() {
    const dataWidgetLease = this.widgetPTService.leaseRenewals.value || [];
    if (dataWidgetLease.length) {
      const { syncData } = this.trudiService.getTrudiResponse.value || {};

      this.readonlyTenancy = this.hasNonEmptyObject(syncData);

      const {
        startDate: leaseStart,
        endDate: leaseEnd,
        rent,
        frequency: rentType,
        tenancyId: tenancy,
        effectiveDate: rentEffective,
        status,
        isSuccessful
      } = dataWidgetLease[0];

      const {
        frequencyRent,
        leaseEnd: leaseEndAmount,
        leaseStart: leaseStartAmount,
        rent: rentAmount
      } = this.leaseRenewalService.getPrefillDataFromLastStep(
        leaseStart,
        leaseEnd,
        rent,
        rentType as FrequencyRental
      );

      const bodyFormatLease = {
        leaseStart: leaseStartAmount,
        leaseEnd: leaseEndAmount,
        rentSchedule: rentAmount,
        rentType: frequencyRent,
        tenancy,
        rentEffective
      };
      this.widgetFormPTService.leaseRenewalForm.patchValue(bodyFormatLease);
      if (status !== LeaseRenewalSyncStatus.FAILED || isSuccessful) {
        this.widgetFormPTService.leaseRenewalForm.get('tenancy').disable();
      }
    }
    this.propertyService.peopleList$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((res) => {
        if (!dataWidgetLease.length) {
          this.widgetFormPTService.leaseRenewalForm.get('tenancy').enable();
        }
        this.listTenancies = res?.tenancies || [];
        const filterList = [TENANCY_STATUS.active, TENANCY_STATUS.vacating];
        this.tenanciesOptions = this.getFilteredAndMappedTenancies(
          res,
          filterList
        );

        if (this.tenanciesOptions.length === 1 && !dataWidgetLease.length) {
          const matchedLeaseItem = this.leaseRenewalService.findGroupLeaseById(
            this.tenanciesOptions[0].id,
            res?.tenancies
          );
          this.prefillLeaseData(
            matchedLeaseItem,
            this.widgetFormPTService.leaseRenewalForm
          );
        }
      });
  }

  handleChangeTenancies(item) {
    if (!item) return;
    const matchedLeaseItem = this.leaseRenewalService.findGroupLeaseById(
      item?.id,
      this.listTenancies
    );
    this.prefillLeaseData(
      matchedLeaseItem,
      this.widgetFormPTService.leaseRenewalForm
    );
  }

  resetControlNgSelect() {
    this.rentTypeControl.patchValue(null);
    this.tenancyControl.patchValue(null);
    this.selectTenancy?.handleClearClick();
    this.selectRentType?.handleClearClick();
  }

  onClearFrequencyType() {
    this.rentTypeControl.patchValue(null);
    this.selectRentType.handleClearClick();
  }

  getFilteredAndMappedTenancies(
    res: IPersonalInTab,
    filterList: string[]
  ): { id: string; label: string }[] {
    return (
      res?.tenancies.filter((tenant) => filterList.includes(tenant.status)) ||
      []
    )
      .sort((a, b) => a?.name?.localeCompare(b?.name))
      .map(({ id, name }) => ({ id, label: name }));
  }

  hasNonEmptyObject(arr) {
    return (
      Array.isArray(arr) && arr.some((item) => Object.keys(item).length > 0)
    );
  }

  prefillLeaseData(
    matchedLeaseItem: ITenanciesMapped,
    leaseRenewalForm: FormGroup
  ) {
    const { startDate, endDate, rentAmount, frequency, idUserPropertyGroup } =
      matchedLeaseItem || {};

    const { frequencyRent, leaseEnd, leaseStart, rent } =
      this.leaseRenewalService.getPrefillDataFromLastStep(
        startDate,
        endDate,
        rentAmount,
        frequency as FrequencyRental
      );

    const dataPrefillLease = {
      leaseEnd: leaseEnd
        ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            leaseEnd
          )
        : '',
      leaseStart: leaseStart
        ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            leaseStart
          )
        : '',
      rentSchedule: rent,
      rentType: frequencyRent,
      tenancy: idUserPropertyGroup
    };

    leaseRenewalForm.patchValue({ ...dataPrefillLease });
  }

  handleDefaultDateLease(value: string, name?: string) {
    if (value === 'Invalid Date') {
      return;
    }
    this.updateLeaseDateValue(
      name,
      value,
      this.leaseStartControl as FormControl,
      this.leaseEndControl as FormControl
    );
  }

  getUploadedFile(file: FileUploadProp) {
    this.listOfFile.emit(file);
  }
  handleSetStatusSyncButton(status) {
    this.setStatusSyncButton.emit(status);
  }
  updateLeaseDateValue(
    name: string,
    value: string,
    startControl: FormControl,
    endControl: FormControl
  ) {
    if (name === LeaseRenewalSyncDateType.leaseStart) {
      startControl.patchValue(value);
      if (dayjs(value).isSameOrAfter(dayjs(endControl?.value))) {
        endControl.patchValue(dayjs(value).add(1, 'd').toDate());
      }
    } else if (name === LeaseRenewalSyncDateType.leaseEnd) {
      endControl.patchValue(value);
      if (dayjs(value).isSameOrBefore(dayjs(startControl?.value))) {
        endControl.patchValue(dayjs(startControl?.value).add(1, 'd').toDate());
      }
    }
  }

  disabledPastDate = (current: Date): boolean =>
    differenceInCalendarDays(current, new Date(this.originalLeaseStartDate)) <
    0;

  onCancel() {
    this.clickCancel.emit(false);
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
