export interface StatisticUnread {
  [key: string]: {
    agencyId: string;
    myInbox: {
      message: {
        [key: string]: StatisticUnreadMessage;
      };
      messageInTask: {
        [key: string]: StatisticUnreadMessage;
      };
      task: StatisticUnreadTask;
      totalMessageCount: StatisticUnreadMessage;
      totalMessageInTaskCount: StatisticUnreadMessage;
      totalTaskCount: StatisticUnreadTask;
      messageReminder: StatisticMessageReminder;
    };
    unassigned: {
      message: StatisticUnreadMessage;
    };
    teamInbox: {
      message: {
        [key: string]: StatisticUnreadMessage;
      };
      messageInTask: {
        [key: string]: StatisticUnreadMessage;
      };
      task: StatisticUnreadTask;
      totalMessageCount: StatisticUnreadMessage;
      totalMessageInTaskCount: StatisticUnreadMessage;
      totalTaskCount: StatisticUnreadTask;
      messageReminder: StatisticMessageReminder;
    };
  };
}

export interface StatisticReminder {
  myInbox: {
    messageReminder: StatisticMessageReminder;
  };
  teamInbox: {
    messageReminder: StatisticMessageReminder;
  };
}

export interface StatisticUnreadMessage {
  completed: number;
  deleted: number;
  opened: number;
}

export interface StatisticUnreadTask {
  completed: object;
  deleted: object;
  inprogress: object;
}
export interface StatisticMessageReminder {
  followup: number;
  unanswered: number;
}
