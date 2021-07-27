/**
 * @fileoverview 锁定配置
 */
import React, { Fragment } from 'react'
import { HkForm as Form, HkRadio as Radio, HkCheckbox as Checkbox } from '@hekit/hekit-ui'
import fm from '../../fm'

enum FieldLevelEnum {
  HiddenField,
  SystemField,
  CustomField,
}
const reverseOptions = [
  {
    label: fm('yes', '是'),
    value: false,
  },
  {
    label: fm('no', '否'),
    value: true,
  },
]
const formLayout = {
  labelCol: {
    span: 4,
  },
  wrapperCol: {
    span: 18,
  },
}
// isCreatedByTenant 用来判断对象是不是来自Saas继承
export default ({
  form,
  getEditable,
  isSaaS: Saas,
  fieldLevel,
  objectProperty,
  fieldName,
  isCreatedByTenant,
  filedTenantId
}) => {
  const isName = fieldName === 'name'
  // const isSys = objectProperty === 'sys'
  const isCustom = fieldLevel === FieldLevelEnum.CustomField
  // 当不是Saas 系统， 字段是继承过来的时
  // 是Saas 系统 不是继承过来的时
  const otherDisabled = !Saas && !isCreatedByTenant && !filedTenantId && !!fieldLevel// Saas 系统继承的字段
  // console.log(isCreatedByTenant, filedTenantId, isCustom, !!fieldLevel, 48)
  // const isBySaas = !Saas && isCreatedByTenant // 继承Saas 的字段不能编辑
  // console.log(isName, '是Name 字段么')
  // console.log(isSys, '系统类型')
  // console.log(isCustom, '是否是自建字段')
  // console.log(!isCreatedByTenant, '是否是继承过来的')
  // console.log(Saas,  filedTenantId, '是不是Saas')
  // isCreatedByTenant  子对象的name 和子对象名称， 树对象的name 和上级记录  基础对象的name  它们都可以选   
  // console.log(filedTenantId, 56)
  // const otherDisabled = !!fieldLevel && ((isSaasCreate && !isName && !Saas) || !(isCustom || isName))
  const onHeaderCheckboxChange = (e, key) => {
    const { checked } = e.target
    const isChecked = form.getFieldValue(key)
    const obj = {}
    obj[key] = checked;
    ((key === 'readOnly' && isChecked && !checked) || (key === 'updateable' && !isChecked && checked)) && form.setFieldsValue({ ...obj })
  }
  return (
    <Fragment>
    <Form.Item
        { ...formLayout }
        label = { fm('configOption.lock', '锁定职能') }
  name = 'editable'
  initialValue = { true}
  extra = {
    fm(
          'configOption.lock.extra',
          '锁定职能后，将无法在“职能管理”菜单下的职能配置页面，对该字段的职能权限进行变更',
    )
  }
    >
    <Radio.Group
          options={ reverseOptions }
  disabled = { otherDisabled || !getEditable('editable')
}>
  </Radio.Group>
  < /Form.Item>
  < Form.Item
{...formLayout }
label = { fm('configOption.defaultLock', '新职能默认值') }
extra = { fm('configOption.defaultLockTip', '新职能创建后，初始化新职能对当前字段的默认访问、编辑权限') }
shouldUpdate
  >
  <Form.Item
          noStyle
valuePropName = 'checked'
initialValue = { false}
name = 'updateable'
  >
  <Checkbox disabled={ otherDisabled || !getEditable('updateable') } onChange = { e => onHeaderCheckboxChange(e, 'readOnly') } > { fm('configOption.visible', '可见') } < /Checkbox>
    < /Form.Item>
    < Form.Item
noStyle
valuePropName = "checked"
initialValue = { false}
name = 'readOnly'
  >
  <Checkbox disabled={ otherDisabled || !getEditable('readOnly') } onChange = { e => onHeaderCheckboxChange(e, 'updateable') } > { fm('configOption.readOnly', '只读') } < /Checkbox>
    < /Form.Item>
    < /Form.Item>
    < /Fragment >

  )
}

