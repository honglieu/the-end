import { AiInteractiveBubbleInitialData } from '@/app/dashboard/components/ai-interactive-bubble/interfaces/ai-interactive-bubble.interface';
import { InjectionToken } from '@angular/core';

export const AI_INTERACTIVE_PLACEHOLDER = {
  NO_SELECTEDTEXT:
    'Type anything you want here and watch as I write the email for you…',
  SELECTED_TEXT:
    'Tell me how you want to rewrite the section you have highlighted...',
  HISTORY_STATE: 'Tell me to…'
};

export const AIInteractiveInitialDataToken =
  new InjectionToken<AiInteractiveBubbleInitialData>(
    'AIInteractiveInitialValue'
  );

export const AI_INTERACTIVE_WHITE_LIST = [
  '.interactive-bubble',
  '.resize-wrapper',
  '.suggestion-list',
  '.typing_fake',
  '.ai__interactive--typing',
  '.reply__stop',
  '.ai-detect-policy-popover-overlay',
  '.ant-tooltip'
];
