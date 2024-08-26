import { IListDynamic } from '@/app/dashboard/modules/task-editor/constants/dynamic-parameter.constant';
import { ISendMsgConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';

export interface IInteractiveAi {
  id: string;
  prompt: string;
  reply: string;
  isGenerating: boolean;
}

export interface ISuggestionOptionPayload {
  text: string;
  mode: string;
  message_id?: string;
  workflow_id?: string;
}

export interface ISuggestionOptionResponse {
  buttons: IOptionButton[];
  message: string;
  workflow: null;
}

export interface IOptionButton {
  id?: string;
  label: string;
  weight: number;
  type: string;
  prompt: string;
}

export interface ISuggestionReply
  extends Omit<ISuggestionOptionPayload, 'message_id'> {
  selection: string;
}

export interface ISuggestionReplyResponse {
  modified_reply: string;
  status: string;
}

export interface AiInteractiveBubbleInitialData {
  dragBoundary: string;
  freeDragPosition: {
    x: number;
    y: number;
  };
  sendMsgConfigs: ISendMsgConfigs;
  listCodeOptions: IListDynamic[];
}

export enum EAiWindowState {
  Mutation,
  Policy
}

export enum EFocusState {
  Tiny,
  AiWindow
}
