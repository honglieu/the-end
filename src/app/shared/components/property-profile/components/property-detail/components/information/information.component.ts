import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { PropertyProfileService } from '@shared/components/property-profile/services/property-profile.service';
import dayjs from 'dayjs';
import { Subject, takeUntil } from 'rxjs';
import { ECRMId } from '@shared/enum';
import { portfolio } from '@shared/types/team.interface';
import { EPropertyProfileStep } from '@shared/components/property-profile/enums/property-profile.enum';
import { CHAR_WIDTH } from '@services/constants';

@Component({
  selector: 'information',
  templateUrl: './information.component.html',
  styleUrls: ['./information.component.scss']
})
export class InformationComponent implements OnInit, OnDestroy {
  public currentProperty = {};
  public isCRM: boolean = false;
  private unsubscribe = new Subject<void>();

  public isLoading: boolean = false;
  constructor(
    private agencyDateFormatService: AgencyDateFormatService,
    public readonly propertyProfileService: PropertyProfileService
  ) {}
  ngOnInit(): void {
    this.propertyProfileService.currentCompany$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((result) => {
        this.isCRM = result?.CRM === ECRMId.RENT_MANAGER;
      });
    this.formatCurrentPropertyData();
  }

  formatDateCharacter(date: string) {
    return dayjs(date).isValid()
      ? this.agencyDateFormatService.formatTimezoneDate(
          date,
          this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_CHARECTOR
        )
      : '';
  }

  getUserNamesString(users: portfolio[]) {
    let maxWidth = 240;
    const { fullNameList, displayNames } = users.reduce(
      (previousValue, currentValue, index) => {
        const fullName = currentValue.firstName + ' ' + currentValue.lastName;
        if (maxWidth - fullName.length * CHAR_WIDTH > 0) {
          maxWidth -= fullName.length * CHAR_WIDTH;
          previousValue.displayNames.push(fullName);
        } else if (index === 0) {
          const resolvedFullName =
            fullName.substring(0, maxWidth / CHAR_WIDTH - 3) + '...';
          maxWidth = 0;
          previousValue.displayNames.push(resolvedFullName);
        }
        return {
          ...previousValue,
          fullNameList: [...previousValue.fullNameList, fullName]
        };
      },
      {
        displayNames: [] as string[],
        fullNameList: [] as string[]
      }
    );

    const remainingCount = fullNameList.length - displayNames.length;
    let shortName = displayNames.join(', ');
    let fullName = fullNameList.join(', ');
    if (remainingCount > 0) {
      shortName += `, +${remainingCount}`;
    }
    return { shortName, fullName };
  }

  formatCurrentPropertyData() {
    this.propertyProfileService.currentPropertyData$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        if (!data) return;
        if (this.isCRM) {
          this.currentProperty = {
            ...data,
            listPortfolioNames: this.getUserNamesString(data.portfolios),
            unitType: data.sourceProperty.propertyType,
            squareFootage: data.sourceProperty.squareFootage,
            parentPropertyId: data.sourceProperty.parentPropertyId,
            parentStreetline: data.sourceProperty.parentStreetline
          };
        } else {
          this.currentProperty = {
            nextInspection: this.formatDateCharacter(data.nextInspection),
            expenditureLimit: data.expenditureLimit,
            authorityStartDate: this.formatDateCharacter(
              data.authorityStartDate
            ),
            authorityEndDate: this.formatDateCharacter(data.authorityEndDate),
            keyNumber: data.keyNumber,
            propertyManager: data.propertyManager,
            managerName:
              (data.propertyManager?.firstName || '') +
              ' ' +
              (data.propertyManager?.lastName || '')
          };
        }
      });
  }
  handleClickParentProperty(id: string) {
    this.propertyProfileService.navigateToStep(
      EPropertyProfileStep.PARENT_PROPERTY_DETAIL,
      id
    );
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
