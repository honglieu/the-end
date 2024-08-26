export interface FilterBoxDataEmit {
  status: any[];
  assignTo: any[];
  topic: any[];
  manager: any[];
}

export interface FilterTopic {
  description?: string;
  id?: string;
  name?: string;
  order?: number;
  podId?: string;
  selected?: boolean;
}
