import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { NO_PORTFOLIO_USER_ID, trudiUserId } from '@services/constants';
import { UserService } from '@services/user.service';
import { EFilterType } from '@shared/enum/user.enum';
import { userType } from '@trudi-ui';
import { EPlacement } from '@shared/types';
import { IDropdownMenuItem } from '@/app/user/shared/interfaces/dropdown-menu.interfaces';
import { AuthService } from './../../../../services/auth.service';
import { DropdownMenuContactsKeyboardService } from './dropdown-menu-contacts-keyboard.service';
import { isEqual } from 'lodash-es';

@Component({
  selector: 'dropdown-menu-contacts',
  templateUrl: './dropdown-menu-contacts.component.html',
  styleUrls: ['./dropdown-menu-contacts.component.scss'],
  providers: [DropdownMenuContactsKeyboardService]
})
export class DropdownMenuContactsComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() listItem: any[];
  @Input() label: string;
  @Input() type: EFilterType;
  @Input() defaultListValues: string[] = [];
  @Input() defaultStatus: Boolean;
  @Input() noResetListItem: Boolean;
  @Input() formDropdown: 'single selection' | 'multiple selection' =
    'multiple selection';
  @Output() itemsSelected = new EventEmitter<{
    items: IDropdownMenuItem[];
    type: EFilterType;
    ignoreThisEmitting?: Boolean;
  }>(null);

  public assignBoxPlacement = EPlacement.BOTTOM_LEFT;
  public currentListItem: IDropdownMenuItem[] = [];
  public defaultFilterList: IDropdownMenuItem[] = [];
  public nonDisplayListItem: IDropdownMenuItem[] = [];
  public newFilterList: IDropdownMenuItem[] = [];
  public isSelected: boolean = false;
  public showClearIcon: boolean = false;
  public typeDropdown = EFilterType;
  public focus: boolean = false;
  public pipeType: string = userType.DEFAULT;
  private unsubscribe = new Subject<void>();
  public isRmEnvironment: boolean = false;
  searchFormControl$ = new FormControl('');

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private menuKeyBoardService: DropdownMenuContactsKeyboardService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['listItem']?.currentValue) {
      this.currentListItem = changes['listItem'].currentValue;
      this.updateCurrentListItems();
    }
    const previousDefaultFilter = changes['defaultListValues']?.previousValue;
    const currentDefaultFilter = changes['defaultListValues']?.currentValue;
    if (!isEqual(previousDefaultFilter, currentDefaultFilter)) {
      this.updateCurrentListItems();
    }
  }

  ngOnInit(): void {
    this.searchFormControl$.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchKey) => {
          this.showClearIcon = !!searchKey;
          return this.authService.getPortfoliosByType(
            'ALL-PORTFOLIO',
            encodeURIComponent(searchKey)
          );
        })
      )
      .subscribe((res) => {
        if (res) {
          this.setPortfolioList(res);
          this.cdr.markForCheck();
        }
      });
  }

  getValueToCheck(item) {
    switch (this.type) {
      case EFilterType.PORTFOLIO:
      case EFilterType.AGENCIES:
        return item.id;
      case EFilterType.LAST_IMPORT:
        return item.value;
      default:
        return item.text;
    }
  }

  updateCurrentListItems() {
    this.currentListItem = this.currentListItem.map((item) => {
      const valueToCheck = this.getValueToCheck(item);
      const isSelected = this.defaultListValues?.includes(valueToCheck);
      return { ...item, selected: isSelected };
    });
    this.defaultFilterList = this.currentListItem.filter(
      (item) => item.selected
    );
    this.onItemChanged(this.defaultFilterList);

    this.itemsSelected.emit({
      items: this.defaultFilterList,
      type: this.type,
      ignoreThisEmitting: true
    });
  }

  setPortfolioList(portfolios) {
    let list = portfolios;
    const userId = this.userService.userInfo$.value?.id;

    this.currentListItem = list
      .filter((el) => el.id !== trudiUserId)
      .map((el) => ({
        id: el.id,
        text: this.combineNames(el.firstName, el.lastName),
        selected: Boolean(
          this.defaultFilterList?.find((item) => item.id === el.id)?.selected
        )
      }))
      .sort((x, y) => {
        return x.selected ? -1 : y.selected ? 1 : 0;
      });

    if (list[0]?.id !== userId) {
      // move user to first in array
      list.sort(function (x, y) {
        return x.id === userId ? -1 : y.id === userId ? 1 : 0;
      });
    }
  }

  combineNames(firstName: string | null, lastName: string | null): string {
    return [firstName, lastName].filter(Boolean).join(' ');
  }

  onDropdownMenuVisibleChange(visible: boolean) {
    this.isSelected = visible;
    if (visible) {
      this.menuKeyBoardService.hanldeNavigate();
      if (this.type === this.typeDropdown.PORTFOLIO) {
        const noPortfolioIndex = this.currentListItem.findIndex(
          (item) => item.id === NO_PORTFOLIO_USER_ID
        );
        const noPortfolio = this.currentListItem.splice(noPortfolioIndex, 1)[0];

        const sortedItems = this.currentListItem.sort((x, y) => {
          if (x.selected === y.selected) {
            const xName = (x.text ?? x.name)?.toUpperCase() || '';
            const yName = (y.text ?? y.name)?.toUpperCase() || '';
            return xName.localeCompare(yName);
          } else {
            return x.selected ? -1 : 1;
          }
        });

        const selectedIndex = sortedItems.findIndex((item) => !item.selected);
        const selectedItems = sortedItems.splice(0, selectedIndex);

        this.currentListItem = noPortfolio.selected
          ? [...selectedItems, noPortfolio, ...sortedItems]
          : [...selectedItems, ...sortedItems, noPortfolio];
      }
    } else {
      this.focus = false;
      this.menuKeyBoardService.reset();
    }
  }

  onItemChanged(items: IDropdownMenuItem[]) {
    const maxDisplayAssignedAgents =
      this.defaultFilterList.length === 1 ? 2 : 1;
    if (items?.length === this.listItem?.length && !this.noResetListItem) {
      this.newFilterList = [];
      this.nonDisplayListItem = [];
    } else {
      this.newFilterList = items.slice(0, maxDisplayAssignedAgents);
      this.nonDisplayListItem = items.slice(maxDisplayAssignedAgents);
    }
  }

  onShowPopupAssign(event: MouseEvent) {
    // event.stopPropagation();  Affects closing the notification modal when clicking outside
    this.focus = true;
  }

  handleCheckbox(id: string) {
    const currentItem = this.currentListItem.find((item) => item.id === id);
    currentItem.selected = !currentItem.selected;
    switch (this.formDropdown) {
      case 'single selection':
        let items;
        if (currentItem.selected) {
          this.currentListItem = this.currentListItem.map((item) => {
            if (item.id === id) {
              return { ...item, selected: currentItem.selected };
            }
            return { ...item, selected: false };
          });

          this.defaultFilterList = [currentItem];
          this.onItemChanged(this.defaultFilterList);
        } else {
          this.defaultFilterList = [];
          this.onItemChanged(this.defaultFilterList);
        }
        this.itemsSelected.emit({
          items: this.defaultFilterList,
          type: this.type
        });
        this.onDropdownMenuVisibleChange(false);
        break;

      default:
        if (currentItem.selected) {
          this.defaultFilterList = [...this.defaultFilterList, currentItem];
          this.onItemChanged(this.defaultFilterList);
        } else {
          this.defaultFilterList = this.defaultFilterList.filter(
            (agent) => agent.id !== id
          );
          this.onItemChanged(this.defaultFilterList);
        }
        this.itemsSelected.emit({
          items: this.defaultFilterList,
          type: this.type
        });
        break;
    }
  }

  onSearch(e: Event) {
    e.stopPropagation();
  }

  handleClearSearch() {
    this.searchFormControl$.setValue('');
  }

  clear(event: MouseEvent) {
    event.stopPropagation();
    this.newFilterList = [];
    this.defaultFilterList = [];
    this.nonDisplayListItem = [];
    this.currentListItem = this.currentListItem.map((item) => {
      return { ...item, selected: false };
    });
    this.itemsSelected.emit({ items: [], type: this.type });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
export { IDropdownMenuItem };
