import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  Output,
  EventEmitter
} from '@angular/core';
import { EAccomplishments } from '@/app/dashboard/modules/insights/enums/insights.enum';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'accomplishments-box-data',
  templateUrl: './accomplishments-box-data.component.html',
  styleUrls: ['./accomplishments-box-data.component.scss']
})
export class AccomplishmentsBoxDataComponent
  implements OnInit, OnChanges, OnDestroy
{
  private destroy$: Subject<void> = new Subject();
  @Input() dataBoxAccomplishment;
  @Output() clickViewDetails = new EventEmitter();
  public typeDataAccomplishments = EAccomplishments;
  public dataBox;
  public isTrendWrapperBg: boolean = false;
  public isNoDataBg: boolean = false;
  public href: string;

  constructor(private activatedRoute: ActivatedRoute, private router: Router) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.dataBox = changes['dataBoxAccomplishment'].currentValue;
    if (this.dataBox.dataType === this.typeDataAccomplishments.EFFICIENCY) {
      this.dataBox.typeBox += '/team member';
    }
    if (
      this.dataBox.dataType === this.typeDataAccomplishments.TIME_SAVED ||
      this.dataBox.dataType === this.typeDataAccomplishments.EFFICIENCY
    ) {
      this.isTrendWrapperBg = true;
    }

    if (
      (this.dataBox.dataType === this.typeDataAccomplishments.TIME_SAVED ||
        this.dataBox.dataType === this.typeDataAccomplishments.EFFICIENCY) &&
      (this.dataBox.percent === 0 || this.dataBox.percent === null)
    ) {
      this.isNoDataBg = true;
    }
  }

  ngOnInit(): void {
    this.handleUrl();
  }

  handleUrl(): void {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const fragment = this.activatedRoute.snapshot.fragment;
        if (fragment) {
          this.href =
            this.router.url.replace('#' + fragment, '') +
            '#' +
            this.dataBox.dataType;
        } else {
          this.href = this.router.url + '#' + this.dataBox.dataType;
        }
      });
  }

  handleClickViewDetails() {
    this.clickViewDetails.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
