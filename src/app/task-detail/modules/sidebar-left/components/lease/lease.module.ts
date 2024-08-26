import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaseRoutingModule } from './lease.routing.module';
import { LeaseComponent } from './lease.component';

@NgModule({
  declarations: [LeaseComponent],
  imports: [CommonModule, LeaseRoutingModule],
  exports: [LeaseComponent]
})
export class LeaseModule {}
