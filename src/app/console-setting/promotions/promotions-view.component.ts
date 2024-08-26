import { Component, OnInit } from '@angular/core';
import { FormArray } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '@/app/dashboard/services/user.service';
import { UserType } from '@services/constants';
import { PromotionsService } from './services/promotions.service';
import { EPromotionPopupType } from './utils/type';

@Component({
  selector: 'app-promotions',
  templateUrl: './promotions-view.component.html',
  styleUrls: ['./promotions-view.component.scss']
})
export class PromotionsComponent implements OnInit {
  private unsubscribe = new Subject<void>();
  public currentUserType: string = '';
  public userType = UserType;
  constructor(
    public promotionsService: PromotionsService,
    public userService: UserService
  ) {}
  public trudiDrawerConfig = {
    visible: false,
    enableBackBtn: true,
    enableOkBtn: true,
    enableDeleteBtn: false
  };

  get infoCarousel(): FormArray {
    return this.promotionsService.promotionForm.get(
      'infoCarousel'
    ) as FormArray;
  }

  ngOnInit(): void {
    this.userService
      .getUserDetail()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.currentUserType = res?.type;
      });
  }

  handleClickAddPromotion(event) {
    this.infoCarousel.clear();
    this.promotionsService.addThreeCarouselItems();
    this.promotionsService.setPopupPromotionsInfo({
      type: EPromotionPopupType.CREATE_NEW_PROMOTION,
      option: null
    });
  }
}
