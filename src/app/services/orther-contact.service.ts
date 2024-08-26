import { dataTable } from '@shared/types/dataTable.interface';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { users } from 'src/environments/environment';
import { ApiService } from './api.service';
import { OtherContact } from '@shared/types/other-contact.interface';

@Injectable({
  providedIn: 'root'
})
export class OtherContactService {
  constructor(private apiService: ApiService) {}

  getList(params: any): Observable<dataTable<OtherContact>> {
    return this.apiService
      .get(`${users}other-contacts`, params)
      .pipe<dataTable<OtherContact>>(
        tap((response: any) => {
          return response;
        })
      );
  }

  delete(body: { otherContactDeleteIds: string[]; userId: string }) {
    return this.apiService.deleteAPI(users, 'delete/other-contacts', body);
  }

  getItemsDisableDelete(body: { userIds: string[] }): Observable<string[]> {
    return this.apiService.postAPI(users, 'undeleteable-other-contacts', body);
  }
}
