export type ItemWithOriginIndex<T> = T & { originIndex: number };

export type GroupItemByDatePeriod<T> = {
  groupName: string;
  items: ItemWithOriginIndex<T>[];
  allowCollapse: boolean;
};
