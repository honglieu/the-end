import { Direction } from '@angular/cdk/bidi';
import { InjectionToken, TemplateRef, Type } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';

// import { ThemeType } from '@trudi-design/icons-angular';

import { TrudiBreakpointEnum } from '@core';
import {
  TrudiSafeAny,
  TrudiShapeSCType,
  TrudiSizeDSType,
  TrudiSizeLDSType,
  TrudiSizeMDSType,
  TrudiTSType
} from '@core';

interface MonacoEnvironment {
  globalAPI?: boolean;
  baseUrl?: string;
  getWorker?(workerId: string, label: string): Promise<Worker> | Worker;
  getWorkerUrl?(workerId: string, label: string): string;
}

export interface TrudiConfig {
  affix?: AffixConfig;
  select?: SelectConfig;
  alert?: AlertConfig;
  anchor?: AnchorConfig;
  avatar?: AvatarConfig;
  backTop?: BackTopConfig;
  badge?: BadgeConfig;
  button?: ButtonConfig;
  card?: CardConfig;
  carousel?: CarouselConfig;
  cascader?: CascaderConfig;
  codeEditor?: CodeEditorConfig;
  collapse?: CollapseConfig;
  collapsePanel?: CollapsePanelConfig;
  datePicker?: DatePickerConfig;
  descriptions?: DescriptionsConfig;
  drawer?: DrawerConfig;
  dropDown?: DropDownConfig;
  empty?: EmptyConfig;
  filterTrigger?: FilterTriggerConfig;
  form?: FormConfig;
  icon?: IconConfig;
  message?: MessageConfig;
  modal?: ModalConfig;
  notification?: NotificationConfig;
  pageHeader?: PageHeaderConfig;
  pagination?: PaginationConfig;
  progress?: ProgressConfig;
  rate?: RateConfig;
  segmented?: SegmentedConfig;
  space?: SpaceConfig;
  spin?: SpinConfig;
  switch?: SwitchConfig;
  table?: TableConfig;
  tabs?: TabsConfig;
  timePicker?: TimePickerConfig;
  tree?: TreeConfig;
  treeSelect?: TreeSelectConfig;
  typography?: TypographyConfig;
  image?: ImageConfig;
  popconfirm?: PopConfirmConfig;
  popover?: PopoverConfig;
  imageExperimental?: ImageExperimentalConfig;
  theme?: Theme;
  prefixCls?: PrefixCls;
}

export interface PrefixCls {
  prefixCls?: string;
  iconPrefixCls?: string;
}

export interface Theme {
  primaryColor?: string;
  infoColor?: string;
  successColor?: string;
  processingColor?: string;
  errorColor?: string;
  warningColor?: string;
  [key: string]: string | undefined;
}

export interface SelectConfig {
  trudiBorderless?: boolean;
  trudiSuffixIcon?: TemplateRef<TrudiSafeAny> | string | null;
  trudiBackdrop?: boolean;
}

export interface AffixConfig {
  trudiOffsetBottom?: number;
  trudiOffsetTop?: number;
}

export interface AlertConfig {
  trudiCloseable?: boolean;
  trudiShowIcon?: boolean;
}

export interface AvatarConfig {
  trudiShape?: TrudiShapeSCType;
  trudiSize?: TrudiSizeLDSType | number;
  trudiGap?: number;
}

export interface AnchorConfig {
  trudiBounds?: number;
  trudiOffsetBottom?: number;
  trudiOffsetTop?: number;
  trudiShowInkInFixed?: boolean;
}

export interface BackTopConfig {
  trudiVisibilityHeight?: number;
}

export interface BadgeConfig {
  trudiColor?: number;
  trudiOverflowCount?: number;
  trudiShowZero?: number;
}

export interface ButtonConfig {
  trudiSize?: 'large' | 'default' | 'small';
}

export interface CodeEditorConfig {
  assetsRoot?: string | SafeUrl;
  extraConfig?: TrudiSafeAny;
  defaultEditorOption?: TrudiSafeAny;
  useStaticLoading?: boolean;
  monacoEnvironment?: MonacoEnvironment;

  onLoad?(): void;

  onFirstEditorInit?(): void;

  onInit?(): void;
}

export interface CardConfig {
  trudiSize?: TrudiSizeDSType;
  trudiHoverable?: boolean;
  trudiBordered?: boolean;
  trudiBorderless?: boolean;
}

export interface CarouselConfig {
  trudiAutoPlay?: boolean;
  trudiAutoPlaySpeed?: boolean;
  trudiDots?: boolean;
  trudiEffect?: 'scrollx' | 'fade' | string;
  trudiEnableSwipe?: boolean;
  trudiVertical?: boolean;
  trudiLoop?: boolean;
}

export interface CascaderConfig {
  trudiSize?: string;
  trudiBackdrop?: boolean;
}

export interface CollapseConfig {
  trudiAccordion?: boolean;
  trudiBordered?: boolean;
  trudiGhost?: boolean;
}

export interface CollapsePanelConfig {
  trudiShowArrow?: boolean;
}

export interface DatePickerConfig {
  trudiSeparator?: string;
  trudiSuffixIcon?: string | TemplateRef<TrudiSafeAny>;
  trudiBackdrop?: boolean;
}

export interface DescriptionsConfig {
  trudiBordered?: boolean;
  trudiColumn?: { [key in TrudiBreakpointEnum]?: number } | number;
  trudiSize?: 'default' | 'middle' | 'small';
  trudiColon?: boolean;
}

export interface DrawerConfig {
  trudiMask?: boolean;
  trudiMaskClosable?: boolean;
  trudiCloseOnNavigation?: boolean;
  trudiDirection?: Direction;
}

export interface DropDownConfig {
  trudiBackdrop?: boolean;
}

export interface EmptyConfig {
  trudiDefaultEmptyContent?:
    | Type<TrudiSafeAny>
    | TemplateRef<string>
    | string
    | undefined;
}

export interface FilterTriggerConfig {
  trudiBackdrop?: boolean;
}

export interface FormConfig {
  trudiNoColon?: boolean;
  trudiAutoTips?: Record<string, Record<string, string>>;
  trudiTooltipIcon?: string | { type: string; theme: any };
}

export interface IconConfig {
  trudiTheme?: 'fill' | 'outline' | 'twotone';
  trudiTwotoneColor?: string;
}

export interface MessageConfig {
  trudiAnimate?: boolean;
  trudiDuration?: number;
  trudiMaxStack?: number;
  trudiPauseOnHover?: boolean;
  trudiTop?: number | string;
  trudiDirection?: Direction;
}

export interface ModalConfig {
  trudiMask?: boolean;
  trudiMaskClosable?: boolean;
  trudiCloseOnNavigation?: boolean;
  trudiDirection?: Direction;
}

export interface NotificationConfig extends MessageConfig {
  trudiTop?: string | number;
  trudiBottom?: string | number;
  trudiPlacement?:
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight'
    | 'top'
    | 'bottom';
}

export interface PageHeaderConfig {
  trudiGhost: boolean;
}

export interface PaginationConfig {
  trudiSize?: 'default' | 'small';
  trudiPageSizeOptions?: number[];
  trudiShowSizeChanger?: boolean;
  trudiShowQuickJumper?: boolean;
  trudiSimple?: boolean;
}

export interface ProgressConfig {
  trudiGapDegree?: number;
  trudiGapPosition?: 'top' | 'right' | 'bottom' | 'left';
  trudiShowInfo?: boolean;
  trudiStrokeSwitch?: number;
  trudiStrokeWidth?: number;
  trudiSize?: 'default' | 'small';
  trudiStrokeLinecap?: 'round' | 'square';
  trudiStrokeColor?: string;
}

export interface RateConfig {
  trudiAllowClear?: boolean;
  trudiAllowHalf?: boolean;
}

export interface SegmentedConfig {
  trudiSize?: TrudiSizeLDSType;
}

export interface SpaceConfig {
  trudiSize?: 'small' | 'middle' | 'large' | number;
}

export interface SpinConfig {
  trudiIndicator?: TemplateRef<TrudiSafeAny>;
}

export interface SwitchConfig {
  trudiSize: TrudiSizeDSType;
}

export interface TableConfig {
  trudiBordered?: boolean;
  trudiSize?: TrudiSizeMDSType;
  trudiShowQuickJumper?: boolean;
  trudiLoadingIndicator?: TemplateRef<TrudiSafeAny>;
  trudiShowSizeChanger?: boolean;
  trudiSimple?: boolean;
  trudiHideOnSinglePage?: boolean;
}

export interface TabsConfig {
  trudiAnimated?:
    | boolean
    | {
        inkBar: boolean;
        tabPane: boolean;
      };
  trudiSize?: TrudiSizeLDSType;
  trudiType?: 'line' | 'card';
  trudiTabBarGutter?: number;
  trudiShowPagination?: boolean;
}

export interface TimePickerConfig {
  trudiAllowEmpty?: boolean;
  trudiClearText?: string;
  trudiNowText?: string;
  trudiOkText?: string;
  trudiFormat?: string;
  trudiHourStep?: number;
  trudiMinuteStep?: number;
  trudiSecondStep?: number;
  trudiPopupClassName?: string;
  trudiUse12Hours?: string;
  trudiSuffixIcon?: string | TemplateRef<TrudiSafeAny>;
  trudiBackdrop?: boolean;
}

export interface TreeConfig {
  trudiBlockNode?: boolean;
  trudiShowIcon?: boolean;
  trudiHideUnMatched?: boolean;
}

export interface TreeSelectConfig {
  trudiShowIcon?: string;
  trudiShowLine?: boolean;
  trudiDropdownMatchSelectWidth?: boolean;
  trudiHideUnMatched?: boolean;
  trudiSize?: 'large' | 'small' | 'default';
  trudiBackdrop?: boolean;
}

export interface TypographyConfig {
  trudiEllipsisRows?: number;
  trudiCopyTooltips?: [TrudiTSType, TrudiTSType] | null;
  trudiCopyIcons: [TrudiTSType, TrudiTSType];
  trudiEditTooltip?: null | TrudiTSType;
  trudiEditIcon: TrudiTSType;
}

export interface ImageConfig {
  trudiFallback?: string;
  trudiPlaceholder?: string;
  trudiDisablePreview?: string;
  trudiCloseOnNavigation?: boolean;
  trudiDirection?: Direction;
}

export interface ImageExperimentalConfig {
  trudiFallback?: string;
  trudiPlaceholder?: string;
  trudiDisablePreview?: string;
  trudiCloseOnNavigation?: boolean;
  trudiDirection?: Direction;
  trudiAutoSrcset?: boolean;
  trudiSrcLoader?(params: { src: string; width: number }): string;
}

export interface PopConfirmConfig {
  trudiPopconfirmBackdrop?: boolean;
  trudiAutofocus?: null | 'ok' | 'cancel';
}

export interface PopoverConfig {
  trudiPopoverBackdrop?: boolean;
}

export type TrudiConfigKey = keyof TrudiConfig;

/**
 * User should provide an object implements this interface to set global configurations.
 */
export const TRUDI_CONFIG = new InjectionToken<TrudiConfig>('trudi-config');
