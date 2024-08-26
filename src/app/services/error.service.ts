import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private errorSubject = new BehaviorSubject<boolean>(false);
  private ishowMailBoxPermissionWarning = new BehaviorSubject<boolean>(false);
  public error$ = this.errorSubject.asObservable();
  public ishowMailBoxPermissionWarning$ =
    this.ishowMailBoxPermissionWarning.asObservable();

  constructor() {}

  handleHttpError(error: HttpErrorResponse) {
    if (error.status === 500) {
      this.errorSubject.next(true);
    }
  }

  handleShowMailBoxPermissionWarning(isShow: boolean) {
    this.ishowMailBoxPermissionWarning.next(isShow);
  }
}
