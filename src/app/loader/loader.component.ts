import { Component, OnInit } from '@angular/core';
import { LoadingService } from '@services/loading.service';

@Component({
  selector: 'app-loader-global',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderGlobalComponent implements OnInit {
  constructor(public loadingService: LoadingService) {}

  ngOnInit(): void {}
}
