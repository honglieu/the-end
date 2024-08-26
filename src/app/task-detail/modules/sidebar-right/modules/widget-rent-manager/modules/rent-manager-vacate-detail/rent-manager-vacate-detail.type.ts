export interface IRentManagerVacateDetail {
  id: string;
  moveInDate: Date;
  vacateDate: Date; //same move out date
  noticeDate?: Date;
  expectedMoveOutDate?: Date;
  tenancy: VacateTenancy;
}

export interface VacateTenancy {
  id: string;
  name: string;
  status: string;
}

export interface VacateDetailPayload {
  taskId: string;
  variables: {
    tenancyId: string;
    moveInDate: string;
    vacateDate: string;
    noticeDate: string;
    expectedMoveOutDate: string;
  };
}
