import { useState, useEffect, useRef } from 'react'
import { Input, Button, Modal, Form, Pagination, App } from 'antd'
import { PlusOutlined, SettingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
import apis from '../../../apis'
import type { AppItem } from '../../../types'

interface Props {
  currentAppId?: number
  onClose: () => void
  onSelect?: (id: number) => void
  onAppNameChange?: (name: string) => void
}

const PAGE_SIZE = 20

const AppSelector = ({ currentAppId, onClose, onSelect, onAppNameChange }: Props) => {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [pageNum, setPageNum] = useState(1)
  const [editModal, setEditModal] = useState<{ open: boolean; item?: AppItem }>({ open: false })
  const [form] = Form.useForm()
  const [hasChanges, setHasChanges] = useState(false)
  const initialValuesRef = useRef<{ name: string; info: string }>({ name: '', info: '' })

  const { data, run: refreshApps } = useRequest(
    () => apis.appList({ pageNum, pageSize: PAGE_SIZE, name: search || undefined }),
    { refreshDeps: [pageNum, search] }
  )

  const { run: handleEdit, loading: editLoading } = useRequest(apis.appEdit, {
    manual: true,
    onSuccess: (_: any, [params]: any) => {
      refreshApps()
      if (params?.id === currentAppId && params?.name !== undefined) {
        onAppNameChange?.(params.name)
      }
      setEditModal({ open: false })
      message.success('操作成功')
    }
  })

  useEffect(() => {
    if (editModal.open && editModal.item) {
      const values = { name: editModal.item.name, info: editModal.item.info }
      form.setFieldsValue(values)
      initialValuesRef.current = values
    } else if (editModal.open) {
      form.resetFields()
      initialValuesRef.current = { name: '', info: '' }
    }
    setHasChanges(false)
  }, [editModal, form])

  const list: AppItem[] = data?.list || []
  const total = data?.total || 0

  const selectApp = (id: number) => {
    navigate(`/app/${id}/base`)
    onClose()
    onSelect?.(id)
  }

  const isEdit = !!editModal.item
  const onValuesChange = () => {
    const current = form.getFieldsValue()
    if (isEdit) {
      const init = initialValuesRef.current
      setHasChanges(
        current.name !== init.name || (current.info || '') !== (init.info || '')
      )
    } else {
      setHasChanges(!!current.name?.trim())
    }
  }

  const canSave = hasChanges

  const onEditOk = async () => {
    const values = await form.validateFields()
    if (editModal.item) {
      await handleEdit({ ...values, id: editModal.item.id })
    } else {
      await handleEdit(values)
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPageNum(1)
  }

  return (
    <div className="app-selector-content">
      <Input
        className="app-search"
        placeholder="搜索..."
        allowClear
        size="small"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <div className="app-list-items">
        {list.map((item: AppItem) => (
          <div
            key={item.id}
            className={`app-item-row ${item.id === currentAppId ? 'active' : ''}`}
            onClick={() => selectApp(item.id)}
          >
            <span className="app-item-name">{item.name} #{item.id}</span>
            <SettingOutlined
              className="app-item-edit"
              onClick={(e) => {
                e.stopPropagation()
                setEditModal({ open: true, item })
              }}
            />
          </div>
        ))}
      </div>
      <div className="app-create-row">
        <div style={{ flex: 1 }}>
          <Button
            type="text"
            icon={<PlusOutlined />}
            onClick={() => setEditModal({ open: true })}
          >
            新建App
          </Button>
        </div>
        {total > PAGE_SIZE && (
          <Pagination
            size="small"
            current={pageNum}
            pageSize={PAGE_SIZE}
            total={total}
            onChange={setPageNum}
            showSizeChanger={false}
            simple
          />
        )}
      </div>

      <Modal
        title={editModal.item ? '编辑App' : '新建App'}
        open={editModal.open}
        onCancel={() => setEditModal({ open: false })}
        onOk={onEditOk}
        confirmLoading={editLoading}
        okButtonProps={{ disabled: !canSave }}
      >
        <Form form={form} labelCol={{ span: 4 }} onValuesChange={onValuesChange}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="info" label="描述">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AppSelector
