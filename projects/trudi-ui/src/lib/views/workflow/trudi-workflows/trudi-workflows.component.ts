import {
  AfterContentInit,
  Component,
  ContentChildren,
  Input,
  QueryList,
  SimpleChanges
} from '@angular/core';
import { TrudiWorkflowComponent } from './trudi-workflow/trudi-workflow.component';
import { Subject, startWith, takeUntil } from 'rxjs';

enum EWorkFlowDirection {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal'
}

@Component({
  selector: 'trudi-workflows',
  templateUrl: './trudi-workflows.component.html',
  styleUrls: ['./trudi-workflows.component.scss'],
  host: {
    '[class.d-flex]': '!isVertical'
  }
})
export class TrudiWorkflowsComponent implements AfterContentInit {
  @ContentChildren(TrudiWorkflowComponent)
  steps!: QueryList<TrudiWorkflowComponent>;
  @Input() stepCurrent: number = 0;
  @Input() direction: EWorkFlowDirection = EWorkFlowDirection.HORIZONTAL;
  @Input() readonly: boolean = false;
  private unsubscribe = new Subject<void>();
  public isVertical = false;

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    this.isVertical =
      this.direction === EWorkFlowDirection.VERTICAL ? true : false;
    if (
      changes['stepCurrent'].currentValue &&
      !changes['stepCurrent'].isFirstChange()
    ) {
      this.updateChildrenSteps();
    }
  }

  ngAfterContentInit(): void {
    if (this.steps) {
      this.steps.changes
        .pipe(startWith(null), takeUntil(this.unsubscribe))
        .subscribe(() => {
          this.updateChildrenSteps();
        });
    }
  }

  private updateChildrenSteps(): void {
    if (this.stepCurrent && this.stepCurrent - 1 > this.steps.length) return;
    const stepsArray = this.steps.toArray();
    for (let i = this.stepCurrent - 2; i >= 0; i--) {
      stepsArray[i].finished = true;
      stepsArray[i].disabled = false;
      stepsArray[i].lineDisabled = false;
    }

    for (let i = this.stepCurrent; i < this.steps.length; i++) {
      stepsArray[i].disabled = true;
      stepsArray[i].finished = false;
    }

    for (let i = 0; this.steps.length > i; i++) {
      stepsArray[i].isVertical = this.isVertical;
      stepsArray[i].readonly = this.readonly;
    }

    if (this.stepCurrent <= this.steps.length) {
      stepsArray[this.stepCurrent - 1].disabled = false;
      stepsArray[this.stepCurrent - 1].finished = false;
      stepsArray[this.stepCurrent - 1].lineDisabled = true;
    }

    stepsArray[this.steps.length - 1].lineHidden = true;
  }
  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
