import { Component, Input, OnInit } from '@angular/core';
import { ECriteria } from '@/app/dashboard/modules/insights/enums/insights.enum';
import {
  IRankings,
  ITopPerformings,
  ITransformedTopPerforming
} from '@/app/dashboard/modules/insights/interfaces/insights.interface';
import { Subject, takeUntil } from 'rxjs';
import { CountryService } from '@/app/dashboard/services/country.service';

@Component({
  selector: 'top-performing-team-members',
  templateUrl: './top-performing-team-members.component.html',
  styleUrls: ['./top-performing-team-members.component.scss']
})
export class TopPerformingTeamMembersComponent implements OnInit {
  public CRITERIA_DROPBOX = [
    {
      id: ECriteria.TIME_SAVED,
      label: 'Time saved',
      topPerformanceLabel: 'Hours'
    },
    {
      id: ECriteria.EFFICIENCY,
      label: 'Efficiency',
      topPerformanceLabel: 'Properties/Team member'
    },
    {
      id: ECriteria.RESOLVED_ENQUIRIES,
      label: 'Resolved enquiries',
      topPerformanceLabel: 'Resolved enquiries'
    },
    {
      id: ECriteria.COMPLETED_TASK,
      label: 'Completed tasks',
      topPerformanceLabel: 'Completed tasks'
    }
  ];
  public currentCriteria = null;
  public propertyTextByCountry: string;
  public transformTopPerformingData: ITransformedTopPerforming[];
  public currentTopPerformanceLabel: string = '';
  private unsubscribe = new Subject<void>();
  @Input() topPerformingTeamMembers: ITopPerformings;

  constructor(private countryService: CountryService) {}

  ngOnInit(): void {
    this.currentCriteria = this.CRITERIA_DROPBOX[0].id;
    this.changeCurrentCriteria(this.currentCriteria);
    this.countryService.currentInformationCountry$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentInforCountry) => {
        this.propertyTextByCountry = currentInforCountry.propertyTextByCountry;
      });
    const topPerformanceLabelEfficiency = `${
      this.propertyTextByCountry[0].toUpperCase() +
      this.propertyTextByCountry.slice(1)
    }`;
    this.CRITERIA_DROPBOX = this.CRITERIA_DROPBOX.map((criteria) =>
      criteria.id === ECriteria.EFFICIENCY
        ? { ...criteria, topPerformanceLabel: topPerformanceLabelEfficiency }
        : criteria
    );
  }

  transformTopPerforming(currentCriteriaTopPerforming: IRankings[]) {
    return currentCriteriaTopPerforming
      .map((data) =>
        data.data.map((item) => {
          return {
            ...item,
            rank: data.rank
          };
        })
      )
      .flat();
  }

  changeCurrentCriteria(id: ECriteria) {
    this.currentTopPerformanceLabel =
      this.CRITERIA_DROPBOX.find((r) => r.id === id)?.topPerformanceLabel ||
      this.CRITERIA_DROPBOX[0].topPerformanceLabel;
    this.transformTopPerformingData = this.transformTopPerforming(
      this.topPerformingTeamMembers[id]
    );
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
