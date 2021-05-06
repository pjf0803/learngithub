/* eslint-disable react-hooks/rules-of-hooks */
import React, { useMemo } from 'react'
import { connect } from 'dva'
// import { Form } from 'antd'
import {
  HkRow as Row, HkSelect as Select, HkButton as Button,
  HkTabs as Tabs, HkTree as Tree, HkSpin as Spin,
  HkTable as Table, HkEmpty as Empty, HkModal as Modal, HkForm as Form
} from '@hekit/hekit-ui'
import { HekitUiIcon, LIB } from '@hekit/hekit-icon'
import theme from '@hekit/hekit-style'
import { get, isEmpty } from 'lodash'

import ObjectIcon from '@/pages/ObjectManager/Object/Components/ObjectIcon'
import { useCls } from '../../utils'
import fm from '../../fm'

import './index.less'

// const { Item: FormItem } = Form
// const FormItem = Form.Item
const { TabPane } = Tabs
const { TreeNode } = Tree
const { Content, Body, Footer } = Modal

interface Props {
  /** 弹框显隐 */
  visible: boolean
  /** 弹框标题 */
  type: string
  /** 取消 */
  onCancel: any
  /** 确定 */
  onOk: any
  form: any
  userPermissionGroup: any
  loading: any
  dispatch: any
}

const cls = useCls('user-permission-group-modal')

const UserPermissionModal = (props: Props) => {
  // 初始化表格
  const [form] = Form.useForm();
  // 替换表格变量
  const FormItem = Form.Item
  const {
    visible,
    type,
    onCancel,
    onOk,
    // form: { getFieldDecorator, getFieldValue, validateFields },
    userPermissionGroup: { viewData, permissionGroupDetail },
    loading,
    dispatch,
  } = props

  const { adminUser, permissionGroupMinis } = viewData || {}
  const { id, name, mobilePhone, email } = adminUser || {}

  const isView = type === 'VIEW'
  const { hasFunctions, hasRoles, hasShareGroups, hasSpecialCase } = useMemo(() => {
    const {
      mainFunctionId,
      menuList,
      viewPermissions,
      buttons,
      roles,
      shareGroups,
      specialCase,
    } = permissionGroupDetail

    return {
      hasFunctions:
        mainFunctionId ||
        (menuList && menuList.length) ||
        (viewPermissions && viewPermissions.length) ||
        (buttons && buttons.length),
      hasRoles: roles && roles.length,
      hasShareGroups: shareGroups && shareGroups.length,
      hasSpecialCase: specialCase && specialCase.length,
    }
  }, [permissionGroupDetail])
  // 权限组改变
  const handleAuthTeamIdChange = authTeamId => {
    dispatch({
      type: 'userPermissionGroup/fetchPermissionGroupDetail',
      payload: authTeamId,
    })
  }

  // 渲染职能Tab
  const renderFunctions = () => {
    const {
      mainFunctionId,
      functions,
      functionIds,
      menuList,
      viewPermissions,
      buttons,
    } = permissionGroupDetail

    // 职能显示
    const Span = useMemo(
      () =>
        ((mainFunctionId && [mainFunctionId]) || [])
          .concat((functionIds || []).filter(v => v !== mainFunctionId))
          .map(funcitonId => {
            const s = functions.find(v => v.id === funcitonId)

            if (s) {
              return (
                <span className={cls('permission-functions-span')}>
                  {s.name}
                  {mainFunctionId === funcitonId && (
                    <span className={cls('span-main')}>{fm('roles.mianFunction', '主职能')}</span>
                  )}
                </span>
              )
            }

            return null
          }),
      [functions, functionIds, mainFunctionId],
    )

    const loopTreeData = (list, opt) => {
      const { renderIcon = () => null, renderTitle, childrenKey = 'children' } = opt
      if (!(Array.isArray(list) && list.length)) return null

      const treeNodes = []

      list.forEach(v => {
        const { id: key } = v

        if (v[childrenKey] && v[childrenKey].length) {
          treeNodes.push(
            <TreeNode key={key} title={renderTitle(v)} icon={renderIcon(v)}>
              {loopTreeData(v[childrenKey], opt)}
            </TreeNode>,
          )
        } else {
          treeNodes.push(<TreeNode key={key} title={renderTitle(v)} icon={renderIcon(v)} />)
        }
      })

      return treeNodes
    }

    const isCatalogue = menu => menu.menuType === 'catalogue'

    // 菜单
    const MenuTreeNodes = useMemo(
      () =>
        loopTreeData(menuList, {
          renderTitle: o => <span title={get(o, 'name')}>{get(o, 'name')}</span>,
          renderIcon: o =>
            isCatalogue(o) ? (
              <HekitUiIcon lib={LIB.ANTD3}
                type="folder"
                theme="filled"
                style={{
                  color: '#FFCA28',
                  fontSize: 20,
                  marginTop: 2,
                  marginRight: 8,
                }}
              />
            ) : (
              <ObjectIcon
                style={{
                  width: 20,
                  height: 20,
                  lineHeight: 20,
                  textAlign: 'center',
                  borderRadius: 2,
                  fontSize: 14,
                  marginTop: 2,
                  marginRight: 8,
                }}
                value={
                  get(o, 'icon') || {
                    icon: 'file',
                    type: 'svg',
                    color: '#40A9FF',
                  }
                }
                disabled
              />
            ),
        }),
      [menuList],
    )

    // 字段
    const FieldTreeNodes = useMemo(
      () =>
        loopTreeData(viewPermissions, {
          childrenKey: 'fieldsList',
          renderTitle: o => (
            <div className={cls('permission-functions-field')}>
              <div className={cls('field-name')} title={o.displayLabel}>
                {o.displayLabel}
              </div>
              {(o.isReadOnly || o.isUpdatable) && (
                <div className={cls('field-info')}>
                  {o.isReadOnly && (
                    <span className={cls('field-info-span')}>
                      {fm('roles.field.readonly', '只读')}
                    </span>
                  )}
                  {o.isUpdatable && (
                    <span className={cls('field-info-span')}>
                      {fm('roles.field.visible', '可见')}
                    </span>
                  )}
                </div>
              )}
            </div>
          ),
        }),
      [viewPermissions],
    )

    // 按钮
    const ButtonTreeNodes = useMemo(
      () =>
        loopTreeData(buttons, {
          renderTitle: o => {
            const locationNames = (o.locationNames || []).join('、')
            return (
              <div className={cls('permission-functions-button')}>
                <div className={cls('button-item')} title={o.name}>
                  {o.name}
                </div>
                {o.type === 'button' && (
                  <div className={cls(['button-item', 'button-info'])} title={locationNames}>
                    {locationNames}
                  </div>
                )}
              </div>
            )
          },
        }),
      [buttons],
    )

    if (!hasFunctions) return null

    return (
      <TabPane tab={fm('roles.function', '职能')} key="1">
        <div>{Span}</div>
        <div className={cls('permission-functions-list')}>
          <div className={cls('permission-functions-item')}>
            <div className={cls('permission-functions-title')}>{fm('roles.menu', '菜单')}</div>
            {!isEmpty(MenuTreeNodes) ? (
              <Tree showIcon blockNode selectable={false}>
                {MenuTreeNodes}
              </Tree>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
          <div className={cls('permission-functions-item')}>
            <div className={cls('permission-functions-title')}>{fm('roles.field', '字段')}</div>
            {!isEmpty(FieldTreeNodes) ? (
              <Tree blockNode selectable={false}>
                {FieldTreeNodes}
              </Tree>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
          <div className={cls('permission-functions-item')}>
            <div className={cls('permission-functions-title')}>{fm('roles.button', '按钮')}</div>
            {!isEmpty(ButtonTreeNodes) ? (
              <Tree blockNode selectable={false}>
                {ButtonTreeNodes}
              </Tree>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        </div>
      </TabPane>
    )
  }

  // 渲染角色Tab
  const renderRoles = () => {
    const { roles } = permissionGroupDetail
    const columns = [
      {
        title: fm('roles.lineNo', '行号'),
        dataIndex: 'lineNo',
        width: 30,
        render: (t, record, index) => index + 1,
      },
      {
        title: fm('roles.name', '角色名称'),
        dataIndex: 'name',
        ellipsis: true,
        width: 80,
      },
      {
        title: fm('roles.dataLevel', '权限层级'),
        dataIndex: 'dataLevel',
        ellipsis: true,
        width: 80,
        render: dataLevel => fm(`roles.dataLevel.${dataLevel}`),
      },
      {
        title: fm('roles.additionalDepartment', '兼管部门'),
        dataIndex: 'additionalDepartmentNames',
        ellipsis: true,
        width: 80,
        render: additionalDepartmentNames => additionalDepartmentNames || '-',
      },
      {
        title: fm('roles.description', '描述'),
        width: 80,
        ellipsis: true,
        dataIndex: 'description',
      },
    ]

    if (!hasRoles) return null

    return (
      <TabPane tab={fm('roles', '角色')} key="2">
        <Table
          className={cls('table')}
          size="middle"
          columns={columns}
          dataSource={roles}
          pagination={false}
        />
      </TabPane>
    )
  }

  // 渲染表格列 共享组-共享对象、特例组-特例对象
  const renderColumnObjectNames = objectNameMap => {
    if (objectNameMap) {
      const keys = Object.keys(objectNameMap)
      if (keys && keys.length) {
        return keys.map(k => objectNameMap[k]).join('、')
      }
    }

    return ''
  }

  // 渲染表格列 共享组-数据权限、特例组-条件设置
  const renderColumnShareCondition = (shareCondition, record) => {
    if (record.objectNameMap) {
      const keys = Object.keys(record.objectNameMap)
      if (keys && keys.length) {
        const arr = []

        keys.forEach(objectId => {
          const objectName = record.objectNameMap[objectId]
          const condition = record.shareCondition[objectId]

          if (objectName && condition && [1, 2].includes(condition.shareType)) {
            arr.push(
              `${objectName}:${condition.shareType === 1
                ? fm('specialCase.allData', '全部数据')
                : condition.translateCh
              }`,
            )
          }
        })

        return arr.join('、')
      }
    }

    return ''
  }

  // 渲染共享组Tab
  const renderShareGroups = () => {
    const { shareGroups } = permissionGroupDetail
    const columns = [
      {
        title: fm('roles.lineNo', '行号'),
        dataIndex: 'lineNo',
        width: 30,
        render: (t, record, index) => index + 1,
      },
      {
        title: fm('shareGroups.name', '共享组名称'),
        dataIndex: 'name',
        ellipsis: true,
        width: 80,
      },
      {
        title: fm('shareGroups.objectNames', '共享对象'),
        dataIndex: 'objectNameMap',
        ellipsis: true,
        width: 80,
        render: renderColumnObjectNames,
      },
      {
        title: fm('shareGroups.shareCondition', '数据权限'),
        dataIndex: 'shareCondition',
        ellipsis: true,
        width: 80,
        render: renderColumnShareCondition,
      },
      {
        title: fm('roles.description', '描述'),
        width: 80,
        ellipsis: true,
        dataIndex: 'description',
      },
    ]

    if (!hasShareGroups) return null

    return (
      <TabPane tab={fm('shareGroups', '共享组')} key="3">
        <Table
          className={cls('table')}
          size="middle"
          columns={columns}
          dataSource={shareGroups}
          pagination={false}
        />
      </TabPane>
    )
  }

  // 渲染特例组Tab
  const renderSpecialCase = () => {
    const { specialCase } = permissionGroupDetail
    const columns = [
      {
        title: fm('roles.lineNo', '行号'),
        dataIndex: 'lineNo',
        width: 30,
        render: (t, record, index) => index + 1,
      },
      {
        title: fm('specialCase.name', '特例组名称'),
        dataIndex: 'name',
        ellipsis: true,
        width: 80,
      },
      {
        title: fm('specialCase.objectNames', '特例对象'),
        dataIndex: 'objectNameMap',
        ellipsis: true,
        width: 80,
        render: renderColumnObjectNames,
      },
      {
        title: fm('specialCase.shareCondition', '条件设置'),
        dataIndex: 'shareCondition',
        ellipsis: true,
        width: 80,
        render: renderColumnShareCondition,
      },
      {
        title: fm('roles.description', '描述'),
        width: 80,
        ellipsis: true,
        dataIndex: 'description',
      },
    ]

    if (!hasSpecialCase) return null

    return (
      <TabPane tab={fm('specialCase', '特例组')} key="4">
        <Table
          className={cls('table')}
          size="middle"
          columns={columns}
          dataSource={specialCase}
          pagination={false}
        />
      </TabPane>
    )
  }

  // 保存按钮点击
  const handleSubmit = () => {
    validateFields((err, values) => {
      if (err) return
      const permission = permissionGroupMinis.find(_ => _.id === values.authTeamId)
      onOk({ authTeamId: permission.id, ...permission, id })
      // Modal.confirm({
      //   title: fm('modal.confirm.title', '保存修改'),
      //   okText: fm('modal.confirm.okText', '确认'),
      //   cancelText: fm('modal.confirm.cancelText', '取消'),
      //   onOk: () => {
      //     const permission = permissionGroupMinis.find(_ => _.id === values.authTeamId)
      //     onOk({ authTeamId: permission.id, ...permission, id })
      //   }
      // });
    })
  }

  return (
    <Modal
      visible={visible}
      title={isView ? fm('table.button.view', '查看') : fm('table.button.assign', '分配权限')}
      footer={null}
      destroyOnClose
      width={1000}
      onCancel={onCancel}
      minHeight="calc(100vh - 121px)"
      noPadding
      withFooter
    >
      <Content>
        <Body style={{ padding: 0 }}>
          <div className={cls()}>
            <div className={cls('info')}>
              <Form form={form}>
                <Row
                  type="flex"
                  justify="space-between"
                  style={{ marginBottom: theme['@margin-md'] }}
                >
                  <FormItem
                    label={fm('form.label.name', '真实姓名')}
                    className={name ? '' : cls('hidden')}
                  >
                    {name}
                  </FormItem>
                  <FormItem
                    label={fm('form.label.mobilePhone', '手机号')}
                    className={mobilePhone ? '' : cls('hidden')}
                  >
                    {mobilePhone}
                  </FormItem>
                  <FormItem
                    label={fm('form.label.email', '邮箱')}
                    className={email ? '' : cls('hidden')}
                  >
                    {email}
                  </FormItem>
                </Row>
                <Row type="flex" justify="space-between">
                  <FormItem
                    label={fm('form.label.authTeamId', '权限组')}
                    name="authTeamId"
                    initialValue={adminUser.authTeamId || undefined}
                    className={isView ? cls('select-disabled') : ''}
                    rules={isView
                      ? []
                      : [
                        {
                          message: fm('form.label.authTeamId.required.message', '请选择权限'),
                          required: true,
                        },
                      ]}
                  >
                    <Select
                      placeholder={fm('select.placeholder', '请选择')}
                      allowClear
                      style={{ width: 350 }}
                      disabled={isView}
                      onChange={handleAuthTeamIdChange}
                      showSearch
                      filterOption={(input, item) => (item.props.children as string).toLowerCase().includes(input.toLowerCase())}
                    >
                      {(permissionGroupMinis || []).map(v => (
                        <Select.Option key={v.id} title={v.name} value={v.id}>
                          {v.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </FormItem>
                </Row>
              </Form>
            </div>
            <Spin
              delay={100}
              spinning={loading.effects['userPermissionGroup/fetchPermissionGroupDetail']}
            >
              <div
                className={cls('permission-info')}
                // style={{
                //   display:
                //     permissionGroupDetail.authTeamId === form.getFieldValue('authTeamId')
                //       ? 'block'
                //       : 'none',
                // }}
              >
                <div className={cls('permission-info-title')}>
                  <div className="round"></div>
                  {fm('view.permission', '查看权限')}
                </div>
                <Tabs>
                  {renderFunctions()}
                  {renderRoles()}
                  {renderShareGroups()}
                  {renderSpecialCase()}
                </Tabs>
              </div>
            </Spin>
          </div>
        </Body>
        <Footer>
          <Button onClick={onCancel}>
            {isView ? fm('button.close', '关闭') : fm('button.cancel', '取消')}
          </Button>
          {!isView && (
            <Button
              type="primary"
              loading={loading['userPermissionGroup/fetchUpdate']}
              onClick={handleSubmit}
            >
              {fm('button.save', '保存')}
            </Button>
          )}
        </Footer>
      </Content>
    </Modal>
  )
}

const mapStateToProps = ({ userPermissionGroup, loading, login }) => ({
  userPermissionGroup,
  loading,
  currentUser: login.userInfo,
})

export default connect(mapStateToProps)(UserPermissionModal)

