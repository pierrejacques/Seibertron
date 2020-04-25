import DataMappingOperator from '@/enum/schema/uimapping-operator.enum';
import { DataMappingOperation } from '@/interfaces/schema/data-mapping.schema';
import DataSourceSchema from '@/interfaces/schema/data-source.schema';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DataMappingService {
  constructor() {}

  output(dataMappingItemSchema: DataMappingOperation, dataSourceSchema: DataSourceSchema): any {
    if (!dataMappingItemSchema || !dataSourceSchema) {
      return undefined;
    }
    const { ref, operator } = dataMappingItemSchema;
    const { example } = dataSourceSchema;
    const outputFunc = new Function('data', `return ${ref}`);
    const refVariable = outputFunc(example);
    switch (operator) {
      case DataMappingOperator.interpolate:
        return refVariable;
      default:
        throw new Error('暂时不支持其他类型的映射操作');
    }
  }
}
