import { Injectable } from '@angular/core';
import { AIResponseDto } from '@core';
import { AIResponse } from '@core';

@Injectable()
export class AIResponseMapper {
  public toModel(data: AIResponseDto): AIResponse {
    return {
      messageId: data.message_id,
      threadId: data.thread_id,
      action: data.action,
      sender: data.sender,
      payload: data.payload
    };
  }
}
