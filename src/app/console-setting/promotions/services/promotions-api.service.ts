import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@services/api.service';
import { agencies } from 'src/environments/environment';
import {
  IBodyPromotion,
  IPromotion,
  IPromotionSchedule
} from '@/app/console-setting/promotions/utils/promotions.interface';

@Injectable({
  providedIn: 'root'
})
export class PromotionsApiService {
  constructor(private apiService: ApiService) {}

  getListPromotions(pageIndex: number) {
    return this.apiService.getAPI(
      agencies,
      `promotions` + `?page=${pageIndex}`
    );
  }

  getDetailPromotion(promotionId: string): Observable<IPromotion> {
    return this.apiService.getAPI(agencies, `promotions/${promotionId}`);
  }

  getPromotionRestrictedDates(): Observable<IPromotionSchedule[]> {
    return this.apiService.getAPI(agencies, `promotions/restricted-dates`);
  }

  savePromotion(payload: IBodyPromotion): Observable<IPromotion[]> {
    return this.apiService.postAPI(agencies, 'promotions', payload);
  }

  updatePromotion(
    promotionId: string,
    payload: IBodyPromotion
  ): Observable<IPromotion[]> {
    return this.apiService.putAPI(
      agencies,
      `promotions/${promotionId}`,
      payload
    );
  }

  deletePromotion(id: string) {
    return this.apiService.deleteAPI(agencies, `promotions/${id}`);
  }

  getPublishedPromotion() {
    return this.apiService.getAPI(agencies, 'promotions/published');
  }

  closePromotion(promotionID: string) {
    return this.apiService.postAPI(
      agencies,
      `promotions/${promotionID}/promotionTracking/close`,
      {}
    );
  }
}
