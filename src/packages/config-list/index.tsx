import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Button, Table, Form, Input, Space, message } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import apis from '../../apis'
import { useRequest } from 'ahooks'
import ExportModal from './components/export-modal'
import EditAddModal from './components/edit-add-modal'
import DeleteModal from './components/delete-modal'
import BackupModal from './components/backup-modal'
import BackupHistory from './components/backup-history'
import ImportModal from './components/import-modal'

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

interface ConfigItem {
  id: number
  name: string
  scenes: string
  confId: string
  debug: string
  [key: string]: any
}

const ConfigList = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const app = searchParams.get('app') || ''
  const [form] = Form.useForm()
  const [pageId, setPageId] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [importVisible, setImportVisible] = useState(false)
  const [backupObj, setBackupObj] = useState<ModalState>({
    visible: false,
    iceId: ''
  })
  const [deleteObj, setDeleteObj] = useState<ModalState>({
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
    data: response,
    run: getConfigList,
    loading
  } = useRequest(
    () => {
      const params = {
        app: Number(app),
        pageId,
        pageSize,
        ...form.getFieldsValue()
      }
      return apis.confList(params)
    },
    {
      refreshDeps: [app, pageId, pageSize],
      onError: (error) => {
        message.error('获取配置列表失败：' + error.message)
      }
    }
  )

  const { list = [], total = 0 } = response || {}

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 200
    },
    {
      title: '场景',
      dataIndex: 'scenes',
      width: 150
    },
    {
      title: '配置ID',
      dataIndex: 'confId',
      width: 100
    },
    {
      title: 'Debug',
      dataIndex: 'debug',
      width: 80
    },
    {
      title: '操作',
      key: 'operation',
      width: 280,
      render: (_, record: ConfigItem) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/config/detail?app=${app}&iceId=${record.id}`)}
          >
            查看详情
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setEditObj({
                visible: true,
                currentItem: record
              })
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setExportObj({
                visible: true,
                iceId: record.id
              })
            }}
          >
            导出
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setBackupObj({
                visible: true,
                iceId: record.id
              })
            }}
          >
            备份
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setShowHistory({
                visible: true,
                iceId: record.id,
                name: record.name
              })
            }}
          >
            历史
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => {
              setDeleteObj({
                visible: true,
                iceId: record.id
              })
            }}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div className="config-list">
      <div className="header">
        <Space>
          <Button type="primary" onClick={() => setEditObj({ visible: true })}>
            新建
          </Button>
          <Button onClick={() => setImportVisible(true)}>导入</Button>
        </Space>
        <Form
          form={form}
          layout="inline"
          onFinish={() => {
            setPageId(1)
            getConfigList()
          }}
        >
          <Form.Item name="id">
            <Input placeholder="请输入ID" allowClear />
          </Form.Item>
          <Form.Item name="name">
            <Input placeholder="请输入名称" allowClear />
          </Form.Item>
          <Form.Item name="scenes">
            <Input placeholder="请输入场景" allowClear />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
          </Form.Item>
        </Form>
      </div>
      <Table
        columns={columns}
        dataSource={list}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pageId,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, size) => {
            setPageId(page)
            setPageSize(size)
          }
        }}
      />
      <EditAddModal
        open={editObj.visible}
        data={editObj.currentItem}
        onCancel={() => setEditObj({ visible: false })}
        onOk={() => {
          setEditObj({ visible: false })
          getConfigList()
        }}
        app={app}
      />
      <ExportModal
        open={exportObj.visible}
        iceId={exportObj.iceId}
        onCancel={() => setExportObj({ visible: false, iceId: '' })}
        onOk={() => setExportObj({ visible: false, iceId: '' })}
        app={app}
      />
      <DeleteModal
        open={deleteObj.visible}
        iceId={deleteObj.iceId}
        onCancel={() => setDeleteObj({ visible: false, iceId: '' })}
        onOk={() => {
          setDeleteObj({ visible: false, iceId: '' })
          getConfigList()
        }}
        app={app}
      />
      <BackupModal
        open={backupObj.visible}
        iceId={backupObj.iceId}
        onCancel={() => setBackupObj({ visible: false, iceId: '' })}
        onOk={() => setBackupObj({ visible: false, iceId: '' })}
        app={app}
      />
      <BackupHistory
        open={showHistory.visible}
        iceId={showHistory.iceId}
        name={showHistory.name}
        onCancel={() =>
          setShowHistory({ visible: false, iceId: '', name: '' })
        }
        openExportModal={(id: number, pushId?: number) => {
          setExportObj({ visible: true, iceId: id, pushId })
          setShowHistory({ visible: false, iceId: '', name: '' })
        }}
        getConfigList={getConfigList}
        app={app}
      />
      <ImportModal
        open={importVisible}
        onCancel={() => setImportVisible(false)}
        onOk={() => {
          setImportVisible(false)
          getConfigList()
        }}
        app={app}
      />
    </div>
  )
}

export default ConfigList
