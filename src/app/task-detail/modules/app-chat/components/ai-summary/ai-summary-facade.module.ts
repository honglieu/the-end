import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AISummaryFacadeService } from './ai-summary-facade.service';
import { AISummaryApiService } from './apis/ai-summary-api.service';
import { ConversationState } from './state/conversation-state';
import { FileState } from './state/file-state';
import { SummaryContentState } from './state/summary-content-state';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [],
  imports: [CommonModule, TrudiUiModule],
  providers: [
    ConversationState,
    FileState,
    SummaryContentState,
    AISummaryApiService,
    AISummaryFacadeService
  ]
})
export class WidgetAiSummaryFacadeModule {}
