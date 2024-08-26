import { Property } from '@shared/types/property.interface';
import { IPersonalInProperty } from '@shared/types/user.interface';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EPropertyProfileStep } from '@shared/components/property-profile/enums/property-profile.enum';
import { ECRMId } from '@shared/enum';
import { ICompany } from '@shared/types/company.interface';
import {
  ICurrentPageData,
  ITenantIdDispatcher
} from '@shared/components/property-profile/interface/property-profile.interface';

@Injectable({
  providedIn: 'root'
})
export class PropertyProfileService {
  private isLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  public isLoading$: Observable<boolean> = this.isLoading.asObservable();

  private propertyId: BehaviorSubject<string> = new BehaviorSubject('');
  public propertyId$: Observable<string> = this.propertyId.asObservable();

  private currentPropertyData: BehaviorSubject<Property> = new BehaviorSubject(
    null
  );
  public currentPropertyData$: Observable<Property> =
    this.currentPropertyData.asObservable();

  private selectedTab: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  public selectedTab$: Observable<number> = this.selectedTab.asObservable();

  private currentStep: BehaviorSubject<EPropertyProfileStep> =
    new BehaviorSubject<EPropertyProfileStep>(
      EPropertyProfileStep.PROPERTY_DETAIL
    );
  public currentStep$: Observable<EPropertyProfileStep> =
    this.currentStep.asObservable();

  private dataOfProperty: BehaviorSubject<IPersonalInProperty> =
    new BehaviorSubject(null);
  public dataOfProperty$: Observable<IPersonalInProperty> =
    this.dataOfProperty.asObservable();

  private currentTenantId: BehaviorSubject<ITenantIdDispatcher> =
    new BehaviorSubject(null);
  public currentTenantId$: Observable<ITenantIdDispatcher> =
    this.currentTenantId.asObservable();

  private currentTenancyId: BehaviorSubject<string> = new BehaviorSubject('');
  public currentTenancyId$: Observable<string> =
    this.currentTenancyId.asObservable();

  private currentOwnershipId: BehaviorSubject<string> = new BehaviorSubject('');
  public currentOwnershipId$: Observable<string> =
    this.currentOwnershipId.asObservable();

  private currentCompany: BehaviorSubject<ICompany> = new BehaviorSubject(null);
  public currentCompany$: Observable<ICompany> =
    this.currentCompany.asObservable();

  private currentPageData: BehaviorSubject<ICurrentPageData> =
    new BehaviorSubject(null);
  public currentPageData$: Observable<ICurrentPageData> =
    this.currentPageData.asObservable();

  setIsLoading(loading: boolean) {
    this.isLoading.next(loading);
  }

  getIsLoading() {
    return this.isLoading.getValue();
  }

  getCurrentCompany() {
    return this.currentCompany.getValue();
  }

  getCurrentProperty() {
    return this.currentPropertyData.getValue();
  }

  setPropertyData(property: Property) {
    this.currentPropertyData.next(property);
  }

  setPropertyId(id: string) {
    this.propertyId.next(id);
  }

  getPropertyId() {
    return this.propertyId.getValue();
  }

  getSelectedTab() {
    return this.selectedTab.getValue();
  }

  setSelectedTab(tabIndex: number) {
    this.selectedTab.next(tabIndex);
  }

  getCurrentStep() {
    return this.currentStep.getValue();
  }

  setCurrentStep(step: EPropertyProfileStep) {
    this.currentStep.next(step);
  }

  getCurrentPageData() {
    return this.currentPageData.getValue();
  }

  setCurrentPageData(pageData: ICurrentPageData) {
    this.currentPageData.next(pageData);
  }

  getDataOfProperty() {
    return {
      ...(this.dataOfProperty.getValue() ?? {}),
      propertyData: this.currentPropertyData.getValue()
    };
  }

  setDataOfProperty(data: IPersonalInProperty) {
    return this.dataOfProperty.next({
      ...this.dataOfProperty.getValue(),
      ...data
    });
  }

  getCurrentTenancy() {
    return this.currentTenancyId.getValue();
  }

  setCurrentTenant(data: ITenantIdDispatcher) {
    return this.currentTenantId.next(data);
  }
  getCurrentTenant() {
    return this.currentTenantId.getValue();
  }

  getCurrentOwnershipId() {
    return this.currentOwnershipId.getValue();
  }

  setCurrentCompany(data: ICompany) {
    return this.currentCompany.next(data);
  }

  getIsCRM() {
    return this.currentCompany.getValue().CRM === ECRMId.RENT_MANAGER;
  }

  navigateToStep(step: EPropertyProfileStep, stepData: unknown = null) {
    switch (step) {
      case EPropertyProfileStep.TENANCY_DETAIL:
        this.currentTenancyId.next(stepData as string);
        break;
      case EPropertyProfileStep.OWNERSHIP_DETAIL:
        this.currentOwnershipId.next(stepData as string);
        break;
      case EPropertyProfileStep.TENANT_DETAIL:
        this.currentTenantId.next(stepData as ITenantIdDispatcher);
        break;
      case EPropertyProfileStep.PARENT_PROPERTY_DETAIL:
        this.propertyId.next(stepData as string);
        this.currentPropertyData.next(null);
        break;
      case EPropertyProfileStep.PROPERTY_DETAIL:
        if (stepData) {
          this.propertyId.next(stepData as string);
        }
        //clear data
        this.currentTenancyId.next('');
        this.currentOwnershipId.next('');
        this.currentTenantId.next(null);
        break;
    }
    this.currentStep.next(step);
  }

  clear() {
    this.isLoading.next(false);
    this.currentPropertyData.next(null);
    this.selectedTab.next(0);
    this.currentStep.next(EPropertyProfileStep.PROPERTY_DETAIL);
    this.currentTenancyId.next('');
    this.currentTenantId.next(null);
    this.currentCompany.next(null);
  }
}
