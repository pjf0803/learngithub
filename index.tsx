import React, { useState, useEffect, useImperativeHandle, useRef } from 'react'
import Selector from '@cp-blocks/selector'
import { Form, Collapse, Input, Upload, message, Checkbox, Spin, Radio, Button, Switch, Space, Typography, Table } from 'antd4'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { HkMessage } from '@hekit/hekit-ui'
import { is200 } from '@cp/cp-ui'
import { getPageQuery } from '@cp/cp-utils'
import { API } from '@/services'
import MenuTree from '../MenuTree'
import DomainTable from './domainTable'
import OpenHttpRender from './openHttp'
import './index.less'
import { sanboxColumn, sanboxSourceData } from './formalDomain'
import { cloneDeep } from 'lodash'
const { Link } = Typography
import { HekitUiIcon, LIB } from '@hekit/hekit-icon'


interface Props {
  /** 编辑数据 */
  editData: any
  /** 监听编辑名称 */
  onChangeName: (e: any) => void
}

interface RefMethods {
  /** 给外部提供的获取数据方法 */
  getBasicInfo: () => Promise<any>
}

const { Item } = Form
const { Panel } = Collapse
const clsPrefix = 'app-entry-config-info'
const defaultIconPath = 'https://cpfe2.successchannel.net/file/2eb72572331fed02646adce419494f7a.ico'
const httpParams = {
  httpFlag: false,
  domainName: '',
  certificate: '',
  id: '', // 域名证书的id
  certificateDate: '',
  httpVisit: false
}

const AppEntryConfigBasicInfo = React.forwardRef<RefMethods, Props>((props, ref) => {
  const { editData, onChangeName } = props
  const [fieldExist, setFieldExist] = useState<any>({ name: '', menuType: 'DEFAULT', domainType: 'REDIRECT', noticeUserIds: '' }) // noticeUserIds 管理员
  const [iconExt, setIconExt] = useState<string>('')
  const [selectMenus, setSelectMenus] = useState<any[]>([])
  const [fetchMenuLoading, setFetchMenuLoading] = useState<boolean>(false)
  const [customMenu, setCustomMenu] = useState<boolean>(false)
  const [menuData, setMenuData] = useState<any[]>([])
  const [iconPath, setIconPath] = useState<string>(defaultIconPath)
  const [form] = Form.useForm()
  const { name: nameExist, menuType: menuTypeExist, domainType } = fieldExist
  const { titleImage, appMenuIds, menuType, id: editId } = editData
  const menuRange = [{ value: 'DEFAULT', name: '全部' }, { value: 'CUSTOM', name: '自定义' }]
  const domainTypeList = [{ value: 'REDIRECT', name: '入口域名跳转' }, { value: 'AGENT', name: '全站域名替换' }]
  const [formalDataSource, setFormalDataSource] = useState<any>({})
  const [domainCertificate, setDomainCertificate] = useState<any>({ ...httpParams }) // 证书信息
  const [formalCertificate, setFormalCertificate] = useState<any>({ ...httpParams })
  const [sanboxCertificate, setSanboxCertificate] = useState<any>({ ...httpParams })
  const [domainFlag, setDomainFlag] = useState<boolean>(false)  // 业务前台系统域名https展示状态的控制
  const [formalFlag, setFormalFlag] = useState<boolean>(false)  // 正式环境域名https 展示状态的控制
  const [sandBoxFlag, setSandBoxFlag] = useState<boolean>(false)  // 沙箱环境系统域名https展示状态的控制
  const [sanboxTableData, setSanboxTableData] = useState<any>([])
  const formalRef = useRef<any>() // 正式环境https 的表单
  const sanboxRef = useRef<any>() // 沙箱环境的表单     
  const domainRef = useRef<any>() // 业务前台的表单
  const [formalInput, setFormalInput] = useState<boolean>(false) // 正式环境input 的状态
  const [domainInput, setDomainInput] = useState<boolean>(false) // 业务域名环境input 的状态
  const [sanboxInput, setSanboxInput] = useState<boolean>(false) // 沙箱环境input 的状态
  const [participantsValue, setParticipantsValue] = useState<any>([]) // 沙箱环境input 的状态
  const [domainExist, setDomainExist] = useState<any>({ domain: '', formalRootDomain: '', sandboxRootDomain: '' }) // 域名绑定的值
  const { domain: domainRootExist, formalRootDomain, sandboxRootDomain: sanboxRootDomainExist } = domainExist
  const [formalLoading, setFormalLoading] = useState<boolean>(false) // 正式环境input 的状态
  const [domainLoading, setDomainLoading] = useState<boolean>(false) // 业务域名环境input 的状态
  const [sanboxLoading, setSanboxLoading] = useState<boolean>(false) // 沙箱环境input 的状态
  const [formalDomainId, setFormalDoaminId] = useState<string>('')
  const [formStatus, setFormStatus] = useState<any>({ domainStatus: '', formalStatus: '', sanboxStatus: '' })
  const { domainStatus, formalStatus, sanboxStatus } = formStatus
  /** 转发ref方法 */
  useImperativeHandle(
    ref,
    (): RefMethods => ({
      getBasicInfo: handlGetBasicInfo,
    }),
  )

  /** 编辑数据时回显 */
  useEffect(() => {
    const { editId } = getPageQuery()
    if (editId && editData) {
      if (Object.keys(editData).length === 0) return;
      editInit(editData) // 编辑数据初始化
      setIconPath(titleImage)
    } else {
      form.resetFields()
      setIconPath(defaultIconPath)
      setFieldExist({ ...fieldExist, name: '', domain: '' })
      onChangeName({ target: { value: '' } })
      form.setFieldsValue({
        ...fieldExist
      })
    }
    setCustomMenu(menuType === 'CUSTOM')
    setSelectMenus(appMenuIds || [])
  }, [editData])

  /** 选中自定义应用菜单时请求菜单数据 */
  useEffect(() => {
    if (customMenu) handleFetchMenus()
  }, [customMenu])
  const splitString = (values) => {
    if (!!!values) return '';
    return values.indexOf('*') === 0 ? values.substring(values.indexOf('.') + 1, values.length) : values
  }
  // 编辑的时候数据初始化
  const editInit = editData => {
    const { domain, formalDomainId, formalDomain, forceSandboxDomainHttpsFlag, sandboxRootDomain, sandboxDomainCertificate, forceDomainHttpsFlag, domainCertificate, noticeUserParticipantDetail } = editData
    setFormalDoaminId(formalDomainId)
    setDomainExist({
      domain: domain || '',
      formalRootDomain: formalDomain?.formalRootDomain ? splitString(formalDomain.formalRootDomain) : '',
      sandboxRootDomain: sandboxRootDomain ? splitString(sandboxRootDomain) : '',
    })
    form.setFieldsValue({
      ...editData,
      sandboxRootDomain: sandboxRootDomain ? splitString(sandboxRootDomain) : '',
      domainType: sandboxRootDomain && formalDomain?.formalRootDomain ? 'AGENT' : 'REDIRECT',
      formalRootDomain: formalDomain?.formalRootDomain ? splitString(formalDomain.formalRootDomain) : ''
    })
    setParticipantsValue([{
      participantDatas: noticeUserParticipantDetail ? [...noticeUserParticipantDetail] : [],
      participantType: "USER",
      processNodeDefId: null
    }])
    setFieldExist({ ...fieldExist, domainType: sandboxRootDomain && formalDomain?.formalRootDomain ? 'AGENT' : 'REDIRECT' }) // 更改应用域名勾选
    formalDomain && setFormalDataSource({ ...formalDomain })  // 渲染正式环境 域名解析出来的表格
    setFormalFlag(!!formalDomain)
    setFormalInput(!!formalDomain)
    setFormalCertificate({
      httpFlag: !!formalDomain?.formalDomainCertificate?.certificateName || '',
      domainName: formalDomain?.formalDomainCertificate?.certificateName || '',
      certificate: formalDomain?.formalDomainCertificate?.domain || '',
      id: formalDomain?.formalDomainCertificateId || '', // 域名证书的id
      certificateDate: formalDomain?.formalDomainCertificate?.startTime + ' ~ ' + formalDomain?.formalDomainCertificate?.endTime,
      httpVisit: formalDomain?.forceFormalDomainHttpsFlag
    })
    setSanboxInput(!!sandboxDomainCertificate || !!sandboxRootDomain)
    setSandBoxFlag(!!sandboxDomainCertificate || !!sandboxRootDomain)
    setSanboxCertificate({
      httpFlag: !!sandboxDomainCertificate?.certificateName,
      domainName: sandboxDomainCertificate?.certificateName || '',  // 证书名称 没有测试成功    因为正式环境域名无法测试
      certificate: sandboxDomainCertificate?.domain || '',  // 沙箱环境根域名
      id: sandboxDomainCertificate?.id || '', // 域名证书的id
      certificateDate: sandboxDomainCertificate?.startTime + ' ~ ' + sandboxDomainCertificate?.endTime,
      httpVisit: forceSandboxDomainHttpsFlag
    })
    if (!!sandboxDomainCertificate?.certificateName || !!sandboxRootDomain) {
      const sanboxDomain = sandboxRootDomain ? splitString(sandboxRootDomain) : ''
      const sanboxData = cloneDeep(sanboxSourceData)
      setSanboxTableData(sanboxData.map(item => { return { ...item, example: item.example + '.' + sanboxDomain } }))
    }
    setDomainInput(!!domain)
    setDomainFlag(!!domain)
    setDomainCertificate({
      httpFlag: !!domainCertificate?.certificateName,
      domainName: domainCertificate?.certificateName || '',
      certificate: domainCertificate?.domain || '',
      id: domainCertificate?.id || '', // 域名证书的id
      certificateDate: domainCertificate?.startTime + ' ~ ' + domainCertificate?.endTime,
      httpVisit: forceDomainHttpsFlag
    })
  }

  /** 请求菜单树数据 */
  const handleFetchMenus = async () => {
    setFetchMenuLoading(true)
    const res = await API.eadmin.appEntry.menuTree({ id: editId })
    setFetchMenuLoading(false)
    if (!is200(res)) return
    const { data } = res
    data.forEach(item => {
      item.children = item.menuTree
    })
    setMenuData(data)
  }

  /** 上传icon完成 */
  const handleUploadDone = data => {
    const res = data.file.response
    if (is200(res)) setIconPath(res.data.filePath)
  }

  /** 判断上传文件是否符合标准 */
  const handleUploadBefore = file => {
    const { name, size } = file
    const isLt4M = size / 1024 / 1024 < 4
    const splitName = name.split('.')

    if (!isLt4M) {
      message.error('图片大小不能超过4M')
      return false
    }
    setIconExt(splitName[splitName.length - 1])
    return true
  }

  /** 验证应用入口名称和域名是否被使用 */
  const handleVerifyField = key => {
    const field = form.getFieldsValue()[key]; // 获取绑定的value 值  key: 代表绑定值的key
    const oldField = editData[key]

    if (!field || field === oldField) return
    API.eadmin.appEntry.check({ [key]: field }).then(res => {
      if (!is200(res)) return

      const { isLegal } = res.data
      setFieldExist({ ...fieldExist, [key]: !isLegal })
    })
  }
  /** 获取基本配置信息 */
  const handlGetBasicInfo = () => {
    return new Promise<any>(resolve => {
      form?.validateFields().then(async values => {
        checkForm()
        const { domainType } = values
        const { domainStatus, formalStatus, sanboxStatus } = formStatus
        if (domainType === 'REDIRECT' && domainStatus?.length > 0) {
          return;
        }
        if (domainType === 'AGENT' && (formalStatus?.length > 0 || sanboxStatus?.length > 0)) {
          return
        }
        if (domainType === 'AGENT') {
          if (sanboxCertificate?.httpVisit) {
            if (!sanboxCertificate?.id) {
              HkMessage.error('请完成证书的上传')
              return;
            }
          }
          if (formalCertificate?.httpVisit) {
            if (!formalCertificate?.id) {
              HkMessage.error('请完成证书的上传')
              return;
            }
          }
        } else {
          if (domainCertificate?.httpVisit) {
            if (!domainCertificate?.id) {
              HkMessage.error('请完成证书的上传')
              return;
            }
          }
        }
        // if (nameExist || menuTypeExist) return
        let formFlag = true; // 检验是否有表单的值没有填写
        if (domainType === 'REDIRECT' && domainFlag && domainCertificate?.httpFlag && formFlag) {
          await domainRef?.current?.validateForm().then(data => {
            formFlag = Object.keys(data).length > 0 ? true : false
          })
        }
        if (domainType === 'AGENT' && formalFlag && formalCertificate?.httpFlag && formFlag) {
          await formalRef?.current?.validateForm().then(data => {
            formFlag = Object.keys(data).length > 0 ? true : false
          })
        }
        if (domainType === 'AGENT' && sandBoxFlag && sanboxCertificate?.httpFlag && formFlag) {
          await sanboxRef?.current?.validateForm().then(data => {
            formFlag = Object.keys(data).length > 0 ? true : false
          })
        }
        if (!formFlag) return;
        const { noticeUserIds } = values
        const { formalRootDomain, sandboxRootDomain } = domainExist
        const domainLength = sandboxRootDomain?.length - formalRootDomain?.length
        if (domainLength === 0 && sandboxRootDomain) {
          HkMessage.error('正式环境应用根域名和沙箱环境应用根域名相同')
          return;
        }
        if ((domainLength > 0 && sandboxRootDomain.lastIndexOf(formalRootDomain) != domainLength) || domainLength < 0) {
          HkMessage.error(`沙箱环境域名必须以正式环境根域名${formalRootDomain}为结尾`)
          return;
        }
        resolve({
          ...values,
          ...domainExist,
          titleImage: iconPath,
          domainCertificateId: domainCertificate?.id,
          forceDomainHttpsFlag: domainCertificate.httpFlag ? domainCertificate?.httpVisit : '',
          forceSandboxDomainHttpsFlag: sanboxCertificate?.httpFlag ? sanboxCertificate?.httpVisit : '',
          sandboxDomainCertificateId: sanboxCertificate?.id,
          formalDomain: {
            formalChildDomain: {
              ...formalDataSource?.formalChildDomain,
            },
            forceFormalDomainHttpsFlag: formalCertificate?.httpFlag ? formalCertificate?.httpVisit : '',
            formalDomainCertificateId: formalCertificate?.id,
            formalRootDomain: formalRootDomain ? '*.' + formalRootDomain : '',
            id: formalDomainId || '',
          },
          sandboxRootDomain: sandboxRootDomain ? '*.' + sandboxRootDomain : '',
          appMenuIds: selectMenus,
          menuType: customMenu ? 'CUSTOM' : 'DEFAULT',
          menuOrder: menuData.map(item => item.tenantId),
          noticeUserIds: noticeUserIds.filter(item => item.participantType === 'USER')[0]?.participantDatas?.map(e => e.id)
        })
      }).catch(error => {
        checkForm()
      })
    })
  }
  const checkForm = () => {
    const { domain, formalRootDomain, sandboxRootDomain } = domainExist;
    if (domainType === 'AGENT') {
      setFormStatus({ ...domainStatus, formalStatus: !!formalRootDomain ? '' : 'error', sanboxStatus: !!sandboxRootDomain ? '' : 'error' })
    }
    if (domainType === 'REDIRECT') {
      setFormStatus({ ...domainStatus, domainStatus: !!domain ? '' : 'error' })
    }
  }

  /** 设置已选中的菜单数据 */
  const handleChangeSelectMenus = (tenantId, checkMenu) => {
    const { menuIds } = checkMenu
    const findMenuIndex = selectMenus.findIndex(item => item.tenantId === tenantId)

    if (findMenuIndex === -1) {
      selectMenus.push({ tenantId, menuIds })
    } else {
      selectMenus[findMenuIndex] = { tenantId, menuIds }
    }

    setSelectMenus([...selectMenus])
  }

  /** 拖拽菜单排序结束 */
  const handleDragMenu = (result: DropResult) => {
    const { destination, source } = result
    if (!destination) return
    const [endIndex, startIndex] = [destination.index, source.index]
    const handleItem = menuData[startIndex]

    menuData.splice(startIndex, 1)
    menuData.splice(endIndex, 0, handleItem)
    setMenuData(menuData)
  }

  /** 渲染基础信息表单内容 */
  const renderBasicInfo = () => (
    <div className="basic-info">
      <Item
        label="应用入口名称"
        name="name"
        rules={[{ required: true, message: '请输入应用入口名称' }]}
        validateStatus={nameExist ? 'error' : undefined}
        help={nameExist ? '已存在同名应用入口，请换一个名称' : null}
      >
        <Input
          placeholder="请输入应用入口名称"
          onChange={onChangeName}
          style={{ width: 300 }}
          onBlur={() => handleVerifyField('name')}
        />
      </Item>
      <Item label="网页标题" className="page-title" extra={'设置浏览器标签页中显示页面的图标和标题'}>
        <Upload
          className="upload-icon"
          showUploadList={false}
          name="file"
          action="api/io/file/uploadFile"
          multiple={false}
          accept="image/jpg,image/jpeg,image/png,image/bmp"
          data={{ fileExt: iconExt, standardCollectionId: '82' }}
          onChange={handleUploadDone}
          beforeUpload={handleUploadBefore}
        >
          <img src={iconPath} />

        </Upload>
        <span className="ellipsis"></span>
        <Item name="title">
          <Input placeholder="请输入网页标题" style={{ width: 228 }} />
        </Item>
      </Item>
      <Item
        label="应用菜单范围："
        className="menu-range"
        name="menuType"
        initialValue="2"
        extra={'设置当前应用入口下【业务前台系统】的可见菜单范围'}
      >
        <Radio.Group >
          {
            menuRange.map(item => (
              <Radio value={item.value} >{item.name}</Radio>
            ))
          }
        </Radio.Group>
      </Item>
      <Item
        label="管理员："
        className="menu-range"
        name="noticeUserIds"
        rules={[{ required: true, message: '请选择管理员' }]}
        extra={'当前应用入口如出现配置问题、域名过期、证书过期等情况，将通知该管理员'}
      >
        <Selector
          allowClear
          tabs={[{ type: 'user', title: '用户', route: 'table' }]}
          width="300px"
          title="管理员"
          showTag
          onlyDefaultOrgSystemFlag={true}
          participants={participantsValue}
          participantModelType="AUDIT"
          sourceFrom="FlowTurn"
          placeholder="请选择管理员"
        />
      </Item>
    </div>
  )

  /** 渲染高级配置 */
  const renderHighConfig = () => {
    return (
      <div className="high-config">
        <div className="open-high-config">
          <Checkbox checked={customMenu} onChange={e => setCustomMenu(e.target.checked)}>
            自定义应用菜单
            <span className="hint">(用户可自行选择有权限的菜单在前台展示，不勾选默认显示全部)</span>
          </Checkbox>
        </div>
        <Spin spinning={fetchMenuLoading} />
        {customMenu ? (
          <DragDropContext onDragEnd={handleDragMenu}>
            <Droppable droppableId="menu-list" direction="vertical">
              {provided => (
                <ul ref={provided.innerRef} className="menu-list">
                  {menuData.map((menuItem, menuIndex) => {
                    const { tenantId } = menuItem
                    const { menuIds } =
                      selectMenus.find(item => item.tenantId === tenantId) || {}

                    return (
                      <Draggable key={tenantId} draggableId={tenantId} index={menuIndex}>
                        {(provided, dragState) => {
                          const { innerRef, draggableProps, dragHandleProps } = provided
                          const { isDragging } = dragState

                          return (
                            <li
                              ref={innerRef}
                              key={tenantId}
                              className={isDragging ? 'menu-dragging' : ''}
                              {...draggableProps}
                              {...dragHandleProps}
                            >
                              <MenuTree
                                defaultExpandAll={!menuIndex}
                                selectMenus={{ menuIds }}
                                data={[menuItem]}
                                onChange={checkMenu => handleChangeSelectMenus(tenantId, checkMenu)}
                              />
                            </li>
                          )
                        }}
                      </Draggable>
                    )
                  })}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        ) : null}
      </div>
    )
  }
  // 入口域名跳转渲染内容
  const enterDomainRender = () => {
    const { domain } = editData
    const dommainCancel = domain || (domainCertificate?.certificate || '')
    return (
      <div className="antd-enter-domain-wrapper">
        <Item>
          <Space>
            <Item
              label="业务前台系统域名："
              validateStatus={domainStatus}
              help={domainStatus ? '请输入务前台系统域名' : ''}
              required
              className={`${domainStatus ? '' : 'form-no-item-explain'}`}
              style={{ marginBottom: 0 }}
              extra={domainInput ? '域名解析验证成功' : '请输入域名，并域名解析添加CNAME记录，指向 cname.clickpaas.com'}
            >
              <Input
                value={domainRootExist}
                disabled={domainInput}
                onBlur={checkForm}
                className="antd-basic-input"
                onChange={e => handleChangeDomainInput(e.target.value, 'domain')}
                placeholder="例：app.mydomain.com" />
              {
                domainInput ? (
                  <span>
                    <Button type="link" style={{ marginRight: 15, paddingRight: 0 }} onClick={() => handheChangeDomain('domain')}>修改域名</Button>
                    <Space style={{ marginRight: 15 }}><Link href={domainRootExist} target="_blank">访问域名</Link></Space>
                  </span>
                ) : (
                  <span>
                    <Button type="link" loading={domainLoading} disabled={domainLoading} style={{ marginRight: 15, paddingRight: 0 }} onClick={() => handleFormalDnsCheck('domain')}>DNS解析验证</Button>
                    {
                      dommainCancel && <Button type="link" style={{ paddingLeft: 0 }} onClick={() => handleCancelDnsCheck('domain')}>取消修改</Button>
                    }
                  </span>
                )
              }
            </Item>
          </Space>
        </Item>
        {
          domainFlag &&
          <OpenHttpRender
            modules={'REDIRECT'}
            domain={domainRootExist}
            ref={domainRef}
            propsForm={form}
            updateData={value => setDomainCertificate({ ...value })}
            uploadSllCertificate={handleUploadHttpsCertificate}
            editData={domainCertificate}
          ></OpenHttpRender>
        }
      </div >
    )
  }

  const handleUploadHttpsCertificate = value => {
    return new Promise<any>(resolve => {
      API.eadmin.appEntry.uploadHttpsCertificate(value).then(res => {
        if (!is200(res)) return resolve(false);
        if (!res.data) return resolve(false);
        const { domainDetailType, startTime, endTime, domain, certificateName, id } = res.data
        const domainObj = {
          domainName: certificateName,
          certificate: domain,
          id,
          certificateDate: startTime + ' ~ ' + endTime
        }
        if (domainDetailType === 'REDIRECT') {
          setDomainCertificate(item => {
            return { ...item, ...domainObj }
          })
        }
        if (domainDetailType === 'AGENT_FORMAL') {
          setFormalCertificate(item => {
            return { ...item, ...domainObj }
          })
        }
        if (domainDetailType === 'AGENT_SANDBOX') {
          setSanboxCertificate(item => {
            return { ...item, ...domainObj }
          })
        }
        return resolve(true)
      })
    })
  }

  const handleFormalDnsCheck = key => {
    const formalRootDomain = domainExist[key]; // 获取绑定的value 值  key: 代表绑定值的key
    const { editData: { deviceType: deviceType } } = props; // 获取设备类型
    if (!formalRootDomain) {
      HkMessage.error('请输入要解析的域名')
      return;
    }
    key === 'domain' && setDomainLoading(true)
    key === 'sandboxRootDomain' && setSanboxLoading(true)
    key === 'formalRootDomain' && setFormalLoading(true)
    API.eadmin.appEntry.dnsCheck({ domain: key === 'domain' ? formalRootDomain : '*.' + formalRootDomain, deviceType: deviceType, domainDetailType: key === 'formalRootDomain' ? 'AGENT_FORMAL' : key === 'domain' ? 'REDIRECT' : 'AGENT_SANDBOX' }).then(res => {
      if (!is200(res)) return
      const { checkFlag, formalDomain } = res.data
      checkFlag ? HkMessage.success('域名解析成功') : HkMessage.error('域名解析失败')
      if (key === 'domain') {
        setDomainFlag(checkFlag)
        setDomainInput(checkFlag)
        setDomainLoading(false)
        setDomainCertificate({
          httpFlag: !!formalDomain?.certificateName,
          domainName: formalDomain?.certificateName || '',
          certificate: formalDomain?.domain || '',
          id: formalDomain?.id || '', // 域名证书的id
          certificateDate: formalDomain?.startTime + ' ~ ' + domainCertificate?.endTime,
          httpVisit: !!formalDomain?.forceDomainHttpsFlag
        })
      }
      if (key === 'sandboxRootDomain') {
        setSandBoxFlag(checkFlag)
        setSanboxInput(checkFlag)
        setSanboxLoading(false)
        const sanboxData = cloneDeep(sanboxSourceData)
        checkFlag && setSanboxTableData(sanboxData.map(item => { return { ...item, example: item.example + '.' + formalRootDomain } }))
        setSanboxCertificate({
          httpFlag: !!formalDomain?.certificateName,
          domainName: formalDomain?.certificateName || '',   // 证书名称 没有测试成功    因为正式环境域名无法测试
          certificate: formalDomain?.domain || '',  // 沙箱环境根域名
          id: formalDomain?.id || '', // 域名证书的id
          certificateDate: formalDomain?.startTime + ' ~ ' + domainCertificate?.endTime,
          httpVisit: !!formalDomain?.forceDomainHttpsFlag
        })
      }
      if (key != 'formalRootDomain') return
      setFormalFlag(checkFlag)
      setFormalInput(checkFlag)
      setFormalLoading(false)
      checkFlag && setFormalDataSource(!formalDomain ? {} : { ...formalDomain })
      setFormalCertificate({
        httpFlag: !!formalDomain?.certificateName || '',
        domainName: formalDomain?.certificateName || '',   // 证书名称 没有测试成功    因为正式环境域名无法测试
        certificate: formalDomain?.domain || '',  // 沙箱环境根域名
        id: formalDomain?.id || '', // 域名证书的id
        certificateDate: formalDomain?.startTime + ' ~ ' + domainCertificate?.endTime,
        httpVisit: !!formalDomain?.forceDomainHttpsFlag || false
      })
    })
  }
  // 修改输入框内的域名
  const handleChangeDomainInput = (value, key) => {
    if (key === 'domain') {
      setDomainInput(false)
      setDomainExist({
        ...domainExist,
        domain: value
      })
    }
    if (key === 'formalRootDomain') {
      setFormalInput(false)
      setDomainExist({
        ...domainExist,
        formalRootDomain: value
      })
    }
    if (key === 'sandboxRootDomain') {
      setSanboxInput(false)
      setDomainExist({
        ...domainExist,
        sandboxRootDomain: value
      })
    }
    checkForm()
  }
  // 点击修改域名   
  const handheChangeDomain = key => {
    if (key === 'domain') {
      setDomainFlag(false)
      setDomainInput(false)
    }
    if (key === 'formalRootDomain') {
      setFormalFlag(false)
      setFormalInput(false)
    }
    if (key === 'sandboxRootDomain') {
      setSandBoxFlag(false)
      setSanboxInput(false)
    }
  }
  // 取消DNS 解析
  const handleCancelDnsCheck = (key) => {
    const { domain, formalDomain, sandboxRootDomain } = editData
    if (key === 'domain') {
      setDomainInput(true)
      setDomainLoading(false)
      setDomainFlag(true)
      setDomainExist({
        ...domainExist,
        domain: domain || (domainCertificate?.certificate || '')
      })
    }
    if (key === 'formalRootDomain') {
      setFormalLoading(false)
      setFormalFlag(true)
      setFormalInput(true)
      setDomainExist({
        ...domainExist,
        formalRootDomain: (formalDataSource?.formalRootDomain ? splitString(formalDataSource.formalRootDomain) : '') || (formalDomain?.formalRootDomain ? splitString(formalDomain.formalRootDomain) : '') || (formalCertificate?.certificate || '')
      })
    }
    if (key === 'sandboxRootDomain') {
      let sanboxDomain = ''
      if (sanboxTableData.length > 0) {
        let example = sanboxTableData[0].example;
        sanboxDomain = example.substring(example.indexOf('.') + 1, example.length)
      }
      setSanboxLoading(false)
      setSandBoxFlag(true)
      setSanboxInput(true)
      setDomainExist({
        ...domainExist,
        sandboxRootDomain: sanboxDomain || (sandboxRootDomain ? splitString(sandboxRootDomain) : '') || (sanboxCertificate?.certificate || '')
      })
    }
    checkForm()
  }
  // 全站域名替换显示内容
  const domainReplaceRender = () => {

    const { formalDomain, sandboxRootDomain } = editData
    const formalCancel = (formalDataSource?.formalRootDomain ? splitString(formalDataSource.formalRootDomain) : '') || (formalDomain?.formalRootDomain ? splitString(formalDomain.formalRootDomain) : '') || (formalCertificate?.certificate || '')
    let sanboxDomain = ''
    if (sanboxTableData.length > 0) {
      let example = sanboxTableData[0].example;
      sanboxDomain = example.substring(example.indexOf('.') + 1, example.length)
    }
    const sandboxCancel = sanboxDomain || (sandboxRootDomain ? splitString(sandboxRootDomain) : '') || (sanboxCertificate?.certificate || '')
    return (
      <div className="all-domain-replace-wrapper">
        <Item
          label="正式环境应用根域名："
          required
          className={`${formalStatus ? '' : 'form-no-item-explain'}`}
          validateStatus={formalStatus}
          help={formalStatus?.length > 0 ? '请输入正式环境应用根域名' : ''}
          extra={formalInput ? '域名解析验证成功，请指定以下站点域名' : '请输入域名，并域名解析添加CNAME记录，指向 cname.clickpaas.com'}
        >

          <Input
            placeholder="例：app.mydomain.com"
            addonBefore="*."
            value={formalRootDomain}
            onBlur={checkForm}
            className="antd-basic-input"
            disabled={formalInput}
            onChange={e => handleChangeDomainInput(e.target.value, 'formalRootDomain')}
          />
          {
            formalInput ? (<span>
              <Button type="link" onClick={() => handheChangeDomain('formalRootDomain')}>修改域名</Button>
            </span>) : <span>
              <Button disabled={formalLoading} loading={formalLoading} type="link" style={{ marginRight: 15, paddingRight: 0 }} onClick={() => handleFormalDnsCheck('formalRootDomain')}>DNS解析验证</Button>
              {
                formalCancel && <Button type="link" style={{ paddingLeft: 0 }} onClick={() => handleCancelDnsCheck('formalRootDomain')}>取消修改</Button>}
            </span>
          }
        </Item>
        {/* 正式环境应用根域名 解析产生的内容 */}
        <div className="antd-prod-analysis-wrapper" >
          {(formalCertificate?.id || Object.keys(formalDataSource).length > 0) && formalFlag && <DomainTable updateSource={value => setFormalDataSource({ ...value })} source={formalDataSource} />}
          {
            formalFlag &&
            <OpenHttpRender
              modules={'AGENT_FORMAL'}
              domain={formalRootDomain}
              propsForm={form}
              ref={formalRef}
              updateData={values => setFormalCertificate({ ...values })}
              uploadSllCertificate={handleUploadHttpsCertificate}
              editData={formalCertificate}
            ></OpenHttpRender>
          }
        </div>
        <Item
          label="沙箱环境应用根域名："
          required
          validateStatus={sanboxStatus}
          help={sanboxStatus ? '请输入沙箱环境应用根域名' : ''}
          className={`${sanboxStatus ? '' : 'form-no-item-explain'}`}
          extra={sanboxInput ? '域名解析验证成功，请指定以下站点域名' : '请输入域名，并域名解析添加CNAME记录，指向 cname.clickpaas.com'}
        >
          <Input
            placeholder="例：app.mydomain.com"
            addonBefore="*."
            disabled={sanboxInput}
            onBlur={checkForm}
            value={sanboxRootDomainExist}
            className="antd-basic-input"
            onChange={e => handleChangeDomainInput(e.target.value, 'sandboxRootDomain')}
          />
          {
            sanboxInput ? <span>
              <Button type="link" onClick={() => handheChangeDomain('sandboxRootDomain')}>修改域名</Button>
            </span> : <span>
              <Button loading={sanboxLoading} disabled={sanboxLoading} type="link" style={{ marginRight: 15, paddingRight: 0 }} onClick={() => handleFormalDnsCheck('sandboxRootDomain')} >DNS解析验证</Button>
              {
                sandboxCancel && <Button type="link" style={{ paddingLeft: 0 }} onClick={() => handleCancelDnsCheck('sandboxRootDomain')}>取消修改</Button>
              }
            </span>
          }
        </Item>
        {
          sandBoxFlag &&
          <OpenHttpRender
            modules={'AGENT_SANDBOX'}
            domain={sandboxRootDomain}
            propsForm={form}
            ref={sanboxRef}
            updateData={values => setSanboxCertificate({ ...values })}
            uploadSllCertificate={handleUploadHttpsCertificate}
            editData={sanboxCertificate}
          ></OpenHttpRender>
        }

        {sandBoxFlag && <span className="sandbox-tip-hint"> <HekitUiIcon lib={LIB.WEBICONS} type="jinggaotishi" style={{ fontSize: 14, marginRight: 4 }} />示例：开通沙箱A，域名前缀为 “demo1”</span>}
        {sandBoxFlag && sanboxTable()}
      </div>
    )
  }
  const sanboxTable = () => {
    return (
      <div className="antd-prod-domain-wrapper" style={{ marginBottom: 10 }}>
        <Table
          columns={sanboxColumn}
          size="small"
          rowClassName="antd-sanbox-table-row-wrapper"
          dataSource={sanboxTableData}
          pagination={false}
        />
      </div>
    )
  }
  const handleChangeDomainType = value => {
    setFieldExist({ ...fieldExist, domainType: value })
    setFormStatus({
      domainStatus: '',
      formalStatus: '',
      sanboxStatus: ''
    })
  }
  const renderHighDomain = () => {
    return (
      <div className="high-domain-wrapper">
        <Item
          label="应用域名类型："  
          className="app-domain-type"
          name="domainType"
          extra={'仅自定义【业务前台系统】域名，通过访问自定义域名可访问对应域名站点'}
        >
          <Radio.Group onChange={e => handleChangeDomainType(e.target.value)}>
            {
              domainTypeList.map(item => (
                <Radio value={item.value}>{item.name}</Radio>
              ))
            }
          </Radio.Group>
        </Item>
        {domainType == 'REDIRECT' ?
          enterDomainRender() : domainReplaceRender()
        }
      </div>
    )
  }
  return (
    <Form className={clsPrefix} form={form} initialValues={editData}>
      <Collapse defaultActiveKey={['basicInfo', 'highConfig', 'highDomain']} ghost>
        <Panel header="基本信息" key="basicInfo">
          {renderBasicInfo()}
        </Panel>
        <Panel header="高级配置" key="highConfig">
          {renderHighConfig()}
        </Panel>
        <Panel header="应用域名" key="highDomain" className="antd-high-domain-wrapper">
          {renderHighDomain()}
        </Panel>
      </Collapse>
    </Form>
  )
})

export default React.memo(AppEntryConfigBasicInfo)

