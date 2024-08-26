import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { conversations } from 'src/environments/environment';
import { ApiService } from './api.service';
import { NOTE_CATEGORIES } from './constants';
import { listCategoryInterface } from '@shared/types/property.interface';

@Injectable({
  providedIn: 'root'
})
export class PetRequestService {
  constructor(private apiService: ApiService) {}

  getCategoryPet(agencyId?: string): Observable<listCategoryInterface[]> {
    return this.apiService
      .get(`${conversations}get-note-categories`, { agencyId })
      .pipe<listCategoryInterface[]>(
        map((response: any) =>
          response?.filter((category) =>
            NOTE_CATEGORIES.includes(category.name)
          )
        )
      );
  }
}
