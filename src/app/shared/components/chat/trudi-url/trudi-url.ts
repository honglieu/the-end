import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { conversations } from 'src/environments/environment';
import { ApiService } from '@services/api.service';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';

@Component({
  selector: 'app-trudi-url',
  templateUrl: 'trudi-url.html',
  styleUrls: ['./trudi-url.scss']
})
export class TrudiUrlComponent implements OnInit {
  @Input() url: string;
  public image: string;
  public description: string;
  public loading: boolean;
  public delUrl: string;
  private unsubscribe = new Subject<void>();

  constructor(
    private http: HttpClient,
    private ref: ChangeDetectorRef,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    if (this.url) {
      this.apiService
        .getAPI(conversations, `preview?url=${this.url}`)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          this.description = res.description || res.title;
          this.image = res.images.length > 0 ? res.images[0] : null;
        });
    }
  }

  openInNewWindow() {
    window.open(this.url, '_blank');
  }
}
