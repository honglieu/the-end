import { Pod } from './pod.interface';

export enum InviteStatus {
  ACTIVE = 'ACTIVE',
  DEACTIVATED = 'DEACTIVATED',
  DELETED = 'DELETED'
}
export interface Agent {
  id: string;
  phoneNumber: string;
  title: string;
  isMeetTheTeam: boolean;
  isEmergencyContact: boolean;
  firstName: string;
  lastName: string;
  email: string;
  googleAvatar: string;
  type: string;
  pods: Pod[];
  isAdministrator: boolean;
  selected?: boolean;
  isLastItem?: boolean;
  label?: string;
  inviteStatus: InviteStatus;
  fullName?: string;
  notInMailbox?: boolean;
  disabled?: boolean;
}

export interface AgentItem {
  id: string;
  label: string;
  value: Agent;
  isCurrentPM: boolean;
  disabled: boolean;
}
