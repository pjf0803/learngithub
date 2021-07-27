/**
 * @fileoverview 字段配置项组件
 */
import React from 'react'
import { connect } from 'dva'
import { HkButton as Button, HkSpin as Spin, HkCollapse as Collapse, HkModal as Modal, HkErrorBoundaryDecorator as errorBoundaryDecorator, HkForm as Form } from '@hekit/hekit-ui'
import { isMainless } from '@hekit/hekit-bc-utils'
import { hasNameFieldObjectPropertys } from '@/pages/ObjectManager/utils'
import { FormInstance } from 'antd/lib/form'
import { isEqual } from 'lodash'
import { fieldConfig as fieldConfigType } from '../FieldTypeSelector/config'
import { getConfigPanels, defaultActiveKey, justReadOnlyFields } from './utils'
import editableControl from './utils/editableControl'
import setInitialValue from './utils/setInitialValue'
import formatSubmitValues from './utils/formatSubmitValues'
import setFieldDefaultConfig from './hoc/setFieldDefaultConfig'
import fm from '../fm'
import styles from './index.less'


const { Content, Body, Footer } = Modal

export type pageType = 'edit' | 'create' | 'view'

interface IFieldInfo {
  isSaaS: boolean;
  onSave: (params) => void;
  onCancel: () => void;
  objectId: string;
  saveLoading: boolean;
  objectProperty: string;
  type?: pageType,
  onPrev?: () => void;
  fieldId?: string;
  dispatch?: Function;
  fieldType?: string;
  fieldLevel?: number;
  initLoading?: boolean;
  getInstance?: Function;
  fieldConfig?: fieldConfigType;
  onFieldTypeChange?: any;
  isCreated?: boolean;
  objectInfo: any
  filedTenantId?: string
}

@connect(({ loading, objectManager_field }) => ({
  initLoading: loading.effects['objectManager_field/fetchInitData'],
}))
@setFieldDefaultConfig
@sentryCaptureError()
export default class FieldInfo extends React.PureComponent<IFieldInfo> {
  static defaultProps = {
    type: 'create',
  }

  fieldDTO: any = {}

  initAdminFunctions: any[] = []

  state = {
    adminFunctions: [],
  }

  formRef = React.createRef<FormInstance>()

  componentDidMount() {
    const { getInstance } = this.props
    this.fetchInitData()
    if (getInstance) {
      getInstance(this)
    }
  }

  // 获取字段初始化数据
  fetchInitData = async () => {
    const { dispatch, fieldId, objectId, type } = this.props
    const initData = await dispatch({
      type: 'objectManager_field/fetchInitData',
      payload: {
        fieldId,
        objectId,
      },
    })
    if (!initData) return
    const { adminFunctions, fieldDTO } = initData
    this.fieldDTO = fieldDTO

    // 新建时，需按照可见/可读的默认值给职能赋值
    if (type === 'create') {
      adminFunctions.forEach(v => {
        v.updatable = true
        v.readOnly = false
      })
    }

    // 业务管理员，都有可见权限
    adminFunctions.forEach(v => {
      if (v.type === 'system') v.updatable = true
    })

    this.initAdminFunctions = adminFunctions
    this.setState({
      adminFunctions,
    })
    // 字段配置项赋值
    setInitialValue({
      fieldDTO,
      context: this
    })
  }

  /**
   * 切换字段类型后需要重新赋值
   * @param fieldType - string 字段类型
   */
  onFieldTypeChange = fieldType => {
    const { onFieldTypeChange } = this.props
    if (onFieldTypeChange) {
      onFieldTypeChange(fieldType)
    }
    setTimeout(() => {
      setInitialValue({
        fieldDTO: this.fieldDTO,
        context: this,
      })
    }, 20)
  }

  // 职能 onChange
  onAdminFunctionsChange = adminFunctions => {
    this.setState({
      adminFunctions,
    })
  }

  onReadOnlyChange = value => {
    if (typeof value === 'undefined') return
    this.updateAdminFunctions({ readOnly: value })
  }

  onUpdateableChange = value => {
    if (typeof value === 'undefined') return
    this.updateAdminFunctions({ updatable: value })
  }

  // 联动关系
  updateAdminFunctions = settings => {
    const { adminFunctions } = this.state

    // 取消可见，联动取消只读
    if (settings.hasOwnProperty('updatable') && !settings.updatable) {
      settings.readOnly = false
    }

    const data = adminFunctions.map(item => {
      // 修复BUG_00010622
      if (item.type === 'system') return item

      return {
        ...item,
        ...settings
        // readOnly: value,
        // updatable: value,
      }
    })

    this.onAdminFunctionsChange(data)
  }

  // 保存提交时职能权限数据处理
  getAdminFunctionsSubmitValues = () => {
    const { adminFunctions } = this.state
    const { fieldType, type } = this.props
    // 新建字段不用对比改动（全量保存），编辑字段只保存修改的职能（做下沉）
    const changedValues = type === 'create' ? adminFunctions : adminFunctions.filter(item => {
      const initValue = this.initAdminFunctions.find(initItem => initItem.id === item.id)
      return initValue.updatable !== item.updatable || initValue.readOnly !== item.readOnly
    })
    const isChanged = changedValues.length !== 0
    if (!isChanged) return null
    return changedValues.map(item => {
      const readOnly = justReadOnlyFields.includes(fieldType) ? true : item.readOnly
      return `${item.id},${item.updatable},${readOnly}`
    })
  }

  // 提交字段配置
  onSave = () => {
    const { onSave, fieldType, isSaaS, objectProperty, type, fieldLevel } = this.props
    this.formRef.current.validateFields().then((values) => {
      const detailSafety = this.getAdminFunctionsSubmitValues()
      const submitValues = formatSubmitValues({
        type,
        isSaaS,
        fieldType,
        fieldLevel,
        objectProperty,
        fieldValues: values,
      })
      const subParams = {
        ...submitValues,
        detailSafety,
      }
      onSave(subParams)
    }).catch(err => {
      console.log(err)
      err.errorFields && this.formRef.current.scrollToField(err.errorFields[0]?.name.toString())
    })
  }

  getConfigPanels = () => {
    if (!this.formRef.current) return null
    const { type, fieldConfig, fieldType, objectProperty, fieldLevel, objectId, isSaaS, fieldId, objectInfo } = this.props
    const configs = getConfigPanels({
      fieldType,
      objectProperty,
    })
    if (!configs) return null
    return configs.map(config => {
      const { header, key, Component } = config

      const fieldProps = typeof fieldConfig?.props === 'function' ? fieldConfig.props({
        form: this.formRef.current,
        fieldId,
        objectId,
        fieldType,
        objectProperty,
        pageType: type,
        isSaaS,
      }) : fieldConfig?.props

      if (
        key === 'configure' &&
        (!Array.isArray(fieldProps) || fieldProps.length === 0)
      ) {
        return null
      }

      const content = (
        <Form.Item
          noStyle
          shouldUpdate={(r1, r2) => !isEqual(r1, r2)}
        >
          {(form) => {
            const { getFieldValue } = form
            const fieldName = getFieldValue('name')
            const getEditable = editableControl({
              type,
              fieldName,
              fieldType,
              fieldLevel,
              objectProperty,
              isShared: objectInfo?.shareObject
            })
            const componentProps = this.getPanelComponentProps({
              key,
              objectId,
              fieldName,
              fieldConfig,
              getEditable,
              form
            })
            if (key === 'safe') {
              const isSys = objectProperty === 'sys'
              // “锁定配置” 优先从页面控件中取值，若未注册控件则从数据中取值，否则默认可编辑
              const editable = isSys || !isSys && ((!isMainless(fieldLevel) && fieldLevel === 1 && fieldName !== 'name') ? !getFieldValue('editable') : false)
              componentProps.disabled = editable
            }
            return <Component {...componentProps} />
          }}
        </Form.Item>
      )

      return (
        <Collapse.Panel
          key={key}
          header={header}
        >
          {content}
        </Collapse.Panel>
      )
    })
  }

  /**
   * 获取字段从接口中获取的初始值
   * @param propName - string 字段属性
   */
  getInitialValue = propName => {
    if (!this.fieldDTO) return null
    return this.fieldDTO[propName]
  }

  /**
   * 如果是编辑 name 字段的类型，那么在 Configure 组件中当做新建处理
   */
  getConfigurePageType = () => {
    const { type, objectProperty } = this.props
    const name = this.formRef.current && this.formRef.current.getFieldValue('name')
    if (
      name === 'name' &&
      type === 'edit' &&
      hasNameFieldObjectPropertys.includes(objectProperty) &&
      !this.getInitialValue('type')
    ) {
      return 'create'
    }
    return type
  }

  getPanelComponentProps = ({
    key,
    objectId,
    fieldName,
    fieldConfig,
    getEditable,
    form,
  }) => {
    const { adminFunctions } = this.state
    const {
      fieldType, objectProperty, type, fieldId, fieldLevel, isSaaS
    } = this.props
    const componentProps: any = {
      type,
      objectId,
      getEditable,
    }
    if (key === 'basicInfo' || key === 'safe') {
      const { objectInfo, filedTenantId = '', } = this.props
      const { tenantId = '' } = objectInfo || {}
      const isCreatedByTenant = !!tenantId
      componentProps.fieldLevel = fieldLevel
      componentProps.fieldName = fieldName
      componentProps.filedTenantId = filedTenantId
      componentProps.isCreatedByTenant = isCreatedByTenant // 判断对象是不是Saas 继承过来的
    }
    if (
      key === 'basicInfo' ||
      key === 'configure'
    ) {
      componentProps.form = this.formRef.current
      componentProps.isSaaS = isSaaS
      componentProps.objectProperty = objectProperty
      componentProps.getInitialValue = this.getInitialValue
      componentProps.onFieldTypeChange = this.onFieldTypeChange
    }
    if (key === 'configure') {
      const pageType = this.getConfigurePageType()
      componentProps.type = pageType
      if (type !== pageType) {
        componentProps.getEditable = editableControl({
          type: pageType,
          fieldName,
          fieldType,
          fieldLevel,
          objectProperty,
          isTenant: true
        })
      }
      componentProps.fieldType = fieldType
      componentProps.fieldLevel = fieldLevel
      componentProps.objectProperty = objectProperty
      componentProps.fieldProps =
        typeof fieldConfig?.props === 'function' ? fieldConfig.props({
          form,
          fieldId,
          objectId,
          fieldType,
          objectProperty,
          pageType: type,
          isSaaS,
        }) : fieldConfig?.props
      componentProps.onReadOnlyChange = this.onReadOnlyChange
      componentProps.onUpdateableChange = this.onUpdateableChange
    }
    if (key === 'safe') {
      componentProps.fieldType = fieldType
      componentProps.fieldLevel = fieldLevel
      componentProps.objectProperty = objectProperty
      componentProps.fieldName = fieldName
      componentProps.form = form
      componentProps.isSaaS = isSaaS
      // componentProps.isCreatedByTenant = isCreatedByTenant // 判断对象是不是Saas 继承过来的
      // “锁定配置” 优先从页面控件中取值，若未注册控件则从数据中取值，否则默认可编辑
      // 控制系统对象的系统字段和隐藏字段的disabled 的控制
      // (getFieldValue('editable')) ?? 
      // const editable = !(objectProperty === 'sys' || !isMainless(fieldLevel) && fieldLevel !== 2) ?? (getFieldValue('editable')) ?? this.fieldDTO?.editable
      // componentProps.disabled = fieldName === 'name' && objectProperty !== 'sys' ? false : !editable
      componentProps.onChange = this.onAdminFunctionsChange
      componentProps.dataSource = adminFunctions
      componentProps.noReadOnly = justReadOnlyFields.includes(fieldType)
    }
    return componentProps
  }

  render() {
    const { onCancel, onPrev, saveLoading, initLoading, type, isCreated, isSaaS, objectProperty } = this.props
    const isView = type === 'view'
    const isSystem = objectProperty === 'sys'
    return (
      <Content className={styles.fieldInfo}>
        <Body>
          <Spin spinning={initLoading}>
            <Form
              ref={this.formRef}
              labelCol={{ span: 5 }}
              wrapperCol={{ span: 18 }}
              style={{ minHeight: 120 }}
            >
              <Collapse
                bordered={false}
                defaultActiveKey={defaultActiveKey}
              >
                {this.getConfigPanels()}
              </Collapse>
            </Form>
          </Spin>
        </Body>
        {
          !isSystem && <Footer>
            <Button onClick={onCancel}>{fm('cancel', '取消')}</Button>
            {onPrev && (
              <Button onClick={onPrev}>{fm('preStep', '上一步')}</Button>
            )}
            {!isView && !isCreated && (
              <Button type="primary" onClick={this.onSave} loading={saveLoading}>
                {fm('save', '保存')}
              </Button>)}
          </Footer>
        }
      </Content>
    )
  }
}

