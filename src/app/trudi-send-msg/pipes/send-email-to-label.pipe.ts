import { Pipe, PipeTransform } from '@angular/core';
import { ISendMsgConfigs } from '../utils/trudi-send-msg.interface';

@Pipe({ name: 'sendEmailToLabel' })
export class SendEmailToLabelPipe implements PipeTransform {
  constructor() {}
  transform(configs: ISendMsgConfigs) {
    const { openFromBulkCreateTask } = configs?.otherConfigs;
    const excustingStep = configs.inputs.prefillData?.name || '';
    const sendTypeText = openFromBulkCreateTask
      ? `Executing step: ${excustingStep}`
      : 'SP to: ';
    return sendTypeText;
  }
}
