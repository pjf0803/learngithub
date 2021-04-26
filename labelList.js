import React, { Component } from 'react'
import {
  HkTable as Table, HkDivider as Divider, HkInput as Input,
  HkPopconfirm as Popconfirm, HkButton as Button, HkModal as Modal, HkForm as Form
} from '@hekit/hekit-ui'
// import { Form } from 'antd'
import HTML5Backend from 'react-dnd-html5-backend'
import update from 'immutability-helper'
import { DndProvider } from 'react-dnd'
import theme from '@hekit/hekit-style'
import { DragableBodyRow } from './DragRow'
import fm from './fm'
import './index.less'

const { Search, TextArea } = Input
const FormItem = Form.Item

const clsPrefix = 'sc-master'

const { Content, Body, Footer } = Modal

const defaultProps = {
  type: '',
  list: [] as object[],
  disableMoveCount: 0,
}

type DefaultProps = Readonly<typeof defaultProps>

type Props = {
  // form?: any
} & Partial<DefaultProps>

export default class LabelList extends Component<Props> {
  static defaultProps = defaultProps

  state = {
    list: [],
    searchList: [],
    draggable: false,
    modalVisible: false,
    textAreaValue: '',
  }

  searchValue: string

  key: number

  deleteList: any[]

  timer: any

  duplicateIndexs = [] // 重复的列表索引

  duplicateSearchIndexs = [] // 重复的搜索列表索引

  searchIptRef = React.createRef<any>()

  constructor(props) {
    super(props)

    this.searchValue = ''
    this.deleteList = []
    this.key = 1
  }

  componentDidMount() {
    const { list } = this.props
    this.updateData(list)
  }

  componentWillReceiveProps(nextProps) {
    const { list } = this.props
    if (list !== nextProps.list) {
      this.updateData(nextProps.list)
    }
  }

  updateData = newList => {
    const { type } = this.props
    if (newList.length) {
      const list = newList.map(item => {
        this.key += 1
        return Object.assign({ key: this.key }, item)
      })

      this.setState({ list })
    } else if (type === 'new') {
      this.setState({ list: [this.createRow(this.key)] })
    } else {
      this.setState({ list: [] })
    }
  }

  updateDuplicateIndexs = (list, key = 'duplicateIndexs') => {
    const indexs = []
    const o = {}

    list.forEach((_, index) => {
      if (!_.name) return

      if (o[_.name] !== undefined) {
        indexs.push(index)
      } else {
        o[_.name] = index
      }
    })

    this[key] = indexs
  }

  resetSearch = () => {
    this.searchIptRef.current.input.setValue('')
    this.searchValue = ''
    this.setState({ searchList: [] })
  }

  getList = () => this.state.list.concat().filter(_ => _.id || _.name)

  getDeleteList = () => this.deleteList.concat()

  handleDragable = draggable => {
    if (this.searchValue.length) {
      this.setState({
        draggable: false,
      })
    } else {
      this.setState({
        draggable,
      })
    }
  }

  createRow = (key, name = '') => {
    const row = {
      key,
      name,
      editable: true,
    }

    return row
  }

  handleAddRow = () => {
    const { list } = this.state
    this.key += 1

    list.push(this.createRow(this.key))

    this.setState({ list })
  }

  handleDelete = record => {
    const { list, searchList } = this.state

    if (record.id) {
      this.deleteList.push(record.id)
    }

    const newList = list.filter(item => item.key !== record.key)
    const newSearchList = searchList.filter(item => item.key !== record.key)

    this.updateDuplicateIndexs(newList)
    this.updateDuplicateIndexs(newSearchList, 'duplicateSearchIndexs')

    this.setState({
      list: newList,
      searchList: newSearchList,
    })
  }

  handleInputName = (e, record) => {
    const { list, searchList } = this.state
    const item = list.find(_ => _.key === record.key)
    if (item) {
      item.name = e.target.value
      this.updateDuplicateIndexs(list)
      this.updateDuplicateIndexs(searchList, 'duplicateSearchIndexs')
      this.setState({ list })
    }
  }

  handleSearch = e => {
    const { value } = e.target
    const { list } = this.state
    if (list.length === 0) return
    clearTimeout(this.timer)

    this.timer = setTimeout(() => {
      if (value.length === 0) {
        this.searchValue = ''
        this.updateDuplicateIndexs([], 'duplicateSearchIndexs')
        this.setState({ searchList: [] })
      } else {
        this.searchValue = value
        const searchList = list.filter(item => item.name && item.name.indexOf(value) > -1)
        this.updateDuplicateIndexs(searchList, 'duplicateSearchIndexs')
        this.setState({ searchList })
      }
    }, 150)
  }

  moveRow = (dragIndex, hoverIndex) => {
    const { state } = this
    const { disableMoveCount } = this.props
    if (hoverIndex < disableMoveCount) {
      return
    }
    const { list } = state
    const dragRow = list[dragIndex]
    const temp = update(
      { list },
      {
        list: {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragRow],
          ],
        },
      },
    ).list
    this.setState({ list: temp })
  }

  footer = () => {
    if (this.searchValue) return null
    return (
      <Button className="footer" type="dashed" onClick={this.handleAddRow}>
        {fm('addLabel', '添加标签')}
      </Button>
    )
  }

  handleToggleBatchAddModal = () => {
    this.setState((state: any) => ({ modalVisible: !state.modalVisible }))
  }

  handleBatchAdd = () => {
    const { textAreaValue, list } = this.state

    if (!textAreaValue) return

    textAreaValue.split('\n').forEach(name => {
      const v = name.trim()
      if (v) {
        this.key += 1
        list.push(this.createRow(this.key, v))
      }
    })

    if (!list[0].name) list.shift()

    this.setState({ list, modalVisible: false, textAreaValue: '' })
  }

  handleChangeTextAreaValue = e => {
    this.setState({ textAreaValue: e.target.value })
  }

  render() {
    const { type } = this.props
    const { list, draggable, searchList, modalVisible, textAreaValue } = this.state

    let dataSource = list
    let dataSourceDuplicateIndexs = this.duplicateIndexs

    if (this.searchValue) {
      dataSource = searchList
      dataSourceDuplicateIndexs = this.duplicateSearchIndexs
    }

    const columns = [
      {
        title: fm('rowNum', '行号'),
        dataIndex: 'num',
        width: '80px',
        render: (text, record, index) => index + 1,
      },
      {
        title: fm('name', '名称'),
        dataIndex: 'name',
        render: (text, record, index) => {
          let extra = null
          let validateStatus = null

          if (dataSourceDuplicateIndexs.includes(index)) {
            extra = <div className="ant-form-explain">{fm('duplicateLabel', '重复标签')}</div>
            validateStatus = 'error'
          }

          return (
            <FormItem labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} style={{ marginBottom: 0 }} extra={extra} validateStatus={validateStatus}>
              <Input
                key={record.key}
                placeholder={fm('requireInput', '请输入')}
                onChange={e => this.handleInputName(e, record)}
                value={text}
                disabled={!record.editable}
              />
            </FormItem>
          )
        },
      },
      {
        title: fm('operater', '操作'),
        width: '140px',
        dataIndex: 'operation',
        render: (text, record) => {
          if (!record.editable) {
            return <div />
          }
          const operations = []

          // if (record.editable) {
          operations.push(
            <Popconfirm
              key="operation_del"
              title={fm('confirmDelete', '确认删除?')}
              onConfirm={() => this.handleDelete(record)}
            >
              <span className="action-delete">{fm('delete', '删除')}</span>
            </Popconfirm>,
          )
          // }

          if (!this.searchValue) {
            if (operations.length) {
              operations.push(<Divider key="operation_divider" type="vertical" />)
            }
            operations.push(
              <span
                key="operation_drag"
                className="action-btn"
                onMouseEnter={() => this.handleDragable(true)}
                onMouseLeave={() => this.handleDragable(false)}
              >
                {fm('dragSort', '拖动排序')}
              </span>,
            )
          }
          return <span>{operations}</span>
        },
      },
    ]

    const prop = {
      columns,
      dataSource,
      onRow: (record, index) => ({
        index,
        moveRow: this.moveRow,
      }),
      footer: this.footer,
      pagination: false,
      tableLayout: 'auto',
      components: {},
    }
    if (draggable) {
      prop.components = { body: { row: DragableBodyRow } }
    }

    return (
      <DndProvider backend={HTML5Backend}>
        <div className={`${clsPrefix}-options`}>
          <div className="options-header">
            <Search
              placeholder={fm('searchData', '搜索数据项')}
              onChange={this.handleSearch}
              style={{ width: 200, marginBottom: '12px' }}
              ref={this.searchIptRef}
            />
            <div>
              {/* {type === 'new' ? ( */}
              <Button onClick={this.handleToggleBatchAddModal}>
                {fm('batchAdd', '批量填写')}
              </Button>
              {/* ) : null} */}
            </div>
          </div>
          <Table {...prop} />
        </div>
        <Modal
          footer={null}
          visible={modalVisible}
          width={600}
          height={488}
          destroyOnClose
          onCancel={this.handleToggleBatchAddModal}
          withFooter
          noPadding
        >
          <Content>
            <Body style={{ padding: 0 }}>
              <div style={{ padding: theme['@padding-md'] }}>
                <TextArea
                  value={textAreaValue}
                  placeholder={fm('tipPattern', '请输入标签名称，每一行为一个标签项')}
                  onChange={this.handleChangeTextAreaValue}
                  style={{ height: 300 }}
                />
              </div>
            </Body>
            <Footer>
              <Button onClick={this.handleToggleBatchAddModal}>{fm('cancel', '取消')}</Button>
              <Button type="primary" onClick={this.handleBatchAdd}>
                {fm('save', '保存')}
              </Button>
            </Footer>
          </Content>
        </Modal>
      </DndProvider>
    )
  }
}

