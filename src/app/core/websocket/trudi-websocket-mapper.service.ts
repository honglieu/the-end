import { Injectable } from '@angular/core';
import { AIResponseMapper } from './mapper/ai-response.mapper';
import { AIResponseDto } from './dto/ai-response.dto';
import { TrudiAIWebSocketAction } from './types';

@Injectable({
  providedIn: 'root'
})
export class TrudiWebSocketMapperService {
  private readonly _aiResponseMapper = new AIResponseMapper();
  constructor() {}

  public toModel<TModel>(
    action: TrudiAIWebSocketAction,
    data: unknown
  ): TModel | null {
    switch (action) {
      case TrudiAIWebSocketAction.AI_RESPONSE:
      case TrudiAIWebSocketAction.GENERATE_EMAIL:
        return this._aiResponseMapper.toModel(data as AIResponseDto) as TModel;
      default:
        console.error(`Unknown type: ${action}`);
        return null;
    }
  }
}
