import { transition, trigger, useAnimation } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { Params } from '@angular/router';
import { MenuService, NzSubmenuService } from 'ng-zorro-antd/menu';
import { Subject, takeUntil } from 'rxjs';
import {
  closeMenu,
  openMenu
} from '@/app/dashboard/animation/triggerMenuAnimation';
import { UserService } from '@/app/dashboard/services/user.service';
import { CurrentUser } from '@shared/types/user.interface';

@Component({
  selector: 'sidebar-item',
  templateUrl: './sidebar-item.component.html',
  styleUrls: ['./sidebar-item.component.scss'],
  providers: [NzSubmenuService, MenuService],
  animations: [
    trigger('menuAnimation', [
      transition(':enter', [useAnimation(openMenu)]),
      transition(':leave', [useAnimation(closeMenu)])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarItemComponent implements OnInit, OnDestroy {
  @Input() routerLink: string;
  @Input() queryParams: Params;
  @Input() titleName: string;
  @Input() iconName: string;
  @Input() className: string = '';
  @Input() hoverIconName: string;
  @Input() mode: IMode = 'vertical';
  @Input() logoLink: string;
  @Input() isSelected: boolean = false;
  @Input() isSubmenu: boolean = false;
  @Input() idSidebarItem: string = '';
  @Input() isUnread: boolean = false;
  @Input() isOpenNewTab: boolean = false;
  @Input() disabled: boolean = false;
  @Input() externalLink: boolean = false;
  @Input() hasCustomClass: boolean = false;
  @Input() dataE2e: string;
  isCheckedHover: boolean = false;
  private unsubscribe$ = new Subject<void>();
  public currentUser: CurrentUser;

  @HostBinding('attr.class') get classes() {
    return `sidebar-item ${this.className} ${this.mode}`;
  }

  constructor(
    private userService: UserService,
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.userService
      .getUserDetail()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((res) => {
        this.currentUser = res;
        this.cdRef.markForCheck();
      });
  }

  onLinkActiveChange(isActive: boolean) {
    if (isActive) {
      setTimeout(() => {
        this.isCheckedHover = isActive;
        this.isSelected = isActive;
        this.cdRef.markForCheck();
      }, 500);
    } else {
      this.isCheckedHover = isActive;
      this.isSelected = isActive;
      this.cdRef.markForCheck();
    }
  }

  get iconSidebarName() {
    return this.isSelected
      ? this.hoverIconName
        ? this.hoverIconName
        : this.iconName
      : this.iconName;
  }

  get isVertical() {
    return this.mode === 'vertical';
  }

  checkAvatar(avatarUrl: string): boolean {
    return !avatarUrl?.includes('google_avatar');
  }

  mouseleave() {
    this.ngZone.runOutsideAngular(() => {
      this.isCheckedHover = false;
    });
  }

  mouseenter() {
    this.ngZone.runOutsideAngular(() => {
      this.isCheckedHover = true;
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
  }
}

type IMode = 'vertical' | 'horizontal';
