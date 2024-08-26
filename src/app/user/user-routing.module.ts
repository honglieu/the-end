import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserComponent } from './user.component';
import { RoleGuardCanActive } from './utils/role-guard-can-active';
import { PreventButtonGuard } from '@trudi-ui';

const routes: Routes = [
  {
    path: '',
    component: UserComponent,
    children: [
      {
        path: '',
        redirectTo: 'tenants-landlords',
        pathMatch: 'full'
      },
      {
        path: 'tenants-landlords',
        loadChildren: () =>
          import('@/app/user/agent-user/agent-user.module').then(
            (m) => m.AgentUserModule
          ),
        canActivate: [PreventButtonGuard]
      },
      {
        path: 'tenant-prospect',
        canActivate: [RoleGuardCanActive],
        loadChildren: () =>
          import('@/app/user/tenant-prospect/tenant-prospect.module').then(
            (m) => m.TenantProspectModule
          )
      },
      {
        path: 'landlords-prospect',
        canActivate: [RoleGuardCanActive],
        loadChildren: () =>
          import(
            '@/app/user/landlords-prospect/landlords-prospect.module'
          ).then((m) => m.LandlordsProspectModule)
      },
      {
        path: 'suppliers',
        loadChildren: () =>
          import('@/app/user/supplier/supplier.module').then(
            (m) => m.SupplierModule
          )
      },
      {
        path: 'other-contacts',
        loadChildren: () =>
          import('@/app/user/other-contact/other-contact.module').then(
            (m) => m.OtherContactModule
          )
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule {}
