import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'seibertron-component-template-list',
  templateUrl: './component-template-list.component.html',
  styleUrls: ['./component-template-list.component.less']
})
export class ComponentTemplateListComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
