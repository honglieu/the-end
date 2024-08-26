import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';

export type TrudiAIWebSocketResponse = {
  action: TrudiAIWebSocketAction;
  [key: string]: unknown;
};

export type TrudiAIWebSocketConfig =
  WebSocketSubjectConfig<TrudiAIWebSocketResponse>;

export type TrudiAIWebSocketSubject =
  WebSocketSubject<TrudiAIWebSocketResponse>;

export enum TrudiAIWebSocketAction {
  PING = 'ping',
  PONG = 'pong',
  AI_RESPONSE = 'ai_response',
  SET_STATE = 'set_state',
  STATE_CHANGE_TRIGGER = 'state_change_trigger',
  COMMAND = 'command',
  JOIN = 'join',
  POLICY_DETECTION = 'policy_detection',
  GENERATE_EMAIL = 'generate_email',
  MESSAGE = 'message',
  STOP_GENERATE = 'stop_generate',
  SYSTEM_NOTIFICATION = 'system_notification'
  // add more actions here
}

export enum TrudiAIWebSocketCommandType {
  GENERATE_EMAIL = 'generate_email',
  GENERATE_MESSAGE = 'generate_message'
}
