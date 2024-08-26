import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { conversations } from 'src/environments/environment';
import { ApiService } from './api.service';
import { ActionLinkItem } from '@shared/types/action-link.interface';
import { catchError, pluck, takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ActionLinkService {
  public globalActionLink = new BehaviorSubject(null);
  public newActionLink = new BehaviorSubject(null);
  actionLink$ = new BehaviorSubject<ActionLinkItem[]>([]);
  private listofConversationCategory: any = [];

  private previousUrl: BehaviorSubject<string> = new BehaviorSubject<string>(
    null
  );
  public previousUrl$: Observable<string> = this.previousUrl.asObservable();
  public isChangeUrl$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    true
  );

  get preUrl() {
    return this.previousUrl.getValue();
  }

  constructor(private readonly apiService: ApiService) {
    this.getActionLink();
  }

  setPreviousUrl(previousUrl: string) {
    this.previousUrl.next(previousUrl);
  }

  setCreateNewActionLink(status: boolean) {
    this.newActionLink.next(status);
  }

  getActionLink() {
    this.apiService
      .getData<ActionLinkItem[]>(`${conversations}action-link/`)
      .pipe(
        pluck('body'),
        takeUntil(new Subject<void>()),
        catchError(() => of([]))
      )
      .subscribe({
        next: (res) => this.actionLink$.next(res),
        error: () => this.actionLink$.next([])
      });
  }

  getConversationCategory() {
    const fullCategoryList = JSON.parse(
      localStorage.getItem('listCategoryTypes')
    );
    if (fullCategoryList) {
      this.listofConversationCategory = fullCategoryList;
    }
  }

  public getCategoryDetails(categoryId) {
    this.getConversationCategory();
    const categoryDetails =
      this.listofConversationCategory.find((cat) => cat.id === categoryId) ||
      {};
    if (categoryId === '0d2817fa-9687-11e9-bc42-526af7764f64') {
      categoryDetails.svg = 'old-rent.svg';
      categoryDetails.color = 'rgb(0, 169, 159)';
    }
    return categoryDetails;
  }
}
