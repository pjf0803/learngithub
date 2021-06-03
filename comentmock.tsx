/**
 * @fileoverview 字段掩码的配置
 */
import React, { useState } from 'react'
import { HkRadio as Radio, HkForm as Form } from '@hekit/hekit-ui'
import theme from '@hekit/hekit-style'
import Format from './Format'
import Example from './Example'
import ChildPropsWrapper from '../../components/ChildPropsWrapper'

/**
 * 以下字段类型存在小数点，有 ”小数点掩码“ 选项
 */
const floatFields = ['DOUBLE', 'CURRENCY', 'CURRENCYI18N']

const options = [{
  label: '是',
  value: true,
}, {
  label: '否',
  value: false,
}]

/**
 * @param fieldType 字段类型
 * @param form 表单实例
 * 因为存在公式类型的返回值，所以需要处理一下
 */
const getFieldType = (fieldType, form): string => {
  if (fieldType === 'FORMULA') {
    const formulaParams = form && form.getFieldValue('formulaParams')
    const { formulaResultType } = formulaParams || {}
    if (formulaResultType === 'STRING') {
      return 'TEXT'
    }
    return formulaResultType
  }
  return fieldType
}

export default props => {
  const { form, type, fieldType, fieldLevel } = props
  const isCreate = type === 'create'
  /**
   * 自建字段才有 ”内容掩码“
   */
  if (fieldLevel && fieldLevel !== 2) return null
  const [example, setExample] = useState(null)
  const maskCodeRule = form && form.getFieldValue('maskFormat')
  const enableMaskPoint = form && form.getFieldValue('enableMaskPoint')
  // const enableContentMask = form && form.getFieldValue('enableContentMask')
  const formatedFieldType = getFieldType(fieldType, form)
  const isFloat = floatFields.includes(formatedFieldType)
  return (
    <>
      <Form.Item
        noStyle>
        {({ getFieldValue }) => {
          const enableContentMask = getFieldValue('enableContentMask')
          console.log(enableContentMask, 70)
          return (<div>3213</div>)
          return (
            <>
              <Form.Item
                label="内容掩码"
                extra="根据掩码配置，对字段内容敏感信息进行隐藏处理"
                name="enableContentMask"
                initialValue={isCreate && false}
              >
                <Radio.Group
                  options={options}
                />
              </Form.Item>
              <ChildPropsWrapper isHide={!enableContentMask}>
                <Form.Item
                  style={{ paddingTop: theme['@padding-xs'] }}
                  label="格式"
                  extra="设置内容左右两边以明文显示的字符个数及中间隐藏内容的占位符"
                  labelCol={{ span: 5 }}
                  wrapperCol={{ span: 18 }}
                  name="maskFormat"
                  initialValue={{
                    first: null,
                    middle: 4,
                    last: null,
                  }}
                >
                  <Format
                    fieldType={formatedFieldType}
                    onPresetFormatChange={setExample}
                  />
                </Form.Item>
                {/* DOUBLE、CURRENCY （公式返回值） */}
                {isFloat && (
                  <Form.Item
                    label="小数点掩码"
                    labelCol={{ span: 5 }}
                    wrapperCol={{ span: 18 }}
                    name="enableMaskPoint"
                    initialValue={isCreate ? false : null}
                  >
                    <Radio.Group
                      options={options}
                    />
                  </Form.Item>)}
                <Form.Item
                  style={{ marginBottom: 0 }}
                  label="掩码示例"
                  labelCol={{ span: 5 }}
                  wrapperCol={{ span: 18 }}
                >
                  <Example
                    data={example}
                    rule={maskCodeRule}
                    enableMaskPoint={enableMaskPoint}
                    isCurrency={fieldType === 'CURRENCYI18N'}
                  />
                </Form.Item>
              </ChildPropsWrapper>
            </>
          )
        }}
      </Form.Item>
    </>
  )
}

