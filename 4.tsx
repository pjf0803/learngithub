import React, { useEffect, useState } from 'react'
import { HkButton as Button, HkInput as Input, HkSelect as Select, HkMessage as message, HkTreeSelect as TreeSelect, HkModal as Modal, HkForm as Form } from '@hekit/hekit-ui'
// import { Form } from 'antd'
import { connect } from 'dva'
import fm from './fm'
import S from './index.less'

const { Option } = Select;
const { TextArea } = Input;

const { Content, Footer } = Modal

const RoleModal = props => {
  const [form] = Form.useForm();
  const [isShowDepart, setShowDepart] = useState(false)
  useEffect(() => {
    if (props.visible) {
      initRole()
    }
  }, [props.visible])
  const initRole = async () => {
    const { dispatch } = props
    const res = await dispatch({
      type: 'roleManage/initRoleData',
      payload: {
        id: roleId,
      }
    })
    if (roleId) {
      const { adminRole } = res;
      handleEditData(adminRole)
    }
  }

  const handleEditData = (roleData) => {
    form.setFieldsValue({
      name: roleData.name,
      dataLevel: roleData.dataLevel,
      additionalDepartment: roleData.additionalDepartment && roleData.additionalDepartment.map(item => { return { value: item } }),
      description: roleData.description,
    })
    setShowDepart(!!(roleData.dataLevel === '3' || roleData.dataLevel === '4'))
  }

  const handleSubmit = () => {
    const { onCancel, onSuccess, roleId, dispatch } = props;
    form.validateFields()
      .then(params => {
        dispatch({
          type: 'roleManage/saveOrUpdateRole',
          payload: Object.assign(params, {
            id: roleId,
            additionalDepartment: params.additionalDepartment && params.additionalDepartment.map(item => item.value)
          })
        })
          .then(res => {
            if (res) {
              message.success(fm('saveSuccess', '保存成功'))
              onCancel()
              onSuccess()
            }
          })
      })
      .catch(errorInfo => { // error
        errorInfo.errorFields.length > 0 && form.scrollToField(errorInfo.errorFields[0].name.toString())
      })
  }

  const renderDepartTreeNode = (dataList) =>
    dataList && dataList.map(node => {
      if (node.children && node.children.length) {
        return (
          <TreeSelect.TreeNode title={node.name} value={node.id} key={node.id}>
            { renderDepartTreeNode(node.children)}
          </TreeSelect.TreeNode>
        )
      }
      return (
        <TreeSelect.TreeNode title={node.name} value={node.id} key={node.id}></TreeSelect.TreeNode>
      )
    })

  const {
    visible,
    onCancel,
    roleId,
    roleInitData,
    saveLoading,
    isSaas,
    editable } = props;
  const { dataLevels, orgDepartmentRDTO } = roleInitData || {};
  const FormItem = Form.Item;
  const formItemLayout = {
    labelCol: {
      span: 5,
    },
    wrapperCol: {
      span: 12,
    },
  }
  const isNew = !roleId;
  // const isShowDepart = !!(form.getFieldValue('dataLevel') === '3' || form.getFieldValue('dataLevel') === '4')

  return (
    <Modal
      visible={visible}
      title={isNew ? fm('addRole', '新建角色') : fm('roleDetail', '角色详情')}
      footer={null}
      width={640}
      destroyOnClose
      maskClosable={false}
      onCancel={onCancel}
      noPadding
      withFooter
    >
      <Content className={S.roleModal}>
        <Form form={form}  {...formItemLayout}>
          <FormItem shouldUpdate name="name" label={fm('roleName', '角色名称')} rules={[{ required: true, message: fm('enter', '请输入') }]}>
            <Input disabled={!editable} placeholder={fm('enter', '请输入')} />
          </FormItem>
          <FormItem name="dataLevel"  rules={[{ required: true, message: fm('select', '请选择') }]} label={fm('dataLevel', '权限层级')}>
            <Select disabled={!editable}>
              {
                dataLevels && dataLevels.map(item => <Option value={item.value} key={item.value}>{item.desc}</Option>)
              }
            </Select>
          </FormItem>
          {
            !isSaas &&
            <FormItem name="additionalDepartment" label={fm('additionalDepartment', '兼管部门')} extra={fm('additionalDepartment.extra', '该角色除权限层级部门外，可管理的其他部门')} style={{ display: isShowDepart ? '' : 'none' }}>
              <TreeSelect
                treeCheckStrictly
                dropdownStyle={{ maxHeight: 200, overflow: 'auto' }}
                // treeNodeFilterProp="id"
                treeDefaultExpandAll
                allowClear
                treeCheckable
                disabled={!editable}
                showCheckedStrategy="SHOW_PARENT" >
                {renderDepartTreeNode(orgDepartmentRDTO)}
              </TreeSelect>
            </FormItem>
          }
          <FormItem name="description" label={fm('roleDiscribe', '角色描述')} wrapperCol={{ span: 16 }}>
            <TextArea disabled={!editable} style={{ minHeight: 96 }} placeholder={fm('enter', '请输入')} />
          </FormItem>
        </Form>
        <Footer>
          <Button onClick={onCancel}>{fm('cancel', '取消')}</Button>
          <Button type="primary" onClick={handleSubmit} loading={saveLoading}>
            {fm('confirm', '确认')}
          </Button>
        </Footer>
      </Content>
    </Modal>
  )
}

export default connect(({
  roleManage, login, loading
}) => ({
  roleInitData: roleManage.roleInitData,
  isSaas: login.isSaas,
  saveLoading: loading.effects['roleManage/saveOrUpdateRole']
}))(RoleModal)

