import { Component, HostBinding, Input, OnInit } from '@angular/core';
import WidgetTreeNode from '@/interfaces/tree-node';
import { BasicFormService } from '@/services/forms/basic-form.service';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import Layout from '@/enum/layout';
import WidgetType from '@/enum/schema/widget-type.enum';

@Component({
  selector: 'byp-tree-widget',
  templateUrl: './tree-widget.component.html',
  styleUrls: ['./tree-widget.component.less'],
})
export class TreeWidgetComponent implements OnInit {

  constructor(
    private basicFormService: BasicFormService,
    private domSanitizer: DomSanitizer
  ) { }

  @Input()
  data: WidgetTreeNode;

  // 父节点的 data（根元素的 parent 为 null)
  @Input()
  parent: WidgetTreeNode;

  @HostBinding('style')
  get hostStyles(): SafeStyle {
    // TODO 用其他生命周期优化下
    if (this.data.schema.type === WidgetType.container) {
      let styleStr = this.basicFormService.convertSchemaToStyleStr(this.data.schema);
      if (this.parent && this.parent.schema.styles.display.value === Layout.flex) {
        styleStr += 'flex-shrink: 0';
      }
      return this.domSanitizer.bypassSecurityTrustStyle(styleStr);
    }
    return this.domSanitizer.bypassSecurityTrustStyle('flex-shrink: 0');
  }

  get styles() {
    return this.basicFormService.convertSchemaToStyles(this.data.schema);
  }

  ngOnInit() {}

  trackByItems(index: number, item: any) {
    return item.id;
  }

}
