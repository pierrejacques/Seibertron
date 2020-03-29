import BaseFormItem from '@/models/form/base-form-item';
import Positioning from '@/enum/positioning';
import { IFormItemOptions } from '@/interfaces/form-item';

export default class Position extends BaseFormItem<Positioning> {
  constructor(options: IFormItemOptions<Positioning>) {
    super(options);
  }

  controlType: string = 'select';
}
