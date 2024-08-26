import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { conversations } from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs';
import { MaintenanceNote } from '@shared/types/conversation.interface';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceNoteService {
  private maintenanceNoteBS = new BehaviorSubject<MaintenanceNote>(null);
  constructor(private apiService: ApiService) {}

  getMaintenanceNoteByTaskId(taskId: string) {
    return this.apiService.getAPI(conversations, `maintenance-note/${taskId}`);
  }

  get maintenanceNote$() {
    return this.maintenanceNoteBS.asObservable();
  }

  setMaintenanceNote(note: MaintenanceNote) {
    this.maintenanceNoteBS.next(note);
  }
}
