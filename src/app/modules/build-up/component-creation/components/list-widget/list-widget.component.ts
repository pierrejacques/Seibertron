import DynamicObject from '@/interfaces/dynamic-object';
import WidgetTreeNode from '@/interfaces/tree-node';
import { DataMappingService } from '@/services/data-mapping.service';
import { BasicFormService } from '@/services/forms/basic-form.service';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'seibertron-list-widget',
  templateUrl: './list-widget.component.html',
  styleUrls: ['./list-widget.component.less']
})
export class ListWidgetComponent implements OnInit {

  constructor(
    private basicFormService: BasicFormService,
    private dataMappingService: DataMappingService,
  ) { }

  @Input()
  data: WidgetTreeNode;

  @Input()
  props: DynamicObject;

  get styles() {
    return this.basicFormService.convertSchemaToStyles(this.data.schema);
  }

  items: any[] = [];

  ngOnInit() {
    console.log('data: ', this.data);
    // 默认循环 20 次
    const defaultLoopCount = 20;
    if ('itemSchema' in this?.data?.schema && this?.data?.schema?.itemSchema) {
      this.items = this.output();
    }
  }

  output() {
    const { data, operation } = this.data?.schema?.dataMapping.list;
    if (operation) {
      const result = this.dataMappingService.output(operation, this.props?.dataSourceSchema);
      console.log('映射结果：', result);
      return result;
    }
    return data;
  }

  trackByItems(index: number) {
    return index;
  }

}
