import { PreventButtonGuard } from '@trudi-ui';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UpSellComponent } from '@/app/dashboard/modules/insights/components/up-sell/up-sell.component';
import { InsightsGuard } from '@/app/dashboard/modules/insights/guards/insights.guard';
import { UpSellGuard } from '@/app/dashboard/modules/insights/guards/up-sell.guard';
import { InsightsComponent } from '@/app/dashboard/modules/insights/insights.component';

const routes: Routes = [
  {
    path: '',
    component: InsightsComponent,
    canActivate: [InsightsGuard, PreventButtonGuard],
    runGuardsAndResolvers: 'always'
  },
  {
    path: 'up-sell',
    component: UpSellComponent,
    canActivate: [UpSellGuard, PreventButtonGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InsightsRoutingModule {}
