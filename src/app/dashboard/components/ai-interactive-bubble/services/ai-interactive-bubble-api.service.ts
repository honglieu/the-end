import {
  ISuggestionOptionPayload,
  ISuggestionOptionResponse,
  ISuggestionReply,
  ISuggestionReplyResponse
} from '@/app/dashboard/components/ai-interactive-bubble/interfaces/ai-interactive-bubble.interface';
import { ApiService } from '@/app/services/api.service';
import { apiKey, aiApiEndpoint } from '@/environments/environment';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AiInteractiveBubbleApiService {
  constructor(private apiService: ApiService) {}

  getSuggestionOptions(
    payload: ISuggestionOptionPayload
  ): Observable<ISuggestionOptionResponse> {
    return this.apiService.postAPI(
      aiApiEndpoint,
      '/realtime/email/options',
      payload
    );
  }

  getSuggestionReply(
    payload: ISuggestionReply
  ): Observable<ISuggestionReplyResponse> {
    return this.apiService.postAPI(
      aiApiEndpoint,
      '/realtime/email/modify',
      payload
    );
  }
}
