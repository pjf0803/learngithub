/**
 * @fileoverview 字段的基础信息
 */

import React from 'react'
import { HkInput as Input, HkCheckbox as Checkbox, HkFieldWithDisabled as FieldWithDisabled, HkForm as Form } from '@hekit/hekit-ui'
import fm from '../../fm'
import FieldCode from './FieldCode'
import FieldType from './FieldType'
enum FieldLevelEnum {
  HiddenField,
  SystemField,
  CustomField,
}
interface IBasicInfo {
  type: 'view' | 'edit' | 'create',
  form: any;
  isSaaS: boolean,
  objectProperty: string,
  getEditable: (propName: string) => boolean;
  filedTenantId: string
  fieldLevel?: number;
  fieldName?: string
  isCreatedByTenant: boolean
}

export default class BasicInfo extends React.PureComponent<IBasicInfo> {
  state = {

  }

  onAllowTenantViewChange = e => {
    const { checked } = e.target
    if (checked) return
    const { form } = this.props
    // const { setFieldsValue } = form
    form && form.setFieldsValue({
      allowTenantEdit: false,
    })
  }

  render() {
    const { getEditable, objectProperty, isSaaS, type, filedTenantId = '', isCreatedByTenant = false, fieldLevel, fieldName = '' } = this.props
    // console.log(isCreatedByTenant, filedTenantId, 39)
    // const isSub = !!filedTenantId // 子对象继承的不能编辑其他可以编辑
    // const isCustom = fieldLevel === FieldLevelEnum.CustomField
    const isRender = objectProperty === 'config' && isSaaS
    const isView = type === 'view'
    // const isName = fieldName === 'name'
    // !!fieldLevel && ((isSaasCreate && !isName && !Saas) || !(isCustom || isName))
    const isSaasCreate = !isSaaS && !isCreatedByTenant && !filedTenantId && !!fieldLevel
    // const isSaasCreate = !isSaaS && isTenant ? true : !!fieldLevel && !(!!fieldLevel && (isCustom || isName))
    // console.log(isSaasCreate, !getEditable('displayLabel'), 44)
    return (
      <div className= "basic-info" >
      <FieldType { ...this.props } />
      <Form.Item
          label={ fm('name', '字段名称') }
    name = "displayLabel"
    rules = { [{ required: getEditable('displayLabel'), message: fm('require', '请输入') }]}
      >
      <FieldWithDisabled
            disabled={ isSaasCreate || !getEditable('displayLabel') }
          >
      <Input style={ { width: 300 } } />
        < /FieldWithDisabled>
        < /Form.Item>
        < FieldCode isSaasCreate = { isSaasCreate } {...this.props } />
    {
      isRender && (
        <Form.Item
            label={ fm('objectTenantLimit', '对租户权限') }
      extra = { fm('objectTenantLimit.extra', '该字段对租户是否可见、可编辑') }
      shouldUpdate
        >
        {({ getFieldValue }) => {
        const isAllowTenantView = getFieldValue('allowTenantView')
        return (
          <>
          <Form.Item
                    name= "allowTenantView"
        valuePropName = "checked"
        noStyle
          >
          <Checkbox
                      disabled={ isView }
        onChange = { this.onAllowTenantViewChange }
          >
          { fm('basic.allowView', '可见') }
          < /Checkbox>
          < /Form.Item>
          < Form.Item
        name = "allowTenantEdit"
        valuePropName = "checked"
        noStyle
        shouldUpdate
          >
          <Checkbox
                      disabled={ !isAllowTenantView || isView }
                    >
          { fm('basic.allowEdit', '可编辑') }
          < /Checkbox>
          < /Form.Item>
          < />
              )
      }
    }
    </Form.Item>
        )
  }
        <Form.Item
          label={ fm('helpText', '帮助文本') }
name = "helpText"
rules = { [{ required: false, message: fm('require', '请输入') }]}
  >
  <FieldWithDisabled
            disabled={ isSaasCreate || !getEditable('helpText') }
          >
  <Input.TextArea style={ { width: 500 } } autoSize />
    </FieldWithDisabled>
    < /Form.Item>
    < Form.Item
label = { fm('description', '描述') }
name = "description"
rules = { [{ required: false, message: fm('require', '请输入') }]}
  >
  <FieldWithDisabled
            disabled={ isSaasCreate || !getEditable('description') }
          >
  <Input.TextArea style={ { width: 500 } } autoSize />
    </FieldWithDisabled>
    < /Form.Item>
    < /div>
    )
  }
}

