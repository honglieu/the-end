export interface TrudiTab<T> {
  title: string;
  link: string;
  queryParam?: T;
  unread?: boolean;
  disabled?: boolean;
  icon?: string;
}
export interface IAgencySettingTab<T> {
  label: string;
  tabs: TrudiTab<T>[];
}
