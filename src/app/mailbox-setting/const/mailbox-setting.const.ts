import {
  EAiConciseSetting,
  EAiToneSetting
} from '@/app/mailbox-setting/enum/mailbox-setting.enum';
import { AiSettingOption } from '@/app/mailbox-setting/interface/mailbox-setting.interface';

export const aiToneSettingOptions: AiSettingOption[] = [
  { value: EAiToneSetting.FORMAL, label: 'Formal' },
  { value: EAiToneSetting.INFORMAL, label: 'Informal' }
];

export const aiConciseSettingOptions: AiSettingOption[] = [
  {
    value: EAiConciseSetting.SHORT,
    label: 'Quite short and to be the point'
  },
  { value: EAiConciseSetting.MEDIUM, label: 'Medium in length' },
  { value: EAiConciseSetting.LONG, label: 'Longer and more explanatory' }
];
