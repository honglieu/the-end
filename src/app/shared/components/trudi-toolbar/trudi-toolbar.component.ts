import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  Output,
  QueryList,
  TemplateRef,
  ViewChild
} from '@angular/core';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  debounceTime,
  filter,
  fromEvent,
  map,
  startWith,
  takeUntil
} from 'rxjs';
import { ToolbarItemTemplateDirective } from './toolbar.directive';
import { NzPopoverDirective } from 'ng-zorro-antd/popover';
import { Router } from '@angular/router';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { cloneDeep } from 'lodash-es';
import { EInboxQueryParams } from '@shared/enum';
import { EMenuDropdownType } from '@shared/directives/menuKeyboard.directive';

@Component({
  selector: 'trudi-toolbar',
  templateUrl: './trudi-toolbar.component.html',
  styleUrls: ['./trudi-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrudiToolbarComponent
  implements AfterContentInit, AfterViewInit, OnDestroy
{
  @HostBinding('style.width') get hostWidth() {
    return this.toolbarWidth;
  }

  @HostBinding('class.active') get isActive() {
    return this.visibleDropdown;
  }

  @Input() taskDetailViewMode: EViewDetailMode = EViewDetailMode.TASK;
  @Input() toolbarWidth: string = '100%';
  @Input() elementGap = 4;
  @Output() hiddenItemsChange = new EventEmitter<
    ElementRef<HTMLDivElement>[]
  >();

  @ViewChild('toolbar', { static: true })
  readonly toolbar!: ElementRef<HTMLDivElement>;
  @ViewChild('panel', { static: true })
  readonly panel!: ElementRef<HTMLDivElement>;
  @ViewChild('buttonMoreContainer', { static: true })
  readonly buttonMoreContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('buttonMore', { read: NzPopoverDirective, static: false })
  popover: NzPopoverDirective;

  @ContentChildren(ToolbarItemTemplateDirective, { read: TemplateRef })
  private readonly _toolbarItemTemplates?: QueryList<
    TemplateRef<ToolbarItemTemplateDirective>
  >;

  @ContentChildren(ToolbarItemTemplateDirective)
  private readonly _toolbarItemTemplateDirective?: QueryList<ToolbarItemTemplateDirective>;

  public visibleDropdown: boolean = false;
  public visibleTemplates: TemplateRef<ToolbarItemTemplateDirective>[] = [];
  public hiddenTemplates: TemplateRef<ToolbarItemTemplateDirective>[] = [];

  private _resizeObserver: ResizeObserver;
  private readonly _offsetMap = {};

  private readonly _hiddenIndex$ = new BehaviorSubject<number>(null);
  private readonly _resize$ = new Subject<void>();
  private readonly _destroy$ = new Subject<void>();
  public readonly EViewDetailMode = EViewDetailMode;
  public waitListToolbarProcess: boolean = true;
  public totalCount: number = 0;
  public EMenuDropdownType = EMenuDropdownType;

  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private router: Router,
    private inboxFilterService: InboxFilterService,
    public inboxService: InboxService,
    public mailboxSettingService: MailboxSettingService
  ) {}

  public ngAfterViewInit(): void {
    combineLatest([
      fromEvent(window, 'resize').pipe(startWith(null)),
      this._resize$.asObservable().pipe(startWith(null))
    ])
      .pipe(takeUntil(this._destroy$), debounceTime(300))
      .subscribe(() => {
        this.waitListToolbarProcess = true;
        this._detectHiddenElements();
        this.waitListToolbarProcess = false;
        this._changeDetectorRef.markForCheck();
      });

    combineLatest([
      this.inboxFilterService.selectedItem$,
      this.mailboxSettingService.mailboxSetting$
    ])
      .pipe(
        takeUntil(this._destroy$),
        map(([selectedItem, mailboxSetting]) => {
          const teamMembers = mailboxSetting?.teamMembers;
          const isTaskType = this.router.url.includes('tasks');
          const filterMap = cloneDeep(selectedItem);
          if (isTaskType) {
            delete filterMap.messageStatus;
          } else {
            delete filterMap.taskType;
            delete filterMap.eventType;
          }
          return [filterMap] as const;
        })
      )
      .subscribe(([selectedItem]) => {
        const selectedItems = [];
        const isAiAssistant = this.router.url.includes(
          EInboxQueryParams.AI_ASSISTANT
        );
        for (const key in selectedItem) {
          selectedItems.push(
            isAiAssistant && key === 'assignee' ? 0 : selectedItem[key]
          );
        }
        this.totalCount = selectedItems.reduce((acc, curr) => {
          return curr ? acc + curr : acc;
        }, 0);
      });

    this._resizeObserver = new ResizeObserver(() => {
      this._resize$.next();
    });
    this._resizeObserver.observe(this.panel.nativeElement);
  }

  public ngAfterContentInit(): void {
    this._onElementVisibleChanges();
    // Todo refactor
    this.inboxFilterService.isSelectedItemAssignee$
      .pipe(takeUntil(this._destroy$))
      .subscribe((data) => {
        this.waitListToolbarProcess = true;

        this._changeDetectorRef.markForCheck();
      });
  }

  public onDropdownMenuVisibleChange(event: boolean): void {
    this.visibleDropdown = event;
  }

  public markForCheck() {
    const numberOfTemplates = this._toolbarItemTemplates.length;
    if (numberOfTemplates) {
      this._hiddenIndex$.next(numberOfTemplates);
      this._detectHiddenElements();
      this.waitListToolbarProcess = false;
      this._changeDetectorRef.markForCheck();
    }
  }

  private _onElementVisibleChanges(): void {
    this._hiddenIndex$
      .pipe(
        takeUntil(this._destroy$),
        startWith(this._toolbarItemTemplates?.length),
        filter<number>(Number.isInteger),
        filter<number>((index) => index >= 0)
      )
      .subscribe((hiddenIndex) => {
        this._displayElements(hiddenIndex);
      });
  }

  private _displayElements(hiddenIndex: number) {
    const templates = this._toolbarItemTemplates?.toArray() ?? [];
    const hiddenTemplates = [];
    const visibleTemplates = [];

    this._toolbarItemTemplateDirective?.forEach((directive, index) => {
      //Comment logic show and hidden template, only show filter icon for now
      // const visible = index < hiddenIndex;
      directive.setVisibleChange(directive.visibleViewContainer);
      // const template = templates[index];
      // if (directive.visibleViewContainer) {
      //   visible
      //     ? visibleTemplates.push(template)
      //     : hiddenTemplates.push(template);
      // }
      if (directive.visibleViewContainer)
        hiddenTemplates.push(templates[index]);
    });

    this.visibleTemplates = visibleTemplates;
    this.hiddenTemplates = hiddenTemplates;
    this._changeDetectorRef.markForCheck();
    if (this.visibleDropdown) {
      this.popover?.component?.updatePosition();
    }
  }

  private _detectHiddenElements(): void {
    const panelOffsetRight =
      this.panel.nativeElement.getBoundingClientRect().right;

    const visibleElements = Array.from(
      this.panel.nativeElement.children
    )?.filter((e) => !isNaN(e['aria-id']));

    for (const [index, element] of Object.entries(visibleElements)) {
      const elementOffsetRight = element.getBoundingClientRect().right;
      const elementWidth = element.getBoundingClientRect().width;
      this._offsetMap[index] = elementOffsetRight;
      if (elementWidth && elementOffsetRight > panelOffsetRight) {
        const hiddenIndex = Number(index);
        this._hiddenIndex$.next(hiddenIndex);
        break;
      }
    }

    const moreButtonElement = this.buttonMoreContainer?.nativeElement;
    if (moreButtonElement?.clientWidth) {
      if (moreButtonElement.getBoundingClientRect().right > panelOffsetRight) {
        const hiddenIndex = this._hiddenIndex$.getValue() - 1;
        this._hiddenIndex$.next(hiddenIndex);
        return;
      }

      for (const index of Object.keys(this._offsetMap).reverse()) {
        const offset =
          this._offsetMap[index] +
          moreButtonElement.clientWidth +
          this.elementGap;
        if (offset <= panelOffsetRight) {
          this._hiddenIndex$.next(Number(index) + 1);
          break;
        }
      }
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    this.hiddenItemsChange.complete();
    this._resizeObserver.unobserve(this.panel.nativeElement);
  }
}
