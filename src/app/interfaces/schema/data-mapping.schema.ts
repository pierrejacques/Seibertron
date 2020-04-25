/*
 * 描述如何将数据映射到UI上，指导渲染UI内容
 */
import DataMappingOperator from '@/enum/schema/uimapping-operator.enum';
import ValueType from '@/enum/value-type';
import DynamicObject from '@/interfaces/dynamic-object';

export interface DataMappingOperation {
  // 从父节点传入的数据的引用（可能是一个字段、或者一个索引） 例如：'state.data.list'
  ref?: string;
  operator?: DataMappingOperator;
  // 操作输出的类型
  output?: ValueType;
}

export interface DataMappingItemSchema {
  // 暂时先不用了
  // type: DataSourceType;
  // 如果没有映射操作，就直接用这个了
  data: DynamicObject | string;
  operation?: DataMappingOperation;
}

export interface DataMappingSchema {
  [key: string]: DataMappingItemSchema;
  [index: number]: DataMappingItemSchema;
}
