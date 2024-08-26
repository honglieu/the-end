import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TemplateTreeService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/template-tree.service';
import { transition, trigger, useAnimation } from '@angular/animations';
import {
  closeSaveChange,
  openSaveChange
} from '@/app/dashboard/animation/triggerSaveChangeAnimation';
import { Subject, takeUntil, map, tap } from 'rxjs';
import { TaskTemplateService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template.service';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';

@Component({
  selector: 'save-change-button',
  templateUrl: './save-change-button.component.html',
  styleUrls: ['./save-change-button.component.scss'],
  animations: [
    trigger('toolbarAnimation', [
      transition(':enter', [useAnimation(openSaveChange)]),
      transition(':leave', [useAnimation(closeSaveChange)])
    ])
  ]
})
export class SaveChangeButtonComponent implements OnInit, OnDestroy {
  private unsubscribe: Subject<void> = new Subject<void>();
  public isTreeChanged: boolean = false;
  private isEditing: boolean = false;
  public isClickSaveChange = false;
  public isHasError = false;
  @Input() isLoading: boolean = false;
  @Input() isError: boolean = false;
  @Input() isInvalidDynamicParam: boolean = false;
  @Input() isErrorShaking: boolean = false;

  constructor(
    private templateTreeService: TemplateTreeService,
    private taskTemplateService: TaskTemplateService,
    private taskEditorService: TaskEditorService
  ) {}

  ngOnInit(): void {
    this.handleOpenSaveChangePopup();
  }

  handleOpenSaveChangePopup() {
    this.templateTreeService
      .isTreeChanged()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isTreeChanged = res;
      });
    this.templateTreeService.isEditing$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isEditing) => (this.isEditing = isEditing));
  }

  handleCancelChange() {
    this.isClickSaveChange = false;
    this.templateTreeService.resetTemplateTree(
      this.taskEditorService.isConsoleSettings
    );
    this.templateTreeService.setSaveChangeError({ isError: false });
    this.templateTreeService.setIsLoadingSaveData(false);
    this.templateTreeService.setErrorNode(null);
    this.templateTreeService.setSaveChangeDataTree(false);
  }

  public handleSaveChanges() {
    this.isClickSaveChange = true;
    if (this.isEditing || this.isHasError || this.isInvalidDynamicParam) {
      return;
    }
    this.templateTreeService.saveData();
  }

  public hasError() {
    return this.templateTreeService.currentErrorNode$.pipe(
      takeUntil(this.unsubscribe),
      map((errorNode) => !!errorNode && errorNode?.length > 0),
      tap((res) => {
        this.isHasError = res;
      })
    );
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
