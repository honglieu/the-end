import { Injectable } from '@angular/core';
import { conversations } from 'src/environments/environment';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private listofTicketCategory = [];
  constructor(private apiService: ApiService) {}

  getTicketCategory() {
    if (!localStorage.getItem('listTicketCategories')) {
      this.apiService
        .getAPI(conversations, 'get-ticket-categories')
        .subscribe((res) => {
          this.listofTicketCategory = res;
          localStorage.setItem('listTicketCategories', JSON.stringify(res));
        });
    } else {
      this.listofTicketCategory = JSON.parse(
        localStorage.getItem('listTicketCategories')
      );
    }
  }

  public getTicketDetails(id) {
    this.getTicketCategory();
    const categoryDetail = this.listofTicketCategory.find((el) => el.id === id);
    if (!categoryDetail) {
      return {};
    }
    return categoryDetail;
  }
}
