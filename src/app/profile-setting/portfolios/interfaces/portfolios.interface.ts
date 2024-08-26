import { Portfolio } from '@shared/types/user.interface';

export interface IPortfoliosGroups {
  id: string;
  name: string;
  portfolios: Portfolio[];
}
