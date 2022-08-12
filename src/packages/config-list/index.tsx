import { useHistory, useParams } from 'react-router-dom'
import { useState } from 'react'
import { Button, Table, Form, Input, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import apis from '../../apis'
import { useRequest } from 'ahooks'
import ExportModal from './components/export-modal'
import EditAddModal from './components/edit-add-modal'
import BackupModal from './components/backup-modal'
import BackupHistory from './components/backup-history'

interface ModalState {
  visible: boolean
  iceId: string | number
}

interface ExportModalState extends ModalState {
  pushId?: number
}

interface HistoryModalState extends ModalState {
  name: string
}

const ConfigList = () => {
  const history = useHistory()
  const { id } = useParams<{ id: string }>() || {}
  const [form] = Form.useForm()
  const [pageId, setPageId] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [importVisible, setImportVisible] = useState(false)
  const [backupObj, setBackupObj] = useState<ModalState>({
    visible: false,
    iceId: ''
  })
  const [showHistory, setShowHistory] = useState<HistoryModalState>({
    visible: false,
    iceId: '',
    name: ''
  })
  const [exportObj, setExportObj] = useState<ExportModalState>({
    visible: false,
    iceId: ''
  })
  const [editObj, setEditObj] = useState<{
    visible: boolean
    currentItem?: ConfigItem
  }>({
    currentItem: undefined,
    visible: false
  })

  const {
    data,
    run: getConfigList,
    loading
  } = useRequest<any, any[]>(
    () =>
      apis.confList({
        app: id,
        pageId,
        pageSize,
        ...form.getFieldsValue()
      }),
    {
      refreshDeps: [id, pageId, pageSize]
    }
  )

  const { list = [], total } = data?.data || {}

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id'
    },
    {
      title: '名称',
      dataIndex: 'name'
    },
    {
      title: '场景',
      dataIndex: 'scenes'
    },
    {
      title: '配置ID',
      dataIndex: 'confId'
    },
    {
      title: 'Debug',
      dataIndex: 'debug'
    },
    {
      title: '操作',
      dataIndex: 'operation',
      render: (text: any, record: ConfigItem) => (
        <>
          <Button type='link' onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Button
            type='link'
            onClick={() => linkToDetail(record.app, record.id)}
          >
            查看详情
          </Button>
          <Button type='link' onClick={() => openPushModal(record.id)}>
            备份
          </Button>
          <Button
            type='link'
            onClick={() => openPushHistory(record.id, record.name)}
          >
            备份历史
          </Button>
          <Button type='link' onClick={() => openExportModal(record.id)}>
            导出
          </Button>
        </>
      )
    }
  ]

  const openEditModal = (item?: ConfigItem) => {
    setEditObj({
      visible: true,
      currentItem: item
    })
  }

  const linkToDetail = (app: number, id: number) => {}

  const openPushModal = (id: number) => {
    setBackupObj({
      visible: true,
      iceId: id
    })
  }

  const openPushHistory = (id: number, name: string) => {
    setShowHistory({
      visible: true,
      iceId: id,
      name
    })
  }

  const openExportModal = (id: number, pushId?: number) => {
    setExportObj({ visible: true, iceId: id, pushId })
  }

  const openImportModal = () => {
    setImportVisible(true)
  }

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      <Space>
        <Button onClick={() => openEditModal()}>新增</Button>
        <Button onClick={openImportModal}>导入</Button>
      </Space>
      <Form form={form} layout='inline'>
        <Form.Item name='name' label='名称'>
          <Input />
        </Form.Item>
        <Form.Item name='scene' label='场景'>
          <Input />
        </Form.Item>
        <Form.Item name='id' label='ID'>
          <Input />
        </Form.Item>
        <Space>
          <Button
            type='primary'
            icon={<SearchOutlined />}
            onClick={() => {
              getConfigList()
            }}
          >
            查询
          </Button>
          <Button
            onClick={() => {
              form.resetFields()
            }}
          >
            重置
          </Button>
        </Space>
      </Form>
      <Table<ConfigItem>
        rowKey='id'
        columns={columns}
        loading={loading}
        dataSource={list}
        pagination={{
          position: ['bottomRight'],
          total,
          pageSize,
          onChange: (page, pageSize) => {
            setPageId(page)
            setPageSize(pageSize)
          }
        }}
      />
      <ExportModal
        visible={exportObj.visible}
        iceId={exportObj.iceId}
        pushId={exportObj.pushId}
        closeModal={() => {
          setExportObj((pre) => ({ ...pre, visible: false }))
        }}
      />
      <EditAddModal
        app={id}
        visible={editObj.visible}
        currentItem={editObj.currentItem}
        getConfigList={getConfigList}
        closeModal={() => {
          setEditObj((pre) => ({ ...pre, visible: false }))
        }}
      />
      <BackupModal
        app={id}
        iceId={backupObj.iceId}
        visible={backupObj.visible}
        closeModal={() => {
          setBackupObj((pre) => ({ ...pre, visible: false }))
        }}
      />
      <BackupHistory
        app={id}
        visible={showHistory.visible}
        iceId={showHistory.iceId}
        name={showHistory.name}
        openExportModal={openExportModal}
        getConfigList={getConfigList}
        closeModal={() => {
          setShowHistory((pre) => ({ ...pre, visible: false }))
        }}
      />
    </Space>
  )
}

export default ConfigList
