import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'folder-sidebar-item',
  templateUrl: './folder-sidebar-item.component.html',
  styleUrls: ['./folder-sidebar-item.component.scss']
})
export class FolderSidebarItemComponent implements OnInit {
  @Input() folders;
  constructor() {}

  ngOnInit(): void {}
}
