import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppMessageLoadingService {
  private createNewMessageLoadingBS: BehaviorSubject<string> =
    new BehaviorSubject(null);
  public createNewMessageLoading$ =
    this.createNewMessageLoadingBS.asObservable();

  constructor() {}

  public setCreateMessageLoading(isLoading: string) {
    this.createNewMessageLoadingBS.next(isLoading);
  }

  public getMessageLoadingValue(): string {
    return this.createNewMessageLoadingBS.value;
  }
}
