import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  EPreviewUserType,
  EPropertyProfileStep,
  EPropertyProfileTab
} from './enums/property-profile.enum';
import {
  IPropertyProfileTab,
  ITenantIdDispatcher,
  PROPERTY_PROFILE_TABS
} from './interface/property-profile.interface';
import { PropertiesService } from '@services/properties.service';
import { Property } from '@shared/types/property.interface';
import { PropertyProfileService } from './services/property-profile.service';
import { combineLatest, filter, pairwise, Subject, takeUntil } from 'rxjs';
import { CompanyService } from '@services/company.service';
import { ECrmSystemId } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import { EventsTabApiService } from './components/events-tab/events-tab-service/events-tab-api.service';
import { EventsTabService } from './components/events-tab/events-tab-service/events-tab.service';

@Component({
  selector: 'property-profile',
  templateUrl: './property-profile.component.html',
  styleUrls: ['./property-profile.component.scss']
})
export class PropertyProfileComponent implements OnInit, OnDestroy, OnChanges {
  @Input() propertyId = '';
  @Input() displayBackButton: boolean = false;
  @Input() userId: string = '';
  @Input() userType: EPreviewUserType = null;

  @Output() triggerBackButton = new EventEmitter();

  public EPropertyProfileTab = EPropertyProfileTab;
  public tabs: IPropertyProfileTab[] = PROPERTY_PROFILE_TABS;

  public currentProperty: Property = null;
  public readonly ECrmSystemId = ECrmSystemId;
  public readonly EPropertyProfileStep = EPropertyProfileStep;

  @ViewChild('profileWrapEl') profileWrapEl: ElementRef;
  @ViewChild('profileContentEl') profileContentEl: ElementRef;
  @ViewChild('headerEl') headerEl: ElementRef;

  private unsubscribe = new Subject<void>();

  prePropertyId: string = '';

  constructor(
    private readonly propertyService: PropertiesService,
    public readonly propertyProfileService: PropertyProfileService,
    private companyService: CompanyService,
    private readonly eventsTabApiService: EventsTabApiService,
    private readonly eventsTabService: EventsTabService,
    private _renderer: Renderer2
  ) {}

  async ngOnInit(): Promise<void> {
    this.propertyProfileService.setPropertyId(this.propertyId);
    this.propertyProfileService.propertyId$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((propertyId) => {
        if (propertyId) {
          this.propertyProfileService.setPropertyData(null);
          this.loadData(propertyId);
        }
      });

    this.propertyProfileService.selectedTab$
      .pipe(
        takeUntil(this.unsubscribe),
        pairwise(),
        filter(
          ([prev, curr]) =>
            this.tabs[prev].value === EPropertyProfileTab.EVENTS &&
            this.tabs[curr].value !== EPropertyProfileTab.EVENTS
        )
      )
      .subscribe(() => {
        this.eventsTabApiService.clear();
        this.eventsTabService.clear();
      });
  }

  loadData(propertyId: string): void {
    if (propertyId) {
      this.propertyProfileService.setIsLoading(true);
      combineLatest([
        this.propertyService.getPropertyById(propertyId),
        this.companyService.getCurrentCompany()
      ])
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(([property, company]) => {
          this.propertyProfileService.setIsLoading(false);
          if (property) {
            this.currentProperty = property;
            this.propertyProfileService.setPropertyData(property);
            if (property.unitNo) {
              this.prePropertyId = propertyId;
            }
          } else {
            console.log('Can not get property detail by id: ', propertyId);
          }
          this.propertyProfileService.setCurrentCompany(company);
        });
    } else {
      console.warn('Property ID is null or empty');
    }
  }

  handleChangeTabSelected(tabIndex): void {
    this.propertyProfileService.setSelectedTab(tabIndex);
  }

  handleClickBackBtn(): void {
    const currentStep = this.propertyProfileService.getCurrentStep();
    if (currentStep === EPropertyProfileStep.PARENT_PROPERTY_DETAIL) {
      this.propertyProfileService.navigateToStep(
        EPropertyProfileStep.PROPERTY_DETAIL,
        this.prePropertyId
      );
    } else {
      this.triggerBackButton.emit();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const propertyData = changes['propertyId'];
    if (
      propertyData &&
      propertyData.currentValue != propertyData.previousValue &&
      !propertyData.isFirstChange()
    ) {
      this.propertyProfileService.setPropertyId(propertyData.currentValue);
    }

    if (
      changes['userId'] &&
      changes['userId'].currentValue &&
      changes['userType'] &&
      changes['userType'].currentValue
    ) {
      if (changes['userType'].currentValue === EPreviewUserType.LANDLORD) {
        this.propertyProfileService.navigateToStep(
          EPropertyProfileStep.OWNERSHIP_DETAIL,
          changes['userId'].currentValue
        );
      } else {
        this.propertyProfileService.navigateToStep(
          EPropertyProfileStep.TENANT_DETAIL,
          {
            id: changes['userId'].currentValue,
            propertyId: this.propertyId
          } as ITenantIdDispatcher
        );
      }
    }
  }

  ngOnDestroy(): void {
    this.propertyProfileService.clear();
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
