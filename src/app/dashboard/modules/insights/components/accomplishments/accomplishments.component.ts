import { Component, OnInit, Input } from '@angular/core';
import { IAccomplishments } from '@/app/dashboard/modules/insights/interfaces/insights.interface';
import {
  EAccomplishments,
  ESingularTypeDataAccomplishment,
  EManyTypeDataAccomplishments,
  EPropertyByCountry
} from '@/app/dashboard/modules/insights/enums/insights.enum';
import { getTypeOfProperty } from '@/app/dashboard/modules/insights/utils/function';
import { CountryService } from '@/app/dashboard/services/country.service';
import { Subject, takeUntil } from 'rxjs';
import { InsightsService } from '@/app/dashboard/modules/insights/services/insights.service';

@Component({
  selector: 'accomplishments',
  templateUrl: './accomplishments.component.html',
  styleUrls: ['./accomplishments.component.scss']
})
export class AccomplishmentsComponent implements OnInit {
  @Input() properties: number;
  @Input() public accomplishmentsData: IAccomplishments[];
  public data;
  public currentCountry: string;
  private accomplishmentTypes = [
    EAccomplishments.TIME_SAVED,
    EAccomplishments.EFFICIENCY,
    EAccomplishments.ENQUIRY,
    EAccomplishments.TASK
  ];
  private unsubscribe = new Subject<void>();

  constructor(
    private countryService: CountryService,
    private insightsService: InsightsService
  ) {}

  ngOnInit(): void {
    this.countryService.currentInformationCountry$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentInforCountry) => {
        this.currentCountry = currentInforCountry.countryName;
      });
    this.transformDataAccomplishments(this.accomplishmentsData);
  }

  transformDataAccomplishments(accomplishmentsData: IAccomplishments[]) {
    this.sortData(accomplishmentsData);
    this.data = accomplishmentsData.map((item) => {
      item = this.addTrendStatus(item);
      return this.addTypeBox(item);
    });
  }

  sortData(accomplishmentsData: IAccomplishments[]) {
    accomplishmentsData.sort((a, b) => {
      return (
        this.accomplishmentTypes.indexOf(a.dataType) -
        this.accomplishmentTypes.indexOf(b.dataType)
      );
    });
  }

  addTypeBox(item: IAccomplishments) {
    let typeBox:
      | EManyTypeDataAccomplishments
      | ESingularTypeDataAccomplishment
      | EPropertyByCountry;
    let properties: number;
    switch (item.dataType) {
      case EAccomplishments.TIME_SAVED:
        if (item.total !== 1) {
          typeBox = EManyTypeDataAccomplishments.TIME;
        } else {
          typeBox = ESingularTypeDataAccomplishment.TIME;
        }
        break;
      case EAccomplishments.EFFICIENCY:
        properties = this.properties;
        typeBox = getTypeOfProperty(item.total, this.currentCountry);
        break;
      case EAccomplishments.ENQUIRY:
        if (item.total !== 1) {
          typeBox = EManyTypeDataAccomplishments.ENQUIRES;
        } else {
          typeBox = ESingularTypeDataAccomplishment.ENQUIRES;
        }
        break;
      case EAccomplishments.TASK:
        if (item.total !== 1) {
          typeBox = EManyTypeDataAccomplishments.TASK;
        } else {
          typeBox = ESingularTypeDataAccomplishment.TASK;
        }
        break;
      default:
        break;
    }

    return {
      ...item,
      typeBox: typeBox,
      properties: properties
    };
  }

  handleClickViewDetails(dataType) {
    this.insightsService.setInsightsAccomplishmentsType(dataType);
  }

  addTrendStatus(item: IAccomplishments) {
    let trendStatus: boolean;

    if (item.percent !== 0) {
      trendStatus = item.percent > 0;
      item.percent = item.percent !== null ? +item.percent.toFixed(2) : null;
    }

    return {
      ...item,
      trend: trendStatus,
      total: item.total ? Number(item.total?.toFixed(2)) : item.total,
      equivalent: Number(item.equivalent?.toFixed(2))
    };
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
