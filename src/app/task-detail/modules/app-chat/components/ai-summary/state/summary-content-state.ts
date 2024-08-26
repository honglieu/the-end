import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class SummaryContentState {
  private readonly _content$ = new BehaviorSubject<string>(null);
  private readonly _isGenerating$ = new BehaviorSubject<boolean>(null);
  private readonly _isLoading$ = new BehaviorSubject<boolean>(null);
  private readonly _noData$ = new BehaviorSubject<boolean>(null);
  private readonly _isShow$ = new BehaviorSubject<boolean>(null);

  public readonly content$ = this._content$.asObservable();
  public readonly isGenerating$ = this._isGenerating$.asObservable();
  public readonly isLoading$ = this._isLoading$.asObservable();
  public readonly noData$ = this._noData$.asObservable();
  public readonly isShow$ = this._isShow$.asObservable();

  public setShow(show: boolean) {
    this._isShow$.next(show);
  }

  public setContent(value: string): void {
    this._content$.next(value);
  }

  public setGenerating(value: boolean): void {
    this._isGenerating$.next(value);
  }

  public setLoading(value: boolean): void {
    this._isLoading$.next(value);
  }

  public setNoData(value: boolean) {
    this._noData$.next(value);
  }

  public resetData() {
    this._content$.next(null);
    this._isGenerating$.next(false);
    this._noData$.next(null);
  }
}
