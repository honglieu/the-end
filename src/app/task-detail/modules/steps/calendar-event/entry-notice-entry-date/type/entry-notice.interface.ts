export interface EntryNoticeData {
  createdAt: string;
  date: string;
  eventChangeHistory: {
    createdAt: string;
    eventDate: string;
    status: string;
  };
  eventDate: string;
  eventName: string;
  eventStatus: string;
  eventType: string;
  id: string;
  isTriggedTask: boolean;
  propertyId: string;
  subEventId: string;
  taskId: string;
  time: string;
  updatedAt: string;
}
