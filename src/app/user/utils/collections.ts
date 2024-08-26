export enum ESelectAllStatus {
  INDETERMINED = 'checkboxIndeterminate',
  SELECTED = 'userChecked',
  UNSELECTED = 'userUnCheck'
}

export class SelectionModel<T extends { id: string; isChecked: boolean }> {
  private selectedItems: T[] = [];
  private allItems: T[] = [];
  constructor(
    private isMultiSelect: boolean = false,
    private initialSelectedItems: T[] = []
  ) {
    this.selectedItems = initialSelectedItems;
  }

  select(item: T): void {
    this.selectedItems.push(item);
  }

  toggle(item: T): void {
    if (!this.isMultiSelect) {
      this.selectedItems = [];
    }

    if (this.isSelected(item)) {
      this.deselect(item);
    } else {
      this.select(item);
    }
  }

  toggleSelectAll(): void {
    const areAllOptionsSelected = this.allSelectedStatus();
    if (areAllOptionsSelected === ESelectAllStatus.UNSELECTED) {
      this.selectAll();
    } else {
      this.deselectAll();
    }
  }

  setAllItems(items: T[]) {
    this.allItems = items;
  }

  deselect(item: T): void {
    this.selectedItems = this.selectedItems.filter(({ id }) => id !== item.id);
  }

  isSelected(data: T): boolean {
    return this.selectedItems.some(
      (item) => item?.isChecked !== data?.isChecked
    );
  }

  deselectAll(): void {
    this.selectedItems = [];
  }

  selectAll(): void {
    if (!this.isMultiSelect) {
      return;
    }

    this.allItems.forEach((item) => {
      if (!this.isSelected(item)) {
        this.select(item);
      }
    });
  }

  allSelectedStatus(): ESelectAllStatus {
    if (this.selectedItems.length === 0) {
      return ESelectAllStatus.UNSELECTED;
    }

    const areAllOptionsSelected =
      this.selectedItems.length === this.allItems.length;

    return areAllOptionsSelected
      ? ESelectAllStatus.SELECTED
      : ESelectAllStatus.INDETERMINED;
  }

  get selected(): T[] {
    return this.selectedItems;
  }
}

export class SelectionModelPaging<
  T extends { id: string; isChecked: boolean }
> {
  private selectedItems: T[] = [];
  private allItemsAtThisPage: T[] = [];
  constructor(
    private isMultiSelect: boolean = false,
    private initialSelectedItems: T[] = []
  ) {
    this.selectedItems = initialSelectedItems;
  }

  select(item: T): void {
    this.selectedItems = [...this.selectedItems, item];
  }

  toggle(item: T): void {
    if (!this.isMultiSelect) {
      this.selectedItems = [];
    }

    if (this.isSelected(item)) {
      this.deselect(item);
    } else {
      this.select(item);
    }
  }

  toggleSelectAll(): void {
    const areAllOptionsSelected = this.allSelectedStatus();
    if (areAllOptionsSelected === ESelectAllStatus.UNSELECTED) {
      this.selectAll();
    } else {
      this.deselectAll();
    }
  }

  setAllItems(items: T[]) {
    this.allItemsAtThisPage = items;
  }

  deselect(item: T, distinctField: string = 'id'): void {
    this.selectedItems = this.selectedItems.filter(
      (el) => el[distinctField] !== item[distinctField]
    );
  }

  isSelected(data: T): boolean {
    return this.selectedItems.some((item) => item.id === data.id);
  }

  deselectAll(): void {
    for (let i = 0; i < this.allItemsAtThisPage.length; i++) {
      this.deselect(this.allItemsAtThisPage[i]);
    }
  }

  resetAll(): void {
    this.selectedItems = [];
  }

  selectAll(): void {
    if (!this.isMultiSelect) {
      return;
    }

    this.allItemsAtThisPage.forEach((item) => {
      if (!this.isSelected(item)) {
        this.select(item);
      }
    });
  }

  allSelectedStatus(): ESelectAllStatus {
    const numberOfSelectedItems = this.allItemsAtThisPage.filter((item) =>
      this.isSelected(item)
    ).length;
    if (numberOfSelectedItems === 0) {
      return ESelectAllStatus.UNSELECTED;
    }

    const areAllOptionsAtThisPageSelected =
      numberOfSelectedItems === this.allItemsAtThisPage.length;

    return areAllOptionsAtThisPageSelected
      ? ESelectAllStatus.SELECTED
      : ESelectAllStatus.INDETERMINED;
  }

  get selected(): T[] {
    return this.selectedItems;
  }
}
