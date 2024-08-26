import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Pod } from '@shared/types/pod.interface';
import { conversations } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PodService {
  constructor(private apiService: ApiService) {}

  getListOfPod() {
    return this.apiService.getData<Pod[]>(`${conversations}list-pod`);
  }
}
