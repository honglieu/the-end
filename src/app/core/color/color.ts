import { TrudiSafeAny } from '@core';

export const statusColors = [
  'success',
  'processing',
  'error',
  'default',
  'warning'
] as const;

export const presetColors = [
  'pink',
  'red',
  'yellow',
  'orange',
  'cyan',
  'green',
  'blue',
  'purple',
  'geekblue',
  'magenta',
  'volcano',
  'gold',
  'lime'
] as const;

export type TrudiPresetColor = (typeof presetColors)[number];
export type TrudiStatusColor = (typeof statusColors)[number];

export function isPresetColor(color: string): color is TrudiPresetColor {
  return presetColors.indexOf(color as TrudiSafeAny) !== -1;
}

export function isStatusColor(color: string): color is TrudiPresetColor {
  return statusColors.indexOf(color as TrudiSafeAny) !== -1;
}
