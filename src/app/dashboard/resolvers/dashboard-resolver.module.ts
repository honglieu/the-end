import { NgModule } from '@angular/core';
import { DashboardResolver, DashboardSecondaryDataService } from '.';

@NgModule({
  providers: [DashboardResolver, DashboardSecondaryDataService]
})
export class DashboardResolverModule {}
