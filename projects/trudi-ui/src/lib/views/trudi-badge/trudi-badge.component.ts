import {
  AfterViewInit,
  Component,
  ContentChild,
  HostBinding,
  Inject,
  Input,
  OnInit,
  TemplateRef
} from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { UserType } from '../../common/enums/user-type.enum';
import { IS_RM_CRM } from '../../provider/trudi-config';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { CommonModule } from '@angular/common';
import { TrudiIconComponent } from '../trudi-icon';
import { TrudiUserTypeInRmPipe } from '../../pipes';

@Component({
  standalone: true,
  selector: 'trudi-badge',
  templateUrl: './trudi-badge.component.html',
  styleUrls: ['./trudi-badge.component.scss'],
  imports: [
    CommonModule,
    NgOptionHighlightModule,
    TrudiIconComponent,
    TrudiUserTypeInRmPipe
  ]
})
export class TrudiBadgeComponent implements OnInit, AfterViewInit {
  @Input() text: string;
  @Input() highlighText: string;
  @Input() icon: string;
  @Input() extraClass: string = '';
  @Input() size: TrudiBadgeSize = 'medium';
  @Input() variant: TrudiBadgeVariant = 'primary';
  @Input() allowTruncated: boolean;
  @Input() customIconSize: number;
  @Input() badgeType: TrudiBadgeType = 'tonal';
  @Input() rounded: boolean = false;
  @Input() fillIcon: boolean = false;
  @ContentChild('customBadgeTextTemplate')
  customBadgeTextTemplate: TemplateRef<Element>;
  @ContentChild('customBadgeIconTemplate')
  customBadgeIconTemplate: TemplateRef<Element>;
  public iconSize: number;
  public isRmEnvironment: boolean = false;
  public pipeType: string = UserType.DEFAULT;
  private unsubscribe = new Subject<void>();

  @HostBinding('attr.class') get classes() {
    return `trudi-badge ${
      this.fillIcon ? 'trudi-badge-icon-filled' : ''
    } trudi-badge-${this.variant} trudi-badge-${this.variant}-${
      this.badgeType
    } trudi-badge-${this.size} ${this.extraClass} ${
      this.allowTruncated ? 'trudi-badge-truncated' : ''
    } ${this.rounded ? 'trudi-badge-rounded' : ''}`;
  }

  constructor(@Inject(IS_RM_CRM) private isRmCrm$: Observable<boolean>) {}

  ngOnInit(): void {
    if (this.customIconSize && this.customIconSize > 0) {
      this.iconSize = this.customIconSize;
    } else {
      this.iconSize = this.size === 'small' ? 10 : 13;
    }
    if (this.text === 'Landlord') {
      this.text = 'Owner';
    }
  }

  ngAfterViewInit(): void {
    this.isRmCrm$.pipe(takeUntil(this.unsubscribe)).subscribe((isRmCrm) => {
      this.isRmEnvironment = isRmCrm;
    });
  }
}

type TrudiBadgeSize = 'extra-small' | 'small' | 'medium' | 'large';
export type TrudiBadgeType = 'filled' | 'tonal' | 'outlined';
export type TrudiBadgeVariant =
  | 'primary'
  | 'warning'
  | 'error'
  | 'role'
  | 'success'
  | 'inProgress'
  | 'unassigned'
  | 'archive'
  | 'sidebar'
  | 'supplier'
  | 'gradient'
  | 'border';
