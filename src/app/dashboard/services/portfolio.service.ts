import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { portfolio } from '@shared/types/team.interface';
import { IPortfoliosGroups } from '@/app/profile-setting/portfolios/interfaces/portfolios.interface';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private portfolios: BehaviorSubject<IPortfoliosGroups[]> =
    new BehaviorSubject([]);
  private portfoliosByType: BehaviorSubject<portfolio[]> = new BehaviorSubject(
    []
  );

  getPortfolios() {
    return this.portfolios.getValue();
  }

  getPortfolios$() {
    return this.portfolios.asObservable();
  }

  setPortfolios(value: IPortfoliosGroups[]) {
    return this.portfolios.next(value);
  }

  getPortfoliosByType() {
    return this.portfoliosByType.asObservable();
  }

  setPortfoliosByType(value: portfolio[]) {
    return this.portfoliosByType.next(value);
  }
}
