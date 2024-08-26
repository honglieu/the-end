import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { TreeNodeComponent } from './tree-node/tree-node.component';
import {
  TreeViewDataPipe,
  TrudiDecisionTreeComponent
} from './trudi-decision-tree.component';
import { SharedModule } from '@shared/shared.module';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { TrudiUiModule } from '@trudi-ui';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

@NgModule({
  declarations: [
    TrudiDecisionTreeComponent,
    TreeNodeComponent,
    TreeViewDataPipe
  ],
  imports: [
    CommonModule,
    NzRadioModule,
    FormsModule,
    DragDropModule,
    SharedModule,
    NzMenuModule,
    TrudiUiModule,
    ReactiveFormsModule,
    NzToolTipModule,
    NzDropDownModule
  ],
  exports: [TrudiDecisionTreeComponent]
})
export class TrudiDecisionTreeModule {}
