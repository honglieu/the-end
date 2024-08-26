import { NgClassInterface, TrudiValidateStatus } from '@core';

export function getStatusClassNames(
  prefixCls: string,
  status?: TrudiValidateStatus,
  hasFeedback?: boolean
): NgClassInterface {
  return {
    [`${prefixCls}-status-success`]: status === 'success',
    [`${prefixCls}-status-warning`]: status === 'warning',
    [`${prefixCls}-status-error`]: status === 'error',
    [`${prefixCls}-status-validating`]: status === 'validating',
    [`${prefixCls}-has-feedback`]: hasFeedback
  };
}
