import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { ConversationService } from './conversation.service';
import { TaskService } from './task.service';

@Injectable({
  providedIn: 'root'
})
export class OutgoingInspectionService {
  public inspectionStatus: BehaviorSubject<string> = new BehaviorSubject('');

  constructor(
    private apiService: ApiService,
    private conversationService: ConversationService,
    private activatedRoute: ActivatedRoute,
    private taskService: TaskService
  ) {}
}
