import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, NavigationExtras } from '@angular/router';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { AgencyService as AppAgencyService } from '@services/agency.service';
import { CalendarService } from '@services/calendar.service';
import { POPUP_TYPE } from '@services/constants';
import { HolidayItem, RegionInfo } from '@shared/types/agency.interface';
import { LoadingService } from './../services/loading.service';
import { ECRMId } from '@shared/enum/share.enum';
import { cloneDeep, isEqual } from 'lodash-es';
import { ERepeatType } from '@shared/enum/calendar.enum';
import dayjs from 'dayjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'calendar-view',
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.scss']
})
export class CalendarViewComponent implements OnInit, OnDestroy {
  public showCreateHoliday = false;
  public showModalDuplicateDate = false;
  public isShowRemoveHoliday: boolean = false;
  public popupState = {
    showAddHoliday: false
  };
  public addHolidayTitle = 'Create a holiday';
  public stateList = [];
  public holidayListDefault = [];
  public holidayListNotDefault = [];
  public agencyId: string;
  public regionId: string;
  public nameChosen: string;
  public holidayId: string;
  public nameChange: string;
  public currentRegionId: string;
  public CURREN_DATE = new Date();
  public CURRENT_YEAR = this.CURREN_DATE.getFullYear();
  public yearNumber: number = this.CURRENT_YEAR;
  public dateHoliday: Date;
  public isRemoveHoliday: boolean = false;
  public deletedHolidayId: string = '';
  public listYearCalled: number[] = [this.CURRENT_YEAR];
  public currentRegionName: string = '';
  public listHoliday = [];
  public listItemDeleted: HolidayItem[] = [];
  public isDisabled: boolean = false;

  public setWorkingForm: FormGroup;
  public holidayData: HolidayItem[];
  public holidays: Date[] = [];
  public popupType = POPUP_TYPE;
  public removeHolidayData: any[] = [];
  public holidayUpdateList: {
    holidayId: string;
    regionId: string;
    isActive: boolean;
  }[] = [];
  private subscribers = new Subject<void>();
  public popupRemoveTitle: string = '';
  public dayOffsOfWeek: number[];
  private typeCRM: ECRMId;
  private destroy$ = new Subject<boolean>();

  constructor(
    private formBuilder: FormBuilder,
    private readonly agencyService: AgencyService,
    private readonly appAgencyService: AppAgencyService,
    private router: Router,
    private loadingService: LoadingService,
    private calenderService: CalendarService,
    private agencyDateFormatService: AgencyDateFormatService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        if (!company) return;
        this.typeCRM = company?.CRM as ECRMId;
        this.getCurrentRegionExist();
        this.getDayOffsOfWeek();
      });
    this.initForm();
    this.listenSetOriginHoliday();
  }

  listenSetOriginHoliday() {
    this.calenderService.originHolidayList$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.isDisabled = false;
        let holidayListNotDefault = [];
        let holidayListDefault = [];
        this.holidayData = cloneDeep(res);
        this.sortByDate(this.holidayData);
        const holidayGroupByDateType = this.groupDataBy(
          cloneDeep(this.holidayData),
          'isDefault'
        );
        const holidayListNotDefaultEnTries = Object.entries(
          this.groupDataBy(holidayGroupByDateType['false'], 'holidayId')
        );
        const holidayListDefaultEnTries = Object.entries(
          this.groupDataBy(holidayGroupByDateType['true'], 'holidayId')
        );
        holidayListNotDefaultEnTries.forEach((item) => {
          const availableYear = this.groupAvailableYear(item[1]);
          holidayListNotDefault.push({ ...item, availableYear });
        });
        holidayListDefaultEnTries.forEach((item) => {
          const availableYear = this.groupAvailableYear(item[1]);
          holidayListDefault.push({ ...item, availableYear });
        });
        this.holidayListNotDefault = holidayListNotDefault;
        this.holidayListDefault = holidayListDefault;
      });
  }

  handleChangeYear(yearNumber: number) {
    this.yearNumber = yearNumber;
  }

  groupAvailableYear(data) {
    return Array.from(
      new Set(
        (data as Array<any>).map((holiday) => +holiday?.date?.substring(0, 4))
      )
    );
  }

  handleSetHoliday(date: Date) {
    if (date) {
      this.showCreateHoliday = true;
      this.dateHoliday =
        this.agencyDateFormatService.expectedTimezoneDate(date);
    }
  }

  handleRemoveHoliday(holiday: any) {
    const targetId = holiday?.dayOffValue?.holidayId;
    this.holidayData = this.holidayData.map((it) => {
      if (it?.holidayId === targetId) {
        return { ...it, isActive: false };
      }
      return { ...it };
    });
    const foundHolidayList =
      this.holidayListDefault.find((item) => item[0] === targetId) ||
      this.holidayListNotDefault.find((item) => item[0] === targetId);
    foundHolidayList[1]?.forEach((it) => {
      it.isActive = false;
    });
  }

  trackByFunction(index: number): any {
    return index;
  }

  public initForm() {
    this.setWorkingForm = this.formBuilder.group({
      state: this.formBuilder.control(null, [Validators.required])
    });
  }

  getCurrentRegionExist() {
    this.agencyService
      .getWorkingHoursExist()
      .pipe(takeUntil(this.subscribers))
      .subscribe({
        next: (data) => {
          if (!data || data?.message) return;
          this.currentRegionId = data.id;
        },
        error: () => {},
        complete: () => {
          this.getListRegion();
        }
      });
  }

  getListRegion() {
    this.appAgencyService.getListRegion().subscribe({
      next: (data) => {
        if (!data) return;
        data = data.map((item) => ({
          ...item,
          label: item.alias[1]
        }));
        this.stateList = data;
      },
      error: () => {},
      complete: () => {
        let stateIndex = 0;
        if (this.currentRegionId) {
          stateIndex = this.stateList.findIndex(
            (item) => item.id === this.currentRegionId
          );
          this.getStateWorking.setValue(this.stateList[stateIndex]);
        }
        this.getListCalendarByRegion(
          this.getStateWorking.value?.id,
          this.CURRENT_YEAR
        );
        this.regionId = this.getStateWorking.value?.id;
      }
    });
  }

  groupDataBy(data: any[], field: string) {
    return data
      ? data.reduce((result, item) => {
          result[item[field]] = result[item[field]] || [];
          result[item[field]].push(item);
          return result;
        }, Object.create(null))
      : {};
  }

  sortByDate(arr) {
    arr.sort(function (a, b) {
      return Number(new Date(a.date)) - Number(new Date(b.date));
    });

    return arr;
  }

  getListCalendarByRegion(regionId: string, year: number) {
    if (!regionId) return;
    const observables = [];
    for (let start = year - 2; start <= year + 2; start++) {
      observables.push(
        this.calenderService.getViewCalendarByRegion(regionId, start)
      );
    }
    forkJoin(observables)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (data && JSON.stringify(data) !== '{}') {
            this.calenderService.setOriginHoliday(data.flat());
          }
        },
        error: () => {},
        complete: () => {
          this.loadingService.stopLoading();
        }
      });
  }

  getDayOffsOfWeek() {
    this.agencyService.getWorkingHoursExist().subscribe((res) => {
      const dayOffs = res.regionWorkingHours
        .filter((day) => !day.isEnable)
        .map((day) => {
          switch (day.dayInWeek) {
            case 'SUNDAY':
              return 0;
            case 'MONDAY':
              return 1;
            case 'TUESDAY':
              return 2;
            case 'WEDNESDAY':
              return 3;
            case 'THURSDAY':
              return 4;
            case 'FRIDAY':
              return 5;
            case 'SATURDAY':
              return 6;
            default:
              return -1;
          }
        });
      this.dayOffsOfWeek = dayOffs;
    });
  }

  onChangeState(event: RegionInfo) {
    this.getListCalendarByRegion(
      event.id,
      this.yearNumber || this.CURRENT_YEAR
    );
    this.regionId = event.id;
  }

  getHolidays(regionId: string) {
    this.calenderService
      .getHolidaysAPI(regionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.calenderService.setHolidaysList(res);
      });
  }

  handlePopupState(state: {}) {
    this.popupState = { ...this.popupState, ...state };
  }

  handleSubmitHoliday(data: HolidayItem) {
    if (data) {
      const isDuplicate = this.checkDuplicate(data);
      if (!isDuplicate) {
        let newHoliday;
        let availableYear;
        switch (data.typeRepeat) {
          case ERepeatType.ONCE:
            newHoliday = [data?.id, [data], ['availableYear']];
            availableYear = this.groupAvailableYear([data]);
            this.holidayData = [...this.holidayData, data];
            break;
          case ERepeatType.ANNUALLY:
            const yearRepeat = this.repeatOfYear(data);
            availableYear = this.groupAvailableYear(yearRepeat);
            newHoliday = [data?.id, yearRepeat];
            this.holidayData = [...this.holidayData, ...yearRepeat];
            break;
          case ERepeatType.MONTHLY:
            const monthRepeat = this.repeatOfMonth(data);
            availableYear = this.groupAvailableYear(monthRepeat);
            newHoliday = [data?.id, monthRepeat];
            this.holidayData = [...this.holidayData, ...monthRepeat];
            break;
          default:
            break;
        }
        this.holidayListNotDefault.push({ ...newHoliday, availableYear });
      }
    }
    this.showCreateHoliday = false;
  }

  repeatOfMonth(holiday: HolidayItem) {
    const monthLimit = 60;
    const eventDataArray = [];
    for (let i = 0; i < monthLimit; i++) {
      const newEventData = cloneDeep(holiday);
      const currentDate = new Date(newEventData.date);
      currentDate.setMonth(currentDate.getMonth() + i);
      const newDate = dayjs(currentDate).format('YYYY-MM-DD');
      newEventData.date = newDate;
      eventDataArray.push(newEventData);
    }
    return eventDataArray;
  }

  repeatOfYear(holiday: HolidayItem) {
    const limit = 5;
    const newEventData = [];

    for (let i = 0; i < limit; i++) {
      const newData = cloneDeep(holiday);
      const date = new Date(newData.date);
      date.setFullYear(date.getFullYear() + i);
      newData.date = dayjs(date).format('YYYY-MM-DD');
      newEventData.push(newData);
    }
    return newEventData;
  }

  handleCloseModal() {
    this.showCreateHoliday = false;
  }

  openAddHoliday() {
    this.dateHoliday = null;
    this.showCreateHoliday = true;
  }

  onBackContact() {
    const navigationExtras: NavigationExtras = {
      state: { fromCurrentPage: true }
    };
    this.router.navigate(
      [`dashboard/agency-settings/agency-details`],
      navigationExtras
    );
  }

  handleDiscardChanges() {
    const isNotChange = this.checkHolidayNotChange();
    if (isNotChange) return;
    this.listItemDeleted = [];
    const origin = this.calenderService.originHolidayList;
    this.calenderService.setOriginHoliday(origin);
  }

  onCheckboxHoliday(holiday: HolidayItem) {
    this.holidayData = this.holidayData?.map((it) => {
      if (holiday?.id === it?.id) {
        return { ...it, isActive: holiday?.isActive };
      }
      const annually = `${dayjs(it?.date).date()}-${
        dayjs(it?.date).month() + 1
      }`;
      const currAnnually = `${dayjs(holiday?.date).date()}-${
        dayjs(holiday?.date).month() + 1
      }`;
      if (
        annually === currAnnually &&
        holiday.typeRepeat === ERepeatType.ANNUALLY
      ) {
        return { ...it, isActive: holiday?.isActive };
      }
      return { ...it };
    });
  }

  removeHolidayOther(holiday: HolidayItem) {
    const idx = this.holidayListNotDefault.findIndex(
      (it) => it[0] === holiday?.holidayId
    );
    switch (holiday.typeRepeat) {
      case ERepeatType.ONCE:
        if (idx != -1) {
          this.listItemDeleted = [
            ...this.listItemDeleted,
            this.holidayListNotDefault[idx][1][0]
          ];
          this.holidayListNotDefault.splice(idx, 1);
          this.holidayData = this.holidayData.filter(
            (it) => !(it?.id === holiday?.id)
          );
        }
        break;
      case ERepeatType.ANNUALLY:
      case ERepeatType.MONTHLY:
        this.listItemDeleted = [
          ...this.listItemDeleted,
          this.holidayListNotDefault[idx][1][0]
        ];
        this.holidayListNotDefault = this.holidayListNotDefault.filter(
          (it) => !(it[0] === holiday?.id)
        );
        this.holidayData = this.holidayData.filter(
          (it) => !(it?.id === holiday?.id)
        );
        break;
      default:
        break;
    }
  }

  checkHolidayNotChange() {
    const oldHolidayData = cloneDeep(
      this.calenderService.originHolidayList
    ).sort((a, b) => new Date(a?.date).getTime() - new Date(b?.date).getTime());
    const currHolidayData = cloneDeep(this.holidayData).sort(
      (a, b) => new Date(a?.date).getTime() - new Date(b?.date).getTime()
    );
    return isEqual(oldHolidayData, currHolidayData);
  }

  handleUpdateHoliday() {
    const isNotChange = this.checkHolidayNotChange();
    if (isNotChange) return;
    this.isDisabled = true;
    const updatedItemList = this.holidayData.filter(
      (item) => !item?.holidayId?.startsWith('holiday-temp-id')
    );
    const uniqueNewIds = {};
    const addedItemsList = this.holidayData
      .filter((item) => item?.holidayId?.startsWith('holiday-temp-id'))
      .filter((item) => {
        if (!uniqueNewIds[item.id]) {
          uniqueNewIds[item.id] = true;
          return true;
        }
        return false;
      })
      .map((item) => {
        return {
          date: item.date,
          name: item.name,
          regionId: item.regionId,
          typeRepeat: item.typeRepeat
        };
      });
    const body = {
      addedItems: [...updatedItemList, ...addedItemsList],
      removedItems: this.listItemDeleted
    };

    this.calenderService.saveChangeMultiHoliday(body).subscribe((res) => {
      if (res && this.getStateWorking.value?.id) {
        this.getListCalendarByRegion(
          this.getStateWorking.value?.id,
          this.CURRENT_YEAR
        );
        this.getHolidays(this.getStateWorking.value?.id);
      }
    });
  }

  checkDuplicate(data: HolidayItem): boolean {
    let duplicateIdx;
    switch (data?.typeRepeat) {
      case ERepeatType.ONCE:
        duplicateIdx = this.holidayData.findIndex(
          (it) => it?.typeRepeat === data?.typeRepeat && it?.date === data?.date
        );
        break;
      case ERepeatType.MONTHLY:
        duplicateIdx = this.holidayData.findIndex((it) => {
          const oldDay = `${dayjs(it?.date).date()}`;
          const newDay = `${dayjs(data?.date).date()}`;
          return it?.typeRepeat === data?.typeRepeat && oldDay === newDay;
        });
        break;
      case ERepeatType.ANNUALLY:
        duplicateIdx = this.holidayData.findIndex((it) => {
          const oldDayAndMonth = `${dayjs(it?.date).date()}-${
            dayjs(it?.date).month() + 1
          }`;
          const newDayAndMonth = `${dayjs(data?.date).date()}-${
            dayjs(data?.date).month() + 1
          }`;
          return (
            it?.typeRepeat === data?.typeRepeat &&
            oldDayAndMonth === newDayAndMonth
          );
        });
        break;
      default:
        break;
    }
    if (duplicateIdx === -1) return false;
    const duplicateDay = this.holidayData[duplicateIdx];
    this.nameChosen = data.name;
    this.holidayId = duplicateDay?.holidayId;
    this.nameChange = duplicateDay.name;
    this.showCreateHoliday = false;
    this.showModalDuplicateDate = true;
    return true;
  }

  handleCloseModalDuplicate(status) {
    if (!status) {
      this.showModalDuplicateDate = false;
      this.showCreateHoliday = false;
    }
  }

  handleConfirmChange(data) {
    const targetId = data?.holidayId;
    this.holidayData = this.holidayData.map((it) => {
      if (targetId === it?.holidayId) {
        return { ...it, name: data?.nameChose, isActive: true };
      }
      return { ...it };
    });

    let foundHolidayList =
      this.holidayListDefault.find((item) => item[0] === targetId) ||
      this.holidayListNotDefault.find((item) => item[0] === targetId);

    foundHolidayList[1]?.forEach((it) => {
      if (it?.holidayId === targetId) {
        it.name = data?.nameChose;
        it.isActive = true;
      }
    });
    this.showModalDuplicateDate = false;
  }

  get getStateWorking() {
    return this.setWorkingForm?.get('state');
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
