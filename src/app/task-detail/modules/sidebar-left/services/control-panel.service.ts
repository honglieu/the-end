import { BehaviorSubject } from 'rxjs';
import { TrudiButton, Intents } from '@shared/types/trudi.interface';

export enum ControlPanelTab {
  files = 'Files',
  trudi = 'Trudi'
}

interface forwardLandlordDataType {
  owner: { id: string; firstName: string; lastName: string }[];
  type: { id: string; name: string };
  quote?: number;
}

export class ControlPanelService {
  public reloadForwardRequestList: BehaviorSubject<TrudiButton[]> =
    new BehaviorSubject(null);
  public triggerGetTrudiIntents: BehaviorSubject<Intents[]> =
    new BehaviorSubject(null);
  public sendMsgDocumentRequestQA: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  public isShowListDecision: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  previousTab = new BehaviorSubject(0);
  selectedId = new BehaviorSubject(null);
  forwardLandlordData: forwardLandlordDataType;
  syncedProperty = new BehaviorSubject(false);
  currentTab: any = ControlPanelTab.trudi;

  constructor() {}

  getSelectedID() {
    return this.selectedId.asObservable();
  }

  setSelectedID(id: string) {
    this.selectedId.next(id);
  }

  getPreviousTab() {
    return this.previousTab.asObservable();
  }

  setPreviousTab(tab: number) {
    this.previousTab.next(tab);
  }

  reset() {
    this.previousTab.next(0);
  }

  resetForwardLandlordData() {
    this.forwardLandlordData = { owner: [], type: { id: null, name: null } };
  }
}
