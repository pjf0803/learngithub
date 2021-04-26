import React, { PureComponent } from 'react'
import { connect } from 'dva'
import Selector from '@cp-blocks/selector'
import {
  HkInput as Input, HkButton as Button,
  HkSelect as Select, HkRadio as Radio, HkSpin as Spin,
  HkModal as Modal, HkCollapse as Collapse, HkForm as Form
} from '@hekit/hekit-ui'
// import { Form } from 'antd'
import fm from './fm'

// const FormItem = Form.Item
const { Panel } = Collapse
// const {Option} = Select
const RadioGroup = Radio.Group
const { TextArea } = Input

const Itemlayout = {
  labelCol: {
    span: 5,
  },
  wrapperCol: {
    span: 14,
  },
}
const styleProps = {
  style: { width: 250 },
}

@connect(({ loading, approvalGroup }) => ({
  loading: loading.effects['approvalGroup/fetchGroupItem'],
  btnloading: loading.effects['approvalGroup/saveGroupItem'],
  groupItem: approvalGroup.groupItem,
}))
// @Form.create()
export default class ApprovalModal extends PureComponent {
  state = {
    participants: null,
  }
  // 初始化表单 
  formRef = React.createRef()

  componentWillMount() {
    const { modalKey, dataItem, dispatch } = this.props
    dispatch({
      type: 'approvalGroup/fetchGroupItem',
      payload: {
        modalKey,
        dataItem,
      },
    })
  }

  componentDidMount() { }

  componentWillReceiveProps(props) {
    const { groupItem } = this.props
    if (props.groupItem && props.groupItem !== groupItem) {
      this.setState({ participants: props.groupItem.participants })
    }
  }

  handleCancel = () => {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  handleOk = () => {
    const { onCancel, afterConfirm, dispatch, groupItem } = this.props
    this.formRef.current && this.formRef.current.validateFields().then(values => {
      const { participants } = this.state
      const userIds = []
      participants.forEach(item => {
        item.participantDatas.forEach(data => {
          userIds.push(data.source)
        })
      })
      if (groupItem && groupItem.id) {
        values.id = groupItem.id
      }
      values.userIds = userIds
      dispatch({
        type: 'approvalGroup/saveGroupItem',
        payload: values,
      }).then(res => {
        if (res) {
          if (afterConfirm) {
            afterConfirm()
          }
          if (onCancel) {
            onCancel()
          }
        }
      })
    })
    .catch(errorInfo => { // error
      // console.log(errorInfo)
    });
  }

  handleSaveUser = data => {
    this.setState({ participants: data })
  }

  render() {
    const { title, visible, onCancel, loading, groupItem, btnloading } = this.props
    const { participants } = this.state
    // const { getFieldDecorator } = form
    if (!visible) return null
    return (
      <Modal
        title={title}
        visible
        onCancel={onCancel}
        destroyOnClose
        width={800}
        maskClosable={false}
        footer={null}
        noPadding
      >
        <div>
          <Spin spinning={loading}>
            <Form
              {...Itemlayout}
              scrollToFirstError
              ref={this.formRef}
              onFinish={this.handleOk}>
              <Collapse bordered={false} defaultActiveKey={['1']}>
                <Panel collapsible="header" header={fm('approval-modal.base-info', '基本信息')} key="1">
                  <Form.Item
                    shouldUpdate
                    label={fm('approval-modal.group-name', '审批组名称')}
                    name="groupName"
                    initialValue={groupItem.groupName}
                    rules={[{
                      message: fm('approval-modal.group-name-message', '请输入审批组名称'),
                      required: true,
                    }]}
                  >
                    <Input type="text"
                      {...styleProps}
                      placeholder={fm(
                        'approval-modal.group-name-placeholder',
                        '请输入审批组名称',
                      )} />
                  </Form.Item>
                  <Form.Item
                    shouldUpdate
                    label={fm('approval-modal.userIds', '成员')}
                    name="userIds"
                    initialValue={groupItem.userIds}
                    rules={[{
                      message: fm('approval-modal.userIds-message', '请选择成员'),
                      required: true,
                    }]}
                  >
                    <Selector
                      // onChange={this.handleApprovalModalChange}
                      title={fm('approval-modal.userIds-select-title', '成员')}
                      placeholder={fm('approval-modal.userIds-select-placeholder', '请选择成员')}
                      onChange={this.handleSaveUser}
                      selectSelf
                      showTag={false}
                      // nodeId={nodeId}
                      // objId={objId}
                      // disabled={readOnly}
                      // processDefVersionId={processDefineVersionId}
                      participants={participants}
                      tabs={[
                        {
                          type: 'user',
                          title: fm('approval-modal.userIds-tab', '用户'),
                          route: 'table',
                        },
                      ]}
                      sourceFrom="FlowGroup"
                    />
                  </Form.Item>
                  {/* <FormItem
                    label={fm('approval-modal.userIds', '成员')}
                    {...Itemlayout}
                    key="userIds"
                  >
                    {getFieldDecorator('userIds', {
                      initialValue: groupItem.userIds,
                      rules: [
                        {
                          message: fm('approval-modal.userIds-message', '请选择成员'),
                          required: true,
                        },
                      ],
                    })(
                      <Selector
                        // onChange={this.handleApprovalModalChange}
                        title={fm('approval-modal.userIds-select-title', '成员')}
                        placeholder={fm('approval-modal.userIds-select-placeholder', '请选择成员')}
                        onChange={this.handleSaveUser}
                        selectSelf
                        showTag={false}
                        // nodeId={nodeId}
                        // objId={objId}
                        // disabled={readOnly}
                        // processDefVersionId={processDefineVersionId}
                        participants={participants}
                        tabs={[
                          {
                            type: 'user',
                            title: fm('approval-modal.userIds-tab', '用户'),
                            route: 'table',
                          },
                        ]}
                        sourceFrom="FlowGroup"
                      />,
                      // <Select mode='multiple' allowClear {...styleProps} placeholder='请选择成员'>
                      //   <Option value='9598'>lly</Option>
                      //   <Option value='10307'>财务人员</Option>
                      // </Select>
                    )}
                  </FormItem> */}
                  <Form.Item
                    shouldUpdate
                    label={fm('approval-modal.status', '状态')}
                    name="isEnable"
                    initialValue={String(!!groupItem.isEnable)}
                    rules={[]}
                  >
                    <RadioGroup>
                      <Radio value="true">{fm('approval-modal.status-enable', '启用')}</Radio>
                      <Radio value="false">{fm('approval-modal.status-disable', '禁用')}</Radio>
                    </RadioGroup>
                  </Form.Item>

                  <Form.Item
                    shouldUpdate
                    label={fm('approval-modal.desc', '描述')}
                    name="desc"
                    initialValue={groupItem.desc}
                    rules={[]}
                  >
                    <TextArea
                      autoSize
                      {...styleProps}
                      placeholder={fm('approval-modal.desc-placeholder', '请输入描述')}
                    />
                  </Form.Item>
                  {/* <FormItem
                    label={fm('approval-modal.status', '状态')}
                    {...Itemlayout}
                    key="isEnable"
                  >
                    {getFieldDecorator('isEnable', {
                      initialValue: String(!!groupItem.isEnable),
                      rules: [],
                    })(
                      <RadioGroup>
                        <Radio value="true">{fm('approval-modal.status-enable', '启用')}</Radio>
                        <Radio value="false">{fm('approval-modal.status-disable', '禁用')}</Radio>
                      </RadioGroup>,
                    )}
                  </FormItem> */}
                  {/* <FormItem label={fm('approval-modal.desc', '描述')} {...Itemlayout} key="desc">
                    {getFieldDecorator('desc', {
                      initialValue: groupItem.desc,
                      rules: [],
                    })(
                      <TextArea
                        autoSize
                        {...styleProps}
                        placeholder={fm('approval-modal.desc-placeholder', '请输入描述')}
                      />,
                    )}
                  </FormItem> */}
                </Panel>
              </Collapse>
            </Form>
          </Spin>
        </div>
        <div className="sc-modal-footer">
          <Button onClick={this.handleCancel}>{fm('approval-modal.cancel', '取消')}</Button>
          <Button type="primary" loading={btnloading} onClick={this.handleOk}>
            {fm('approval-modal.ok', '保存')}
          </Button>
        </div>
      </Modal>
    )
  }
}

