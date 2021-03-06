import React from 'react'
import { connect } from 'dva'
import { omit } from 'lodash'
import { getLocale, formatMessage } from 'umi/locale';
// import { Form } from 'antd'
import { HkInput as Input, HkRadio as Radio, HkUpload as Upload, HkSelect as Select, HkModal as Modal, HkMessage as message, HkForm as Form } from '@hekit/hekit-ui'
import { HekitUiIcon, LIB } from '@hekit/hekit-icon'
import { is200, listDataWrapper, getPageQuery } from '@hekit/hekit-bc-utils'
import Table from '@/components/Table/NonStandardTable'
import { defaultAdminPagination } from '@/components/Table/settings';
import ObjectButton from '@hekit/hekit-bc-object-button'
import AdminChoose from './adminChosse'
import fm from '../fm'

const { Dragger } = Upload
const { TextArea } = Input
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 10 },
  },
}

const pageParams = getPageQuery()
const {
  menuCode
} = pageParams

const radioOptions = () => [{ label: formatMessage({ id: 'common.options.yes' }), value: true }, { label: formatMessage({ id: 'common.options.no' }), value: false }]

export enum ModalTitleEnum {
  New = '新建沙箱',
  Edit = '编辑沙箱',
  Active = '激活沙箱'
}

export enum ModalTitleEnEnum {
  New = 'New Sandbox',
  Edit = 'Edit Sandbox',
  Active = 'Activate Sandbox'
}

export interface SandBoxListProps {
  type: string
  moduleCode: string
  layout: any
  dataSource: any
  loading: boolean
  updateSandBox: () => void
  currentUser: any
  form?: any
  isSaas?: boolean
  dispatch?: (parmas: any) => any
  updateLoading?: boolean
  roleButtons: Array<string>
}

// @Form.create()
@connect(({ sandBoxList, loading, login }) => ({
  updateLoading:
    loading.effects['sandBoxList/fetchSaveSandBox'] ||
    loading.effects['sandBoxList/fetchUpdateSandBox'] ||
    loading.effects['sandBoxList/fetchActiveSandBox'],
  isSaas: login.isSaas,
  currentUser: login.userInfo,
}))
export default class SandBoxList extends React.PureComponent<SandBoxListProps, any> {
  private otherProps: any

  private disabledProps: any

  state = {
    modalVisible: false,
    autoActived: false,
    userIds: [],
    tableLoading: false,
    newStatus: true,
    prefix: 'prefix',
    mode: '',
    editId: '',
    uploadVisible: false,
    param: {
      ...defaultAdminPagination,
    },
    uploadName: '',
    uploadDisc: '',
    uploadFile: '',
    updateLoading: false,
    uploadDisabled: false,
    fileList: [],
    adminChooseVisible: false,
    shareUser: '',
    shareUserName: '',
    checkedOrgSystemId: '',
    shareUserValidateStatus: '',
    shareUserHelp: '',
  }

  // 管理员输入框实例
  adminchooseSelect = null

  /**
   * 获取表格数据
   */
  fetchNonStandardTableData = () => {
    const { dispatch, type } = this.props
    const { param } = this.state

    dispatch({
      type: `sandBoxList/${type === 'version' ? 'fetchTableVersionData' : 'fetchTableData'}`,
      payload: {
        ...param,
        menuCode,
      },
    })
  }

  /**
   * 新建沙箱
   */
  handleCreate = () => {
    this.setState({
      newStatus: true,
      modalVisible: true,
      autoActived: false,
      mode: 'New',
      prefix: 'prefix',
    })
    this.otherProps = {
      disabled: false,
    }
    this.disabledProps = {
      disabled: false,
    }
  }

  handleUpload = () => {
    this.setState({
      modalVisible: false,
    })
  }

  onCancel = () => {
    this.setState({
      modalVisible: false,
      shareUserName: '',
    })
  }

  uploadCancel = () => {
    this.setState({
      uploadVisible: false,
      uploadName: '',
      uploadDisc: '',
      uploadFile: '',
      fileList: [],
    })
  }

  /**
   * 表单提交数据
   */
  handleSubmit = (e: any) => {
    const { dispatch } = this.props
    const { autoActived, userIds, editId, mode, shareUser, checkedOrgSystemId } = this.state
    e.preventDefault()
    if (autoActived && !shareUser) {
      this.setState({
        shareUserValidateStatus: 'error',
        shareUserHelp: '请选择沙箱管理员'
      })
      return
    }
    this.setState({
      shareUserValidateStatus: '',
      shareUserHelp: ''
    })

    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let fetchUrl = ''
        let params = {}
        if (mode === 'New') {
          params = Object.assign({ sandbox: omit(values, 'shareUser') }, { autoActived })
          fetchUrl = 'sandBoxList/fetchSaveSandBox'
        } else if (mode === 'Edit') {
          params = Object.assign(omit(values, ['prefix', 'shareUser']), { id: editId })
          fetchUrl = 'sandBoxList/fetchUpdateSandBox'
        } else {
          params = params = Object.assign({ userIds }, { id: editId })
          fetchUrl = 'sandBoxList/fetchActiveSandBox'
        }
        // params.shareUser = shareUser
        dispatch({
          type: fetchUrl,
          payload: {
            ...params,
            adminUserId: shareUser,
            organizationId: checkedOrgSystemId,
            menuCode,
          },
        }).then((res: any) => {
          if (is200(res)) {
            if (mode === 'New' && autoActived) {
              message.success(fm('in-operation', '操作正在处理中，请稍后刷新页面查看'))
              this.afterSaveActive(res.data || '')
            }
            this.onCancel()
            this.props.updateSandBox()
          }
        })
      }
    })
  }

  /**
   * 一键激活沙箱
   */
  afterSaveActive = async id => {
    const { dispatch } = this.props
    const { userIds, shareUser, checkedOrgSystemId } = this.state
    const res = await dispatch({
      type: 'sandBoxList/fetchActiveSandBox',
      payload: {
        id,
        userIds,
        adminUserId: shareUser,
        organizationId: checkedOrgSystemId,
        menuCode,
      },
    })
    if (res && res.code !== 200) {
      message.error(res.subMsg)
    }
  }

  /**
   * 按钮处理方法
   */
  handleMenuClick = async (type: string, data: any) => {
    const { isSaas, dispatch } = this.props
    if (type === 'add') {
      this.handleCreate()
      return
    }
    // 删除
    if (type === 'delete') {
      this.handleDeleteSandBox(data.id)
      return
    }

    // 编辑
    if (type === 'edit') {
      this.handleEditSandBox(data)
    }

    // 发布
    if (type === 'sandboxDeploy') {
      this.handleRelaseSandBox(data.id)
      return
    }

    // 重新发布
    if (type === 'sandboxRelease') {
      this.handleRelaseOverSandBox(data.id)
      return
    }

    // 导出
    if (type === 'sandboxExport') {
      this.handleExportSandBox(data.id)
      return
    }

    // 下载
    if (type === 'sandboxDownload') {
      this.handleDownloadSandBox(data)
      return
    }

    // 激活
    if (type === 'sandboxActive') {
      // if (isSaas) {
      //   const res = await dispatch({
      //     type: 'sandBoxList/fetchActiveSandBox',
      //     payload: {
      //       id: data.id,
      //       menuCode,
      //     },
      //   })
      //   if (is200(res)) {
      //     this.props.updateSandBox()
      //     message.success(fm('activation-successful', '激活成功'))
      //   } else {
      //     message.error(res.subMsg || fm('activation-successful', '激活失败'))
      //   }
      // } else {

      // }
      this.handelActiveSandBox(data)
    }
  }

  /**
   *  上传
   */
  handleUploadSandBox = () => {
    this.setState({
      uploadVisible: true,
    })
  }

  /**
   * 导出沙箱
   */
  handleExportSandBox = (id: string) => {
    const { dispatch } = this.props
    dispatch({
      type: 'sandBoxList/fetchExportSandBox',
      payload: {
        id,
        menuCode,
      },
    }).then(res => {
      if (is200(res)) {
        message.success(res.subMsg)
        this.props.updateSandBox()
      }
    })
  }

  /**
   * 下载
   */
  handleDownloadSandBox = (data: any) => {
    const { id } = data
    if (!id) return false
    const params = {
      sandboxId: id,
    }
    const downloadFileUrl = `/api/sandbox/data/download?sandboxId=${id}`
    // window.open(downloadFileUrl)
    // return
    const form = document.createElement('form')
    form.id = 'form'
    form.name = 'form'
    document.body.appendChild(form)
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = params[key]
        form.appendChild(input)
      }
    }
    form.method = 'GET'
    form.action = downloadFileUrl
    form.target = '_blank'
    form.submit()
    document.body.removeChild(form)
  }

  /**
   * 删除沙箱
   */
  handleDeleteSandBox = (id: string) => {
    const { dispatch } = this.props
    dispatch({
      type: 'sandBoxList/fetchDeleteSandBox',
      payload: {
        id,
        menuCode,
      },
    }).then(res => {
      if (is200(res)) {
        message.success(fm('operation-successful', '操作成功'))
        this.props.updateSandBox()
      }
    })
  }

  /**
   * 发布沙箱
   */
  handleRelaseSandBox = (id: string) => {
    const { dispatch } = this.props
    dispatch({
      type: 'sandBoxList/fetchReleaseSandBox',
      payload: {
        id,
        menuCode,
      },
    }).then(res => {
      if (is200(res)) {
        message.success(fm('in-operation', '操作正在处理中，请稍后刷新页面查看'))
        this.props.updateSandBox()
      }
    })
  }

  /**
   * 已发布
   */
  handleRelaseOverSandBox = (id: string) => {
    const { dispatch } = this.props
    dispatch({
      type: 'sandBoxList/fetchVersionSwitchSandBox',
      payload: {
        id,
        menuCode,
      },
    }).then(res => {
      if (res.code) {
        message.success(fm('in-operation', '操作正在处理中，请稍后刷新页面查看'))
        this.props.updateSandBox()
      }
    })
  }

  /**
   * 激活沙箱
   */
  handelActiveSandBox = (data: any) => {
    const {
      form: { setFieldsValue },
      dispatch,
    } = this.props
    this.setState(
      {
        modalVisible: true,
        newStatus: true,
        autoActived: true,
        prefix: data.domain,
        mode: 'Active',
        editId: data.id,
      },
      () => {
        this.disabledProps = {
          disabled: true,
        }
        this.otherProps = {
          disabled: true,
        }
        setFieldsValue({
          name: data.name,
          description: data.description,
          prefix: `https://${data.domain}`,
        })
      },
    )
    // dispatch({
    //   type: 'sandBoxList/fetchActiveSandBox',
    //   payload: {
    //     id: data.id
    //   }
    // }).then(res => {
    //   if (is200(res)) {
    //     message.success('激活成功')
    //     this.props.updateSandBox()
    //   }
    // })
  }

  /**
   * 编辑沙箱
   */
  handleEditSandBox = (data: any) => {
    const {
      form: { setFieldsValue },
    } = this.props
    this.setState(
      {
        modalVisible: true,
        newStatus: false,
        prefix: data.domain,
        mode: 'Edit',
        editId: data.id,
      },
      () => {
        this.otherProps = {
          disabled: true,
        }
        this.disabledProps = {
          disabled: false,
        }
        setFieldsValue({
          name: data.name,
          description: data.description,
          prefix: `https://${data.domain}`,
        })
      },
    )
  }

  /**
   * 分页，排序，筛选查询
   */
  // handleAdvancedTableChange = (pagination: any, filterInfo: any, sorterInfo: any) => {
  //   const { pageNo = 1, pageSize = 15 } = pagination
  //   const $sorts = {}
  //   if (Object.keys(sorterInfo).length) {
  //     const { sortField, sortType } = sorterInfo
  //     const [first, ...lastField] = sortField.split('.')
  //     $sorts[lastField.join('.')] = sortType
  //   }
  //   const filters = getFilters(filterInfo)
  //   this.setState(
  //     {
  //       pagination: {
  //         pageNo,
  //         pageSize,
  //       },
  //       param: isEmpty($sorts) ? { ...filters } : { $sorts, ...filters },
  //     },
  //     this.fetchNonStandardTableData,
  //   )
  // }

  handleNonStandardListChange = (param) => {
    this.setState(
      {
        param,
      },
      this.fetchNonStandardTableData,
    )
  }

  onRadioChange = (e: any) => {
    this.setState({
      autoActived: e.target.value,
    })
  }

  onDomainChange = (e: any) => {
    const { value } = e.target
    const { isSaas } = this.props

    this.setState({
      prefix: value ? (isSaas ? `${value}-admin` : value) : 'prefix',
    })
  }

  handleRenderColumn = (text, record, index, data) => {
    if (data.codeIndex === 'domains') {
      return (
        <div className="display-cell-text-word" style={{ display: 'flex' }}>
          {text &&
            text.map(item => (
              <a href={`//${item.href}`} target="_blank">
                {item.desc}
              </a>
            ))}
        </div>
      )
    }
    if (data.codeIndex === 'domain') {
      return (
        <div className="display-cell-text-word">
          <a href={`//${text}`} target="_blank">
            {text}
          </a>
        </div>
      )
    }
    return (
      <div className="display-cell-text-word">
        <span>{text}</span>
      </div>
    )
  }

  handleApprovalModalSelectChange = (data: any) => {
    const userIds = data
      .filter((item: any) => item.participantType === 'USER')[0]
      .participantDatas.map(item => item.source)

    this.setState({
      userIds,
    })
  }

  uploadNameChange = (e: any) => {
    this.setState({
      uploadName: e.target.value,
    })
  }

  uploadDiscChange = (e: any) => {
    this.setState({
      uploadDisc: e.target.value,
    })
  }

  uploadRemove = (file: any) => {
    if (file.name) {
      this.setState({
        fileList: [],
      })
    }
  }

  // 新的上传逻辑
  beforeUpload = (file: any, fileList) => {
    const fileName = file.name.lastIndexOf('.') // 取到文件名开始到最后一个点的长度
    const fileNameLength = file.name.length // 取到文件名长度
    const fileFormat = file.name.substring(fileName + 1, fileNameLength) // 截
    const isLt1M = file.size / 1024 / 1024 < 1
    const isZip = fileFormat === 'zip'
    if (!isZip || !isLt1M || fileList.length > 1) {
      this.setState({
        fileList: [],
      })
    }
    if (!isZip) {
      message.error(fm('fileTypeLimit', '只能上传Zip文件'))
      return false
    }
    if (!isLt1M) {
      message.error(fm('fileSizeLimit', '文件大小不能超过1M'))
      return false
    }
    this.setState({
      fileList,
      uploadFile: file,
    })
    return false
  }

  /**
   * 上传提交
   */
  uploadSubmit = async (e: any) => {
    const { dispatch } = this.props
    const { uploadFile, uploadName, uploadDisc } = this.state
    e.preventDefault()
    if (uploadName === '') {
      message.error(fm('error-name', '请填写沙箱名称'))
      return
    }
    if (uploadDisc === '') {
      message.error(fm('error-name', '请填写沙箱描述'))
      return
    }
    if (uploadFile === '') {
      message.error(fm('error-name', '请上传文件'))
      return
    }
    this.setState({
      updateLoading: true,
    })
    const formData = new FormData()
    formData.append('name', uploadName)
    formData.append('description', uploadDisc)
    formData.append('file', uploadFile)
    const res = await dispatch({
      type: 'sandBoxList/fetchUploadSandBox',
      payload: {
        ...formData,
        menuCode,
      },
    })
    if (is200(res)) {
      message.success(fm('upload-successful', '上传成功'))
      this.props.updateSandBox()
      this.setState({
        updateLoading: false,
      })
      this.uploadCancel()
    }
  }

  /**
   * 选择管理员弹窗关闭
   */
  onAdminChooseCancel = () => {
    this.setState({
      adminChooseVisible: false
    })
  }

  /**
   * 选择管理员保存回调
   */
  onAdminChooseSave = (value: any, checkedOrgSystemId: string) => {
    const { id, name } = value || {}
    if (id) {
      this.setState({
        shareUserValidateStatus: '',
        shareUserHelp: '',
        shareUser: id,
        shareUserName: name,
        checkedOrgSystemId,
      })
    } else {
      this.setState({
        shareUser: id,
        shareUserName: name,
        checkedOrgSystemId,
        shareUserValidateStatus: 'error',
        shareUserHelp: '请选择沙箱管理员',
      })
    }
    this.onAdminChooseCancel()
  }

  /**
   * 展示选择管理员弹窗
   */
  onAdminChooseShow = () => {
    if (this.adminchooseSelect) {
      this.adminchooseSelect.blur()
    }
    this.setState({
      adminChooseVisible: true
    })
  }

  render() {
    const {
      type,
      moduleCode,
      isSaas,
      layout,
      loading,
      dataSource,
      currentUser,
      updateLoading,
      // form: { getFieldDecorator },
      roleButtons,
    } = this.props
    const {
      modalVisible,
      autoActived,
      newStatus,
      prefix,
      mode,
      uploadVisible,
      uploadName,
      uploadDisc,
      fileList,
      uploadDisabled,
      adminChooseVisible,
      shareUserName,
      shareUserValidateStatus,
      shareUserHelp,
    } = this.state
    const { listhead, listheaddisplay, columnNumberStyle } = layout
    const { op } = currentUser
    const uploadProps = {
      name: 'file',
      disabled: uploadDisabled,
      fileList,
      multiple: false,
      accept: 'application/zip',
      data: {
        name: uploadName,
        description: uploadDisc,
      },
      beforeUpload: this.beforeUpload,
      onRemove: this.uploadRemove,
    }

    return (
      <div className="table-wrapper">
        <Table
          isPagination
          data={dataSource}
          // buttonData={type === 'version' ? buttonVersionData(op) : buttonEnvirData()}
          buttonData={roleButtons}
          loading={loading}
          isActivateRetrival={false}
          nonstandardPrimaryKey={['title']}
          // TableHeaderRightBarContent={this.renderRightButton()}
          handleRenderColumn={this.handleRenderColumn}
          // onChange={this.handleAdvancedTableChange}
          moduleCode={moduleCode}
          onChange={this.handleNonStandardListChange}
          columns={{ listhead: listDataWrapper(listhead, currentUser), listheaddisplay, columnNumberStyle }}
          rowButtonRender={
            <ObjectButton
              mode="rowDropdown"
              afterConfirm={this.handleMenuClick}
              standardObject={false}
            />
          }
        />
        {/* 新建沙箱 */}
        <Modal
          destroyOnClose
          width={720}
          visible={modalVisible}
          title={getLocale() === 'en-US' ? ModalTitleEnEnum[mode] : ModalTitleEnum[mode]}
          onOk={this.handleSubmit}
          onCancel={this.onCancel}
          confirmLoading={updateLoading}
        >
          {/* <Form {...formItemLayout} onSubmit={this.handleSubmit}>
            <Form.Item label={formatMessage({ id: 'app.route.pageName.sandBox.sandboxName' })}>
              {getFieldDecorator('name', {
                rules: [
                  {
                    required: true,
                    message:
                      formatMessage({ id: 'common.action.input' }) +
                      formatMessage({ id: 'app.route.pageName.sandBox.sandboxName' }),
                  },
                ],
              })(<Input {...this.disabledProps} />)}
            </Form.Item>
            <Form.Item
              label={formatMessage({ id: 'app.route.pageName.sandBox.sandboxDescription' })}
            >
              {getFieldDecorator('description', {
                rules: [
                  {
                    required: true,
                    message:
                      formatMessage({ id: 'common.action.input' }) +
                      formatMessage({ id: 'app.route.pageName.sandBox.sandboxDescription' }),
                  },
                ],
              })(<TextArea autoSize={{ minRows: 1, maxRows: 5 }} {...this.disabledProps} />)}
            </Form.Item>
            <Form.Item
              label={formatMessage({ id: 'app.route.pageName.sandBox.customDomainName' })}
              extra={mode === 'New' ? `https://${prefix}.sandbox.clickpaas.com` : ''}
            >
              {getFieldDecorator('prefix', {
                rules: [
                  {
                    required: true,
                    message:
                      formatMessage({ id: 'common.action.input' }) +
                      formatMessage({ id: 'app.route.pageName.sandBox.customDomainName' }),
                  },
                ],
              })(<Input onChange={this.onDomainChange} {...this.otherProps} />)}
            </Form.Item>
            {newStatus && (
              <div>
                <Form.Item label={formatMessage({ id: 'app.route.pageName.sandBox.autoActivate' })}>
                  {getFieldDecorator('active', {
                    initialValue: autoActived,
                  })(
                    <Radio.Group
                      onChange={this.onRadioChange}
                      options={radioOptions()}
                      {...this.disabledProps}
                    />,
                  )}
                </Form.Item>
                {autoActived && (
                  <Form.Item
                    label={formatMessage({ id: 'app.route.pageName.sandBox.sandboxAdministrator' })}
                    required
                    validateStatus={shareUserValidateStatus}
                    help={shareUserHelp}
                  >
                    <Select
                      // eslint-disable-next-line no-return-assign
                      ref={node => this.adminchooseSelect = node}
                      onFocus={this.onAdminChooseShow}
                      showArrow={false}
                      value={shareUserName}
                    />
                  </Form.Item>
                )}
              </div>
            )}
          </Form> */}
        </Modal>
        {/* <Modal
          destroyOnClose
          width={720}
          visible={uploadVisible}
          title={formatMessage({ id: 'app.route.pageName.sandBox.file' })}
          onOk={this.uploadSubmit}
          onCancel={this.uploadCancel}
          confirmLoading={updateLoading}
        >
          <Form {...formItemLayout}>
            <Form.Item label={formatMessage({ id: 'app.route.pageName.sandBox.sandboxName' })}>
              <Input value={uploadName} onChange={this.uploadNameChange} />
            </Form.Item>
            <Form.Item
              label={formatMessage({ id: 'app.route.pageName.sandBox.sandboxDescription' })}
            >
              <Input value={uploadDisc} onChange={this.uploadDiscChange} />
            </Form.Item>
            <Form.Item label={formatMessage({ id: 'app.route.pageName.sandBox.file' })}>
              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <HekitUiIcon lib={LIB.ANTD3} type="inbox" />
                </p>
                <p className="ant-upload-hint" style={{ width: '70%', marginLeft: '15%' }}>
                  {formatMessage({ id: 'app.route.pageName.sandBox.uploadRestriction' })}
                </p>
              </Dragger>
            </Form.Item>
          </Form>
        </Modal> */}
        <Modal
          destroyOnClose
          width={960}
          visible={adminChooseVisible}
          title="选择管理员"
          className="admin-choose-modal"
          footer={null}
          onCancel={this.onAdminChooseCancel}
          noPadding
          withFooter
        >
          <AdminChoose
            menuCode={menuCode}
            onSave={this.onAdminChooseSave}
            onCancel={this.onAdminChooseCancel}
            dispatch={this.props.dispatch}
          />
        </Modal>
      </div>
    )
  }
}

