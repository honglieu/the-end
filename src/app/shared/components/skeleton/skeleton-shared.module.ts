import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppMessageDetailSkeletonComponent } from '@shared/components/skeleton/components/app-message-detail-skeleton/app-message-detail-skeleton.component';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';

@NgModule({
  declarations: [AppMessageDetailSkeletonComponent],
  imports: [CommonModule, NzSkeletonModule],
  exports: [AppMessageDetailSkeletonComponent]
})
export class SkeletonSharedModule {}
