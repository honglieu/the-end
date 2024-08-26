import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  debounceTime,
  filter,
  switchMap
} from 'rxjs';
import { IFilesResponse, IGetFilesRequest } from './upload-from-crm.interface';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UploadFromCRMService {
  private readonly _selectedProperty$: BehaviorSubject<any> =
    new BehaviorSubject<any>('');
  public readonly selectedProperty$ = this._selectedProperty$.asObservable();

  private readonly _selectedFiles$: BehaviorSubject<any> =
    new BehaviorSubject<any>([]);
  public readonly selectedFiles$ = this._selectedFiles$.asObservable();

  private getFilesPayload$ = new BehaviorSubject<IGetFilesRequest>(null);

  private popupState = {
    uploadFileFromCRM: false,
    uploadFileFromCRMOutside: false,

    visibleSelect: false,
    visibleAttachFile: false,
    handleCallback: null
  };
  constructor(private apiService: ApiService) {}

  // getter setter

  getPopupState() {
    return this.popupState;
  }

  setPopupState(state: Partial<typeof this.popupState>) {
    this.popupState = {
      ...this.popupState,
      ...state
    };
  }

  getSelectedProperty() {
    return this._selectedProperty$.getValue();
  }

  setSelectedProperty(value) {
    this._selectedProperty$.next(value);
  }

  getSelectedFiles() {
    return this._selectedFiles$.getValue();
  }

  setSelectedFiles(value) {
    this._selectedFiles$.next(value);
  }

  refreshFilesOption(payload: Partial<IGetFilesRequest>) {
    this.getFilesPayload$.next({
      ...this.getFilesPayload$.value,
      ...payload
    });
  }

  getFilesFromCrmAPI(): Observable<IFilesResponse> {
    return this.getFilesPayload$.asObservable().pipe(
      filter((res) => !!res),
      debounceTime(500),
      switchMap((payload) =>
        this.apiService.getAPI(
          conversations,
          `document/get-documents-from-crm`,
          payload
        )
      )
    );
  }
}
