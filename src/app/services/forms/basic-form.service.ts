import Alignment from '@/enum/alignment';
import BorderStyle from '@/enum/border-style';
import ControlType from '@/enum/control-type.enum';
import Layout from '@/enum/layout';
import EventType from '@/enum/schema/event-type.enum';
import LinkTarget from '@/enum/schema/link-target.enum';
import Positioning from '@/enum/schema/positioning.enum';
import StateOperator from '@/enum/schema/state-operator.enum';
import DataMappingOperator from '@/enum/schema/state-operator.enum';
import InsertType from '@/enum/schema/widget-type.enum';
import StyleValueUnit from '@/enum/style-value-unit';
import ValueType from '@/enum/value-type';
import DynamicObject from '@/interfaces/dynamic-object';
import IFormItem from '@/interfaces/form/form-item';
import IStyleFormItem from '@/interfaces/form/style-form-item';
import { ContainerSchema } from '@/interfaces/schema/container.schema';
import { DataMappingSchema } from '@/interfaces/schema/data-mapping.schema';
import DataSourceSchema from '@/interfaces/schema/data-source.schema';
import StateSchema from '@/interfaces/schema/state-schema';
import { StyleCollectionSchema } from '@/interfaces/schema/style-collection.schema';
import { StyleSchema } from '@/interfaces/schema/style.schema';
import WidgetTreeNode from '@/interfaces/tree-node';
import FormItem from '@/models/form/form-item';
import StyleFormItem from '@/models/form/style-form-item';
import WidgetFamilySchema from '@/types/widget-family-schema';
import { getTypeOf } from '@/utils';
import _ from 'lodash/fp';
import { v1 as uuid } from 'uuid';
import EventSchema, { LinkageType, TriggerType } from '@/interfaces/schema/event.schema';
import { StateSchemaCollection } from '@/interfaces/schema/component.schema';

type BasicSchemaPartial = { id: string; type: InsertType | string; name: string; desc: string };

export class BasicFormService {
  constructor() {}

  static readonly sizeOptionPartial: any = {
    value: 0,
    valueType: ValueType.number,
    required: false,
    controlType: ControlType.number,
    unit: StyleValueUnit.px,
  };

  static readonly fontFormItems: any[] = [
    new FormItem<number>({
      name: 'fontSize',
      label: '字号',
      desc: '字号',
      value: 12,
      controlType: ControlType.number,
      unit: 'px',
      required: false,
    } as IFormItem<number>),
    new FormItem<string>({
      name: 'fontFamily',
      label: '字体',
      desc: '字体',
      value: 'PingFang SC',
      required: true,
      controlType: ControlType.select,
      selectOptions: [
        {
          name: '苹方SC',
          value: 'PingFang SC',
        },
        {
          name: '微软雅黑',
          value: 'Microsoft YaHei',
        },
        {
          name: 'Helvetica',
          value: 'Helvetica',
        },
      ],
    } as IFormItem<string>),
    new FormItem<number>({
      name: 'lineHeight',
      label: '行高',
      desc: '行高',
      value: 12,
      unit: 'px',
      required: true,
      controlType: ControlType.number,
    } as IFormItem<number>),
    new FormItem<string>({
      name: 'color',
      label: '颜色',
      desc: '请输入颜色',
      value: '#000',
      required: false,
      controlType: ControlType.text,
    } as IFormItem<string>),
    new FormItem<boolean>({
      name: 'fontWeight',
      label: '加粗',
      desc: '加粗',
      value: false,
      required: false,
      controlType: ControlType.checkbox,
    } as IFormItem<boolean>),
  ];

  private _dataSourceSchema: DataSourceSchema;

  public stateSchemaCollection: StateSchemaCollection;

  set dataSourceSchema(val: DataSourceSchema) {
    this._dataSourceSchema = val;
  }

  get dataSourceSchema(): DataSourceSchema {
    return this._dataSourceSchema;
  }

  convertDataSourceSchemaToCascadeOptions(): any[] {
    if (!this.dataSourceSchema) {
      return null;
    }
    const result: { value: any; label: string; type: string; isLeaf?: boolean; children?: any[] }[] = [
      {
        label: this.dataSourceSchema.name,
        value: this.dataSourceSchema.name,
        type: this.dataSourceSchema.type,
      },
    ];
    const initialNode: any = {
      value: undefined,
      label: undefined,
      type: undefined,
    };
    let queue = [this.dataSourceSchema];
    let dataSourceQueue = [...result];
    while (queue.length) {
      const node = queue[0];
      const dataSourceNode = dataSourceQueue[0];
      dataSourceNode.type = node.type;
      dataSourceNode.label = node.name;
      dataSourceNode.value = node.name;
      if (node.type === 'object' || node.type === 'array') {
        dataSourceNode.children = node.fields.map(() => ({
          ...initialNode,
        }));
        queue = queue.concat(node.fields);
        dataSourceQueue = dataSourceQueue.concat(dataSourceNode.children);
      } else {
        dataSourceNode.isLeaf = true;
      }
      queue.shift();
      dataSourceQueue.shift();
    }
    return result;
  }

  /*
   * 根据状态上下文 schema 生成状态上下文选项
   */
  convertStateCtxToCascadeOptions(): any[] {
    if (!this.stateSchemaCollection) {
      return [];
    }
    const initialNode: any = {
      value: undefined,
      label: undefined,
      type: undefined,
    };
    const result: { value: any; label: string; type: string; isLeaf?: boolean; children?: any[] }[] =
      Object.values(this.stateSchemaCollection).map(() => ({
        ...initialNode,
      }));
    let queue: any[] = Object.values(this.stateSchemaCollection).map(item => item.calculation.output);
    let stateQueue = [...result];
    while (queue.length) {
      const currentOutput = queue[0];
      const stateNode = stateQueue[0];
      const currentOutputType = currentOutput.type;
      stateNode.type = currentOutputType;
      stateNode.label = currentOutput.name;
      stateNode.value = currentOutput.name;
      if (currentOutputType === 'object' || currentOutputType === 'array') {
        stateNode.children = Object.keys(currentOutput.fields).map(() => ({
          ...initialNode,
        }));
        queue = queue.concat(currentOutput.fields);
        stateQueue = stateQueue.concat(stateNode.children);
      } else {
        stateNode.isLeaf = true;
      }
      queue.shift();
      stateQueue.shift();
    }
     return result;
  }

  generateBasicSchemaPartial(formData: DynamicObject, widgetType: InsertType | string): BasicSchemaPartial {
    return {
      // widget 的 id （32位 uuid）
      id: uuid(),
      // widget 的类型
      type: widgetType,
      // widget 的 语义名字，例如标题，文案
      name: formData.name,
      // 表单项描述
      desc: formData.desc,
    };
  }

  generateStateOperatorOptions() {
    return [
      {
        value: StateOperator.interpolate,
        name: '直出（插值）',
      },
      {
        value: StateOperator.map,
        name: '映射',
      },
      {
        value: StateOperator.filter,
        name: '过滤',
      },
      {
        value: StateOperator.reduce,
        name: '归并',
      },
    ];
  }

  convertFormDataToSchema(formData: DynamicObject, widgetType: string): any {
    const basicSchemaPartial: BasicSchemaPartial = this.generateBasicSchemaPartial(formData, widgetType);
    switch (widgetType) {
      case InsertType.container:
        return this.generateContainerSchema(formData, widgetType, basicSchemaPartial);
      case InsertType.text:
        return {
          ...basicSchemaPartial,
          dataMapping: {
            text: {
              data: formData.text,
              // TODO 先这么写凑合用
              state: formData.textState
                ? {
                  ref: this.calculateDataSourceRef(formData.textState),
                  operator: DataMappingOperator.interpolate,
                  output: ValueType.string,
                }
                : undefined,
              operation: formData.textDataSource
                ? {
                    ref: this.calculateDataSourceRef(formData.textDataSource),
                    operator: DataMappingOperator.interpolate,
                    output: ValueType.string,
                  }
                : undefined,
            },
          } as DataMappingSchema,
          styles: {
            'font-size': {
              name: 'font-size',
              value: formData.fontSize,
              unit: StyleValueUnit.px,
            } as StyleSchema<number>,
            'font-family': {
              name: 'font-family',
              value: formData.fontFamily,
              unit: StyleValueUnit.none,
            } as StyleSchema<number>,
            'line-height': {
              name: 'line-height',
              value: formData.lineHeight,
              unit: StyleValueUnit.px,
            } as StyleSchema<number>,
            'font-weight': {
              name: 'font-weight',
              value: formData.fontWeight ? 600 : 400,
              unit: StyleValueUnit.none,
            } as StyleSchema<number>,
            color: {
              name: 'color',
              value: formData.color,
              unit: StyleValueUnit.none,
            } as StyleSchema<string>,
          } as StyleCollectionSchema,
        };
      case InsertType.link:
        return {
          ...basicSchemaPartial,
          dataMapping: {
            title: {
              data: formData.title,
              operation: formData.titleDataSource
                ? {
                    ref: this.calculateDataSourceRef(formData.titleDataSource),
                    operator: DataMappingOperator.interpolate,
                    output: ValueType.string,
                  }
                : null,
            },
            target: {
              data: formData.target,
            },
            url: {
              data: formData.url,
              operation: formData.urlDataSource
                ? {
                    ref: this.calculateDataSourceRef(formData.urlDataSource),
                    operator: DataMappingOperator.interpolate,
                    output: ValueType.string,
                  }
                : undefined,
            },
          } as DataMappingSchema,
          styles: {
            'font-size': {
              name: 'font-size',
              value: formData.fontSize,
              unit: StyleValueUnit.px,
            } as StyleSchema<number>,
            'font-family': {
              name: 'font-family',
              value: formData.fontFamily,
              unit: StyleValueUnit.none,
            } as StyleSchema<number>,
            'line-height': {
              name: 'line-height',
              value: formData.lineHeight,
              unit: StyleValueUnit.px,
            } as StyleSchema<number>,
            'font-weight': {
              name: 'font-weight',
              value: formData.fontWeight ? 600 : 400,
              unit: StyleValueUnit.none,
            } as StyleSchema<number>,
          },
        };
      case InsertType.image:
        return {
          ...basicSchemaPartial,
          dataMapping: {
            src: {
              data: formData.src,
              operation: formData.srcDataSource
                ? {
                    ref: this.calculateDataSourceRef(formData.srcDataSource),
                    operator: DataMappingOperator.interpolate,
                    output: ValueType.string,
                  }
                : undefined,
            },
          } as DataMappingSchema,
          styles: {
            'object-fit': {
              name: 'object-fit',
              value: formData.objectFit,
              unit: StyleValueUnit.none,
            },
            width: {
              name: 'width',
              value: formData.width,
              unit: StyleValueUnit.px,
            },
            height: {
              name: 'height',
              value: formData.height,
              unit: StyleValueUnit.px,
            },
          },
        };
      case InsertType.list:
        const containerSchema = this.generateContainerSchema(formData, widgetType, basicSchemaPartial);
        const dataMappingSchema: DataMappingSchema = {
          list: {
            operation: {
              ref: this.calculateDataSourceRef(formData.listDataSource),
              operator: StateOperator.map,
            },
          },
        };
        return {
          ...containerSchema,
          dataMappingSchema,
        };
      case 'state':
        return this.exportStateSchema(formData);
      case 'event':
        return this.exportEventSchema(formData);
      default:
        // TODO 其他类型待实现
        return;
    }
  }

  convertSchemaToStyles(schema: WidgetFamilySchema): DynamicObject {
    if (!schema || !schema.styles) {
      return {};
    }
    const result = {};
    Object.entries(schema.styles).forEach(([key, val]) => {
      const { unit, value } = val as StyleSchema<number | string>;
      result[key] = `${value}${unit}`;
    });
    return result;
  }

  convertSchemaToStyleStr(schema: WidgetFamilySchema): string {
    const styles = this.convertSchemaToStyles(schema);

    return Object.entries(styles)
      .map(([key, val]) => `${key}: ${val};`)
      .join(' ');
  }

  /*
   * 把数据源的字段拼接为一个可以消费的引用
   */
  calculateDataSourceRef(refArr: (string | number)[]): string {
    const result = refArr.join('.');
    return result.replace(/\.(\d+)/, '[$1]');
  }

  generateContainerSchema(
    formData: DynamicObject,
    widgetType: InsertType | string,
    basicSchemaPartial: BasicSchemaPartial
  ): ContainerSchema {
    const result: ContainerSchema = {
      ...basicSchemaPartial,
      // 子节点
      children: [],
      styles: {
        display: {
          name: 'display',
          value: 'block',
          unit: StyleValueUnit.none,
        },
        overflow: {
          name: 'overflow',
          value: 'auto',
          unit: '',
        },
        position: {
          name: 'position',
          // 定位，目前只允许相对于父元素进行定位
          value: formData.positioning,
          unit: StyleValueUnit.none,
        },
        'z-index': {
          name: 'z-index',
          value: formData.zIndex,
          unit: StyleValueUnit.none,
        },
        margin: {
          name: 'margin',
          value: formData.margin,
          unit: StyleValueUnit.px,
        },
        padding: {
          name: 'padding',
          value: formData.padding,
          unit: StyleValueUnit.px,
        },
        width: {
          name: 'width',
          value: formData.width || 'initial',
          unit: formData.width ? StyleValueUnit.px : StyleValueUnit.none,
        },
        'max-width': {
          name: 'max-width',
          value: formData.maxWidth || 'initial',
          unit: formData.maxWidth ? StyleValueUnit.px : StyleValueUnit.none,
        },
        'min-width': {
          name: 'min-width',
          value: formData.minWidth || 'initial',
          unit: formData.minWidth ? StyleValueUnit.px : StyleValueUnit.none,
        },
        height: {
          name: 'height',
          value: formData.height || 'initial',
          unit: formData.height ? StyleValueUnit.px : StyleValueUnit.none,
        },
        'max-height': {
          name: 'max-height',
          value: formData.maxHeight || 'initial',
          unit: formData.maxHeight ? StyleValueUnit.px : StyleValueUnit.none,
        },
        'min-height': {
          name: 'min-height',
          value: formData.minHeight || 'initial',
          unit: formData.minHeight ? StyleValueUnit.px : StyleValueUnit.none,
        },
        'border-width': {
          name: 'border-width',
          value: formData.borderWidth,
          unit: StyleValueUnit.px,
        },
        'border-style': {
          name: 'border-style',
          value: formData.borderStyle,
          unit: StyleValueUnit.none,
        },
        'border-color': {
          name: 'border-color',
          value: formData.borderColor,
          unit: StyleValueUnit.none,
        },
        'border-radius': {
          name: 'border-radius',
          value: formData.borderRadius,
          unit: StyleValueUnit.px,
        },
        'background-color': {
          name: 'background-color',
          value: formData.backgroundColor,
          unit: StyleValueUnit.none,
        },
      },
    };
    // 处理定位的问题，如果定位是 static, top、right、bottom、left 会被忽略
    if (result.styles.position.value !== 'static') {
      const offsetArr = ['top', 'right', 'bottom', 'left'];
      offsetArr.forEach((name) => {
        const offset = formData[name];
        if (offset !== '' && !isNaN(offset)) {
          result.styles[name] = {
            name,
            value: offset,
            unit: StyleValueUnit.px,
          };
        }
      });
    }

    // 移除 position: static 的 z-index
    if (result.styles.position.value === 'static') {
      delete result.styles['z-index'];
    }

    // 处理 flex 和 对齐的问题
    let styleName;
    if (formData.layout === Layout.column) {
      // 不是 左对齐 和 顶部对齐，就需要 flex 了
      if (formData.horizontalAlignment !== Alignment.left || formData.verticalAlignment !== Alignment.top) {
        result.styles.display = {
          name: 'display',
          value: 'flex',
          unit: StyleValueUnit.none,
        };
        result.styles['flex-direction'] = {
          name: 'flex-direction',
          value: 'column',
        };
      }
      if (formData.verticalAlignment !== Alignment.top) {
        styleName = 'justify-content';
        result.styles[styleName] = this.generateAlignmentStyleSchema(styleName, 'vertical', formData);
      }
      if (formData.horizontalAlignment !== Alignment.left) {
        styleName = 'align-items';
        result.styles[styleName] = this.generateAlignmentStyleSchema(styleName, 'horizontal', formData);
      }
    } else if (formData.layout === Layout.row) {
      result.styles.display = {
        name: 'display',
        value: 'flex',
        unit: StyleValueUnit.none,
      };
      result.styles['flex-direction'] = {
        name: 'flex-direction',
        value: 'row',
      };
      if (formData.verticalAlignment !== Alignment.top) {
        styleName = 'align-items';
        result.styles[styleName] = this.generateAlignmentStyleSchema(styleName, 'vertical', formData);
      }
      if (formData.horizontalAlignment !== Alignment.left) {
        styleName = 'justify-content';
        result.styles[styleName] = this.generateAlignmentStyleSchema(styleName, 'horizontal', formData);
      }
    }
    return result;
  }

  getLayoutFormItems() {
    return [
      new FormItem({
        name: 'layout',
        label: '布局',
        value: Layout.column,
        desc: '布局',
        controlType: ControlType.select,
        required: false,
        selectOptions: [
          {
            name: '列布局',
            value: Layout.column,
          },
          {
            name: '行布局',
            value: Layout.row,
          },
        ],
      } as IFormItem<string>),
    ];
  }

  getLinkFormItems() {
    const cascadeOptions = this.convertDataSourceSchemaToCascadeOptions();
    const tmp = [
      new FormItem<string>({
        name: 'title',
        label: '标题',
        desc: '标题',
        value: '',
        controlType: ControlType.text,
        required: true,
      } as IFormItem<string>),
      cascadeOptions?.length
        ? new FormItem<string>({
            name: 'titleDataSource',
            label: '标题数据源',
            desc: '标题数据源',
            value: '',
            valueType: ValueType.string,
            controlType: ControlType.cascade,
            selectOptions: cascadeOptions,
            required: true,
          } as IFormItem<string>)
        : null,
      new FormItem<string>({
        name: 'url',
        label: '链接',
        desc: '链接',
        value: '',
        controlType: ControlType.text,
        required: true,
      } as IFormItem<string>),
      cascadeOptions
        ? new FormItem<string>({
            name: 'urlDataSource',
            label: '链接数据源',
            desc: '链接数据源',
            value: '',
            valueType: ValueType.string,
            controlType: ControlType.cascade,
            selectOptions: cascadeOptions,
            required: true,
          } as IFormItem<string>)
        : null,
      new FormItem<string>({
        name: 'target',
        label: '打开位置',
        desc: '打开位置',
        value: LinkTarget.blank,
        controlType: ControlType.radio,
        required: true,
        selectOptions: [
          {
            name: '原页面',
            value: LinkTarget.self,
          },
          {
            name: '新页面',
            value: LinkTarget.blank,
          },
        ],
      } as IFormItem<string>),
      ...BasicFormService.fontFormItems,
    ];
    return tmp.filter((item) => !!item);
  }

  getBorderFormItems() {
    return [
      new StyleFormItem({
        name: 'borderWidth',
        label: '边框粗细',
        desc: '边框',
        ...BasicFormService.sizeOptionPartial,
      } as IStyleFormItem<number>),
      new StyleFormItem({
        name: 'borderStyle',
        label: '边框样式',
        desc: '边框样式',
        value: BorderStyle.solid,
        valueType: ValueType.number,
        required: false,
        controlType: ControlType.select,
        selectOptions: [
          {
            name: '实线',
            value: BorderStyle.solid,
          },
          {
            name: '虚线',
            value: BorderStyle.dashed,
          },
          {
            name: '点线',
            value: BorderStyle.dotted,
          },
          {
            name: '无边框',
            value: BorderStyle.none,
          },
        ],
      } as IStyleFormItem<BorderStyle>),
      new StyleFormItem({
        name: 'borderColor',
        label: '边框颜色',
        desc: '边框颜色',
        value: '#fff',
        valueType: ValueType.number,
        required: false,
        controlType: ControlType.text,
      } as IStyleFormItem<string>),
      new StyleFormItem({
        name: 'borderRadius',
        label: '边框圆角半径',
        desc: '边框圆角半径',
        ...BasicFormService.sizeOptionPartial,
        controlType: ControlType.number,
        value: 4,
      } as IStyleFormItem<number>),
    ];
  }

  getMarginFormItems() {
    return [
      new StyleFormItem({
        name: 'margin',
        label: '外边距',
        desc: '请输入外边距',
        ...BasicFormService.sizeOptionPartial,
        controlType: ControlType.number,
        value: 20,
      } as IStyleFormItem<number>),
    ];
  }

  getPaddingFormItems() {
    return [
      new StyleFormItem({
        name: 'padding',
        label: '内衬',
        desc: '请输入内衬',
        ...BasicFormService.sizeOptionPartial,
        controlType: ControlType.number,
        value: 20,
      } as IStyleFormItem<number>),
    ];
  }

  getWidthFormItems() {
    return [
      new StyleFormItem({
        name: 'width',
        label: '宽度',
        desc: '宽度',
        ...BasicFormService.sizeOptionPartial,
        value: 0,
      } as IStyleFormItem<number>),
      new StyleFormItem({
        name: 'maxWidth',
        label: '最大宽度',
        desc: '最大宽度（0表示不作限制）',
        ...BasicFormService.sizeOptionPartial,
      } as IStyleFormItem<number>),
      new StyleFormItem({
        name: 'minWidth',
        label: '最小宽度',
        desc: '最小宽度（0表示不作限制）',
        ...BasicFormService.sizeOptionPartial,
        value: 200,
      } as IStyleFormItem<number>),
    ];
  }

  getHeightFormItems() {
    return [
      new StyleFormItem({
        name: 'height',
        label: '高度',
        desc: '高度',
        ...BasicFormService.sizeOptionPartial,
        value: 0,
      } as IStyleFormItem<number>),
      new StyleFormItem({
        name: 'maxHeight',
        label: '最大高度',
        desc: '最大高度（0表示不作限制）',
        ...BasicFormService.sizeOptionPartial,
      } as IStyleFormItem<number>),
      new StyleFormItem({
        name: 'minHeight',
        label: '最小高度',
        desc: '最小高度（0表示不作限制）',
        ...BasicFormService.sizeOptionPartial,
        value: 200,
      } as IStyleFormItem<number>),
    ];
  }

  getTextFormItems() {
    const cascadeOptions = this.convertDataSourceSchemaToCascadeOptions();
    const stateCtxCascadeOptions = this.convertStateCtxToCascadeOptions();
    const tmp = [
      new FormItem<string>({
        name: 'text',
        label: '内容',
        desc: '内容',
        value: '',
        required: true,
        controlType: ControlType.text,
      } as IFormItem<string>),
      cascadeOptions?.length
        ? new FormItem<string>({
            name: 'textDataSource',
            label: '内容数据源',
            desc: '内容数据源',
            value: '',
            valueType: ValueType.string,
            controlType: ControlType.cascade,
            selectOptions: cascadeOptions,
            required: true,
          } as IFormItem<string>)
        : null,
      stateCtxCascadeOptions?.length
        ? new FormItem<string>({
            name: 'textState',
            label: '状态上下文',
            desc: '状态上下文，用于触发事件或者响应事件',
            value: '',
            valueType: ValueType.string,
            controlType: ControlType.cascade,
            selectOptions: stateCtxCascadeOptions,
            required: true,
        } as IFormItem<string>)
        : null,
      ...BasicFormService.fontFormItems,
    ];
    return tmp.filter((item) => !!item);
  }

  getPositioningFormItems() {
    return [
      new FormItem({
        name: 'positioning',
        label: '定位',
        desc: '定位',
        value: Positioning.static,
        controlType: ControlType.select,
        required: false,
        selectOptions: [
          {
            name: '默认',
            value: Positioning.static,
          },
          {
            name: '相对定位',
            value: Positioning.relative,
          },
          {
            name: '绝对定位',
            value: Positioning.absolute,
          },
          {
            name: '固定定位',
            value: Positioning.fixed,
          },
          {
            name: '粘性定位',
            value: Positioning.sticky,
          },
        ],
      } as IFormItem<Positioning>),
      new StyleFormItem({
        name: 'top',
        label: '顶部偏移',
        desc: '顶部偏移',
        value: '',
        controlType: ControlType.text,
        required: false,
      } as IStyleFormItem<string>),
      new StyleFormItem({
        name: 'bottom',
        label: '底部偏移',
        desc: '底部偏移',
        value: '',
        controlType: ControlType.text,
        required: false,
      } as IStyleFormItem<string>),
      new StyleFormItem({
        name: 'left',
        label: '左侧偏移',
        desc: '左侧偏移',
        value: '',
        controlType: ControlType.text,
        required: false,
      } as IStyleFormItem<string>),
      new StyleFormItem({
        name: 'right',
        label: '右侧偏移',
        desc: '右侧偏移',
        value: '',
        controlType: ControlType.text,
        required: false,
      } as IStyleFormItem<string>),
      new StyleFormItem({
        name: 'zIndex',
        label: '层级',
        desc: '层级',
        value: 1,
        controlType: ControlType.number,
        required: false,
      } as IStyleFormItem<number>),
    ];
  }

  getAlignmentFormItems() {
    return [
      new StyleFormItem({
        name: 'horizontalAlignment',
        label: '水平方向',
        desc: '水平方向',
        value: Alignment.left,
        controlType: ControlType.select,
        required: false,
        selectOptions: [
          {
            name: '左对齐',
            value: Alignment.left,
          },
          {
            name: '居中',
            value: Alignment.center,
          },
          {
            name: '右对齐',
            value: Alignment.right,
          },
        ],
      } as IStyleFormItem<string>),
      new StyleFormItem({
        name: 'verticalAlignment',
        label: '垂直方向',
        desc: '垂直方向',
        value: Alignment.top,
        controlType: ControlType.select,
        required: false,
        selectOptions: [
          {
            name: '顶部对齐',
            value: Alignment.top,
          },
          {
            name: '居中',
            value: Alignment.center,
          },
          {
            name: '底部对齐',
            value: Alignment.bottom,
          },
        ],
      } as IStyleFormItem<string>),
    ];
  }

  getBackgroundFormItems() {
    return [
      new StyleFormItem({
        name: 'backgroundColor',
        label: '背景颜色',
        desc: '背景颜色',
        value: '#fff',
        controlType: ControlType.text,
      } as IStyleFormItem<string>),
    ];
  }

  generateAlignmentStyleSchema(styleName: string, direction: string, formData: DynamicObject) {
    const alignmentMap = {
      [Alignment.top]: 'flex-start',
      [Alignment.center]: 'center',
      [Alignment.bottom]: 'flex-end',
      [Alignment.left]: 'flex-start',
      [Alignment.right]: 'flex-end',
    };
    return {
      name: styleName,
      value: alignmentMap[formData[`${direction}Alignment`]],
      unit: StyleValueUnit.none,
    };
  }

  getImageFormItems() {
    const cascadeOptions = this.convertDataSourceSchemaToCascadeOptions();
    const result = [
      new StyleFormItem({
        name: 'src',
        label: '图片地址',
        desc: '图片地址',
        value: '',
        controlType: ControlType.text,
      } as IStyleFormItem<string>),
      cascadeOptions?.length
        ? new FormItem<string>({
            name: 'srcDataSource',
            label: '数据源',
            desc: '图片地址数据源',
            value: '',
            valueType: ValueType.string,
            controlType: ControlType.cascade,
            selectOptions: cascadeOptions,
            required: true,
          } as IFormItem<string>)
        : null,
      new StyleFormItem({
        name: 'width',
        label: '宽度',
        desc: '宽度',
        ...BasicFormService.sizeOptionPartial,
      } as IStyleFormItem<number>),
      new StyleFormItem({
        name: 'height',
        label: '高度',
        desc: '高度',
        ...BasicFormService.sizeOptionPartial,
      } as IStyleFormItem<number>),
      new StyleFormItem({
        name: 'objectFit',
        label: '填充方式',
        desc: '填充方式',
        value: 'cover',
        controlType: ControlType.select,
        selectOptions: [
          {
            name: '填充',
            value: 'cover',
          },
          {
            name: '适应',
            value: 'contain',
          },
        ],
      } as IStyleFormItem<string>),
    ];
    return result.filter((item) => !!item);
  }

  getBasicFormItems() {
    return [
      new FormItem({
        name: 'name',
        label: '名称',
        desc: '名称',
        value: '',
        required: true,
        controlType: ControlType.text,
      }),
      new FormItem({
        name: 'desc',
        label: '描述',
        desc: '描述',
        value: '',
        required: true,
        controlType: ControlType.text,
      }),
    ];
  }

  /*
   * 获取数据源表单
   */
  getDataSourceForm() {
    return [
      new FormItem({
        name: 'dataSource',
        label: '数据源',
        desc: '输入一个返回对象的函数',
        value: `
/*
 * 输入一个函数，返回一个对象，这个对象是这个组件能够接收的数据源
 * Seibertron 会根据范例，自动推断数据源的数据类型和结构并生成相应的schema
 * 输入完成后，就可以在任意显示内容的元素上选择数据源中的数据了
 *
 * 例如：
 * {
 *   a: 1,···················数字
 *   b: 'abc',···············字符串
 *   c: {····················对象
 *     d: 'cde'
 *   },
 *   d: [
 *     {···················数组
 *       id: '123',············字符串
 *       name: '擎天柱'·········字符串
 *     }
 *   ]
 * }
 */
function example() {
  return {
    text: '天天得物',
    link: {
      title: '好好学习',
      url: 'www.baidu.com'
    },
    imgUrl: 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1587829563693&di=0c7fbabcd9afd0b3f0a3cc9c3137e876&imgtype=0&src=http%3A%2F%2Fpic.2265.com%2Fupload%2F2020-1%2F20201171257314020.png',
    contentList: [
      {
        imgSrc: 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1587920062357&di=ec5aa1c6bffd77289f76ea0102a3d827&imgtype=0&src=http%3A%2F%2F5b0988e595225.cdn.sohucs.com%2Fq_70%2Cc_lfill%2Cw_300%2Ch_200%2Cg_faces%2Fimages%2F20200325%2F2cd25535e4f84cf2a381210fc608adb5.jpg',
        title: '测试列表项1',
        content: '测试内容1'
      },
      {
        imgSrc: 'https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=3759819847,2854453954&fm=11&gp=0.jpg',
        title: '测试列表项2',
        content: '测试内容2'
      },
      {
        imgSrc: 'https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=1537366945,3311852206&fm=11&gp=0.jpg',
        title: '测试列表项3',
        content: '测试内容3'
      }
    ],
    tableData: {
      columns: [
        {
          title: '姓名',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: '年龄',
          dataIndex: 'age',
          key: 'age',
        },
        {
          title: '住址',
          dataIndex: 'address',
          key: 'address',
        },
      ],
      dataSource: [
        {
          key: '1',
          name: '胡彦斌',
          age: 32,
          address: '西湖区湖底公园1号',
        },
        {
          key: '2',
          name: '胡彦祖',
          age: 42,
          address: '西湖区湖底公园1号',
        },
      ]
    },
    provinceList: [
      {
        name: '北京',
        value: '0',
      },
      {
        name: '上海',
        value: '1',
      },
      {
        name: '广州',
        value: '2',
      },
      {
        name: '深圳',
        value: '3',
      }
    ]
  };
}`,
        required: true,
        options: { theme: 'vs', language: 'typescript', automaticLayout: true },
        controlType: ControlType.Code,
      }),
    ];
  }

  /*
   * 获取事件设置里边的状态计算表单
   */
  getStateCalculationEffectFormItems(defaultValues: DynamicObject = {}): FormItem[] {
    return [
      new FormItem({
        name: 'stateName',
        label: '状态名称',
        desc: '输入事先已经插入的状态',
        value: defaultValues.name || '',
        controlType: ControlType.text,
        required: false,
      })
    ];
  }

  /*
   * 获取状态计算表单项
   */
  getStateFormItems(defaultValues: DynamicObject = {}): FormItem[] {
    const cascadeOptions = this.convertDataSourceSchemaToCascadeOptions();
    const result = [
      new FormItem({
        name: 'name',
        label: '状态名称',
        desc: '目前仅支持英文和下划线开头的英文、数字和下划线组合字符串',
        value: defaultValues.name || '',
        controlType: ControlType.text,
        required: true,
      } as IFormItem<string>),
      new FormItem({
        name: 'dataSource',
        label: '数据源',
        desc: '用于计算状态的数据源',
        value: defaultValues.dataSource || '',
        valueType: ValueType.any,
        controlType: ControlType.cascade,
        selectOptions: cascadeOptions,
        required: true,
      } as IFormItem<string>),
      new FormItem({
        name: 'stateOperator',
        label: '运算符',
        desc: '选择一个运算符，就可以算出这个状态值了',
        value: defaultValues.stateOperator || StateOperator.interpolate,
        valueType: ValueType.enum,
        controlType: ControlType.select,
        selectOptions: this.generateStateOperatorOptions(),
      } as IFormItem<string>),
    ];
    if (defaultValues.stateOperator === StateOperator.filter) {
      result.push(
        new FormItem<string>({
          name: 'filterField',
          label: '字段名',
          desc: '过滤时使用的字段名',
          value: defaultValues.value || '',
          valueType: ValueType.string,
          controlType: ControlType.text,
          required: true,
        }),
      );
    }
    return result;
  }

  /*
   * 事件触发设置 form items
   */
  getTriggeringFormItems(widgetTree: WidgetTreeNode[] = []) {
    return [
      ...this.getBasicFormItems(),
      new FormItem({
        name: 'eventType',
        desc: '选择一种事件类型',
        label: '事件类型',
        selectOptions: [
          {
            value: EventType.click,
            name: '点击',
          },
          {
            value: EventType.mouseenter,
            name: '鼠标移入',
          },
          {
            value: EventType.mouseleave,
            name: '鼠标移出',
          },
          {
            value: EventType.interval,
            name: '周期',
          },
          {
            value: EventType.exposure,
            name: '曝光',
          },
          {
            value: EventType.refreshData,
            name: '刷新数据',
          },],
        value: EventType.click,
        valueType: ValueType.string,
        controlType: ControlType.select,
      } as IFormItem<EventType>),
      new FormItem({
        name: 'sourceWidget',
        label: '触发元素',
        desc: '选择一个元素',
        value: '',
        controlType: ControlType.tree,
        valueType: ValueType.string,
        tree: widgetTree,
      } as IFormItem<string>),
      new FormItem({
        name: 'targetWidget',
        label: '联动元素',
        desc: '选择一个元素',
        value: '',
        controlType: ControlType.tree,
        valueType: ValueType.string,
        tree: widgetTree,
      } as IFormItem<string>),
    ];
  }

  /*
   * 获取数据源表单项
   */
  getListDataSourceFormItems() {
    const cascadeOptions = this.convertDataSourceSchemaToCascadeOptions();
    return [
      new FormItem({
        name: 'listDataSource',
        label: '列表数据源',
        desc: '整个列表的数据源',
        value: '',
        valueType: ValueType.array,
        controlType: ControlType.cascade,
        required: true,
        selectOptions: cascadeOptions,
      } as IFormItem<string>),
    ];
  }

  /*
   * 将引用字符串转为 dataSourceSchema
   */
  exportDataSourceSchema(funcStr: string) {
    // TODO 这里后期需要做安全处理，目前先不管，后期可以找 sandbox 库解决
    const dataSource = new Function(`return (${funcStr})()`)();
    const initialDataSchema = {
      name: undefined,
      type: undefined,
      // 样例数据
      example: undefined,
    };
    const result: DataSourceSchema = {
      ...initialDataSchema,
    };
    let originalQueue = [
      {
        key: 'data',
        val: dataSource,
      },
    ];
    let dataSourceQueue: DataSourceSchema[] = [result];
    while (originalQueue.length) {
      // 读取队头的节点
      const node = originalQueue[0];
      const dataSourceNode = dataSourceQueue[0];
      const type = getTypeOf(node.val);
      dataSourceNode.name = node.key;
      dataSourceNode.type = type;
      dataSourceNode.example = node.val;
      switch (type) {
        case ValueType.array:
          if (node.val.length) {
            dataSourceNode.fields = [{ ...initialDataSchema }];
            originalQueue = originalQueue.concat([
              {
                key: '0',
                val: node.val[0],
              },
            ]);
            dataSourceQueue = dataSourceQueue.concat(dataSourceNode.fields);
          }
          break;
        case ValueType.object:
          const entries = Object.entries(node.val);
          if (entries.length) {
            dataSourceNode.fields = entries.map(() => ({
              ...initialDataSchema,
            }));
            originalQueue = originalQueue.concat(
              entries.map(([key, val]) => ({
                key,
                val,
              }))
            );
            dataSourceQueue = dataSourceQueue.concat(dataSourceNode.fields);
          }
          break;
        case ValueType.number:
        case ValueType.string:
        case ValueType.boolean:
          break;
        default:
          throw new Error(`不支持的类型: ${type}`);
      }
      originalQueue.shift();
      dataSourceQueue.shift();
    }
    return result;
  }

  exportEventSchema(formData: DynamicObject): EventSchema {
    const result = {
      name: formData.name,
      // 事件的类型
      eventType: formData.eventType,
      // 触发事件的 widget 或者组件的 id （32位 uuid）
      sourceWidget: {
        // widget的 uuid
        id: formData.sourceWidget,
        // 事件的触发类型，孤立元素，列表项，行，列，这个暂时没有实现
        type: TriggerType.isolated,
      },
      targetWidget: {
        // 接收事件的 widget 或者组件的 id （32位 uuid）
        id: formData.targetWidget,
        // 联动类型，这里只影响一个元素，目前还没有实现
        type: LinkageType.isolated,
      },
      effect: {
        states: []
      }
    };
    if (formData.stateName) {
      result.effect.states.push(formData.stateName);
    }
    return result;
  }

  /*
   * 从表单数据导出 state schema
   */
  exportStateSchema(formData: DynamicObject): StateSchema {
    const { fields: dataSourceFields } = this.dataSourceSchema;
    let currentFields = _.cloneDeep(dataSourceFields);
    for ( let i = 0, l = formData.dataSource.length; i < l; i++) {
      const selectedField = currentFields.find(field => field.name === formData.dataSource[i])
      if (i === l - 1) {
        if (selectedField) {
          currentFields = [selectedField];
        }
      } else {
        if (selectedField && selectedField.fields) {
          currentFields = selectedField.fields;
        }
      }
    }
    let output: DataSourceSchema;
    // 如果是过滤器，则要求选中的字段是数组
    switch (formData.stateOperator) {
      case StateOperator.filter:
        if (currentFields[0].type !== 'array') {
          throw new Error('非数组类型的数据不可以使用过滤运算符');
        } else {
          // 为了从 schema 上和数据源统一，直接把这个元素的 schema 赋值过去
          output = currentFields[0].fields[0];
          output.name = formData.name;
        }
        break;
      default:
        // TODO 其他类型待实现
        break;
    }

    return {
      name: formData.name,
      calculation: {
        operator: formData.stateOperator,
        input: [formData.dataSource.join('.'), formData.filterField],
        output
      },
    };
  }
}
