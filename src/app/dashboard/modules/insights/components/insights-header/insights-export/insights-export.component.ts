import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import {
  EExportType,
  ERangeDateType
} from '@/app/dashboard/modules/insights/enums/insights.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { Subject, filter, switchMap, takeUntil } from 'rxjs';
import { INSIGHTS_RANGE_TIME_DATA } from '@/app/dashboard/modules/insights/constants/insights.constant';
import { IExtraAgent } from '@/app/dashboard/modules/insights/interfaces/insights.interface';
import { InsightsApiService } from '@/app/dashboard/modules/insights/services/insights-api.service';
import { InsightsService } from '@/app/dashboard/modules/insights/services/insights.service';
import {
  AgencyDateFormatService,
  RegionDateFormat
} from '@/app/dashboard/services/agency-date-format.service';
import { IndividualConfig, ToastrService } from 'ngx-toastr';
import { ICompany } from '@shared/types/company.interface';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'insights-export',
  templateUrl: './insights-export.component.html',
  styleUrls: ['./insights-export.component.scss']
})
export class InsightsExportComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isLoading = true;
  @Input() listOfAgents = null;
  @Input() selectedAgentId = '';

  private destroy$ = new Subject<void>();
  public period = '';
  public selectedAgent: IExtraAgent = null;
  public currentCompany: ICompany;
  public isUrgent = false;
  public taskNameIds = [];
  public dateFormat: RegionDateFormat;

  public readonly INSIGHTS_RANGE_TIME_DATA = INSIGHTS_RANGE_TIME_DATA;

  public readonly EExportType = EExportType;

  public visibleDropdown = false;

  public readonly LIST_FILE_EXPORTS = [
    {
      label: 'PDF',
      type: EExportType.PDF
    },
    {
      label: 'CSV',
      type: EExportType.CSV
    },
    {
      label: 'XLSX',
      type: EExportType.XLSX
    }
  ];

  public currentExportType = EExportType.PDF;

  public currentInsightFilter;
  private toastConfigs: Partial<IndividualConfig> = { timeOut: 3000 };

  constructor(
    private agencyService: AgencyService,
    private insightApiService: InsightsApiService,
    private insightsService: InsightsService,
    private agencyDateFormatService: AgencyDateFormatService,
    private toastService: ToastrService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.agencyDateFormatService.dateFormat$
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => !!res),
        switchMap((dateFormat) => {
          this.dateFormat = dateFormat;
          return this.insightsService.insightsFilter$;
        })
      )
      .subscribe((currentInsightFilter) => {
        this.currentInsightFilter = currentInsightFilter;
        if (this.currentInsightFilter.type === ERangeDateType.ALL_TIME) {
          this.period = 'All time';
          return;
        }

        this.period = `${this.formatPeriodDate(
          currentInsightFilter.startDate
        )} - ${this.formatPeriodDate(currentInsightFilter.endDate)}`;
      });

    this.insightsService
      .getInsightUserActivities()
      .pipe()
      .subscribe((value) => {
        this.isUrgent = value.isUrgent;
        this.taskNameIds = value.taskNameIds;
      });
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        if (!company) return;
        this.currentCompany = company;
      });
  }

  ngOnChanges(changes) {
    if (changes['selectedAgentId']) {
      this.selectedAgent = this.listOfAgents.find(
        (res) => res.id === this.selectedAgentId
      );
    }
  }

  private formatPeriodDate(date: string) {
    return this.agencyDateFormatService
      .agencyDayJs(date)
      .format(this.dateFormat.DATE_FORMAT_DAYJS);
  }

  handleVisibleChange(event) {
    this.visibleDropdown = event;
  }

  handleExportPdf() {
    const insightHtml = document
      .querySelector('.insights-container')
      ?.cloneNode(true) as HTMLElement;

    const head = window.document.querySelector('head').innerHTML;

    const windowWidth = window.screen.availWidth;
    const windowHeight = window.screen.availHeight;

    const windowPrint = window.open(
      '',
      '',
      `left=0,top=24,width=${windowWidth},height=${windowHeight},toolbar=0,scrollbars=0,status=0`
    );

    const replaceChars = {
      '/': '-',
      ' ': '_'
    };

    let fileName = `${this.currentCompany?.name || ''}_insights_in_${
      this.period
    }`;
    fileName = fileName.replace(/[\/\s/]/g, (m) => replaceChars[m]);

    windowPrint.document.write(
      `<html>
        <head>
          <title>${fileName}</title>
          ${head}
          <link rel="stylesheet" href="/assets/styles/insight-print.css" type="text/css" />
          </head>
          <body>
            <div class="insight-print-wrapper">
              <p class="print-title"> ${this.currentCompany?.name || ''} in ${
        this.period
      } for ${this.selectedAgent?.fullName || ''} </p>
              ${insightHtml?.outerHTML || ''}
              </div>
          </body>
        </html>
          `
    );

    windowPrint.document.close();
    windowPrint.addEventListener('load', function load() {
      windowPrint.focus();
      windowPrint.print();
    });

    windowPrint.addEventListener('afterprint', function afterPrint() {
      windowPrint.close();
    });

    return;
  }

  handleExport(type: EExportType) {
    switch (type) {
      case EExportType.PDF:
        this.handleExportPdf();
        break;
      case EExportType.CSV:
      case EExportType.XLSX:
        this.insightApiService
          .getFileExport({
            userId: this.currentInsightFilter?.userId,
            startDate: this.currentInsightFilter?.startDate,
            endDate: this.currentInsightFilter?.endDate,
            isUrgent: this.isUrgent,
            type,
            taskNameIds: this.taskNameIds
          })
          .subscribe({
            next: (res) => {
              const a = document.createElement('a');
              a.href = res.url;
              a.download = res.name;
              a.click();
            },
            error: () => {
              this.toastService.error('Export failed', '', this.toastConfigs);
            }
          });
        break;
      default:
        break;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
