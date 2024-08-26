import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { PropertyProfileService } from '@shared/components/property-profile/services/property-profile.service';
import { EPropertyProfileStep } from '@shared/components/property-profile/enums/property-profile.enum';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'details-tab',
  templateUrl: './details-tab.component.html',
  styleUrls: ['./details-tab.component.scss']
})
export class DetailsTabComponent
  implements OnInit, AfterViewChecked, OnDestroy
{
  currentStep: EPropertyProfileStep = EPropertyProfileStep.PROPERTY_DETAIL;
  public stepWidth: number = 400;
  public translateValue: number = 0;
  isUpdateWidth: boolean = false;
  @ViewChild('detailTabWrap') detailTabWrap: ElementRef;
  protected readonly EPropertyProfileStep = EPropertyProfileStep;
  private unsubscribe = new Subject<void>();

  constructor(
    private _propertyProfileService: PropertyProfileService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this._propertyProfileService.setDataOfProperty({
      ...this._propertyProfileService.getDataOfProperty(),
      filterOfTenancies: false,
      filterOfOwners: false
    });
    this._propertyProfileService.currentStep$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        this.currentStep = value;
        this.updateSlider();
      });
  }

  updateSlider(): void {
    if (this.stepWidth > 0) {
      let translateVal = 0;
      if (this.currentStep === EPropertyProfileStep.TENANCY_DETAIL)
        translateVal = this.stepWidth;
      else if (
        this.currentStep === EPropertyProfileStep.TENANT_DETAIL ||
        this.currentStep === EPropertyProfileStep.OWNERSHIP_DETAIL
      )
        translateVal = this.stepWidth * 2;

      this.translateValue = -translateVal;
    } else {
      this.translateValue = 0;
    }
  }

  ngAfterViewChecked(): void {
    if (
      !this.isUpdateWidth &&
      this.detailTabWrap &&
      this.detailTabWrap.nativeElement.closest('.property-profile-wrap') &&
      this.detailTabWrap.nativeElement.clientWidth !== this.stepWidth
    ) {
      const profileWrapEl = this.detailTabWrap.nativeElement.closest(
        '.property-profile-wrap'
      );

      if (
        profileWrapEl.clientWidth > 0 &&
        profileWrapEl.clientWidth !== this.stepWidth
      ) {
        this.stepWidth = profileWrapEl.clientWidth;
        this.isUpdateWidth = true;
        this.updateSlider();
        this._cdr.markForCheck();
      }
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
