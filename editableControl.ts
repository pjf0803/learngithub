/**
 * @fileoverview 控制 “基本信息”  “配置选项” 模块的属性是否可以编辑
 */

import { hasNameFieldObjectPropertys } from '@/pages/ObjectManager/utils'

enum FieldLevelEnum {
  HiddenField,
  SystemField,
  CustomField,
}

interface IProps {
  type: 'create' | 'view' | 'edit',
  fieldName: string,
  fieldType: string,
  fieldLevel: FieldLevelEnum,
  objectProperty: string,
  isShared?: boolean,
  isTenant?: boolean
}

export default ({
  type,
  fieldName,
  fieldType,
  fieldLevel,
  objectProperty,
  isShared,
  isTenant = false
}: IProps) => (propName: string): boolean => {
  // 共享对象不可编辑字段
  if (isShared || isTenant) {
    return false
  }
  if (type === 'create') {
    // 新建页，字段类型不可切换
    if (propName === 'type') return false
    return true
  }
  // 查看页面和隐藏字段所有配置项都不可编辑
  if (
    type === 'view' ||
    fieldLevel === FieldLevelEnum.HiddenField
  ) {
    return false
  }

  /**
   * 如果编辑的字段的 name 属性的值为 ”name“，则将该字段的编辑行为与自建字段一致，但是不允许删除，不允许出现掩码
   * @todo 这东西是个坑，需要特殊处理多个地方，默认值的赋值，默认值的提交
   * 请务必不要更改 name 字段的字段类型为 ”自建字段“ ！！！
   */
  const isNameField =
    type === 'edit' &&
    fieldName === 'name' &&
    hasNameFieldObjectPropertys.includes(objectProperty)

  /**
   * name 字段和自建字段可编辑的配置项
   */
  const propNames = [
    'type', 'name', 'helpText', 'description', 'displayLabel', 'editable', 'updateable', 'readOnly',
    'isNotNull', 'maxLen', 'minLen', 'minValue', 'maxValue', 'searchable', 'alonePossess',
    'buildQRCode', 'example', 'defaultValue', 'noShowInList', 'addressShowLevel', 'addressSelectLevel',
    'addressType', 'storageMode', 'format', 'numberReset', 'numberResetRule', 'formulaParams',
    'orderResetRuleParams', 'optionStyle', 'precision', 'masterDataStyle', 'waterMarkExpressionParams', 'currencyRange',
    'relOperateType', 'relatedListName', 'relatedListCode', 'enableContentMask',
  ]
  if (
    (isNameField ||
      fieldLevel === FieldLevelEnum.CustomField
    ) && propNames.includes(propName) && objectProperty !== 'sys'
  ) {
    return true
  }
  const otherPropsNames = ['booleanShowValue1', 'booleanShowValue2']
  // 控制系统对象 和自建对象的系统字段的只读显示
  // eslint-disable-next-line no-bitwise
  if (type === 'edit' && ((objectProperty === 'sys' && !otherPropsNames.includes(propName)))) {
    return false
  }
  // 特殊处理布尔类型
  if (type === 'edit' && objectProperty !== 'sys' && fieldLevel === FieldLevelEnum.CustomField && otherPropsNames.includes(propName)) {
    return true
  }
  /**
   * 子路由字段和系统字段均可编辑的配置项
   */
  if (
    fieldType === 'SUBOBJROUTE' ||
    fieldLevel === FieldLevelEnum.SystemField
  ) {
    if (
      (propName === 'displayLabel' ||
        propName === 'helpText' ||
        propName === 'description') && fieldLevel === FieldLevelEnum.SystemField
    ) {
      return false
    }
    return false
  }

  return false
}

