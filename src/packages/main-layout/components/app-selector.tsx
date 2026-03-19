import { useState, useEffect } from 'react'
import { Input, Button, Modal, Form, message } from 'antd'
import { PlusOutlined, SettingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
import apis from '../../../apis'

interface AppItem {
  id: number
  name: string
  info: string
}

interface Props {
  currentAppId?: number
  onClose: () => void
  onSelect?: (id: number) => void
}

const AppSelector = ({ currentAppId, onClose, onSelect }: Props) => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [editModal, setEditModal] = useState<{ open: boolean; item?: AppItem }>({ open: false })
  const [form] = Form.useForm()

  const { data, run: refreshApps } = useRequest(apis.appList)

  const { run: handleEdit, loading: editLoading } = useRequest(apis.appEdit, {
    manual: true,
    onSuccess: () => {
      refreshApps()
      setEditModal({ open: false })
      message.success('操作成功')
    }
  })

  useEffect(() => {
    if (editModal.open && editModal.item) {
      form.setFieldsValue({ name: editModal.item.name, info: editModal.item.info })
    } else if (editModal.open) {
      form.resetFields()
    }
  }, [editModal, form])

  const list: AppItem[] = (data?.list || []).filter((item: AppItem) =>
    !search || item.name.includes(search) || String(item.id).includes(search)
  )

  const selectApp = (id: number) => {
    navigate(`/app/${id}/base`)
    onClose()
    onSelect?.(id)
  }

  const onEditOk = async () => {
    const values = await form.validateFields()
    if (editModal.item) {
      await handleEdit({ ...values, id: editModal.item.id })
    } else {
      await handleEdit(values)
    }
  }

  return (
    <div className="app-selector-content">
      <Input
        className="app-search"
        placeholder="搜索..."
        allowClear
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
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
        <Button
          type="text"
          icon={<PlusOutlined />}
          block
          onClick={() => setEditModal({ open: true })}
        >
          新建App
        </Button>
      </div>

      <Modal
        title={editModal.item ? '编辑App' : '新建App'}
        open={editModal.open}
        onCancel={() => setEditModal({ open: false })}
        onOk={onEditOk}
        confirmLoading={editLoading}
      >
        <Form form={form} labelCol={{ span: 4 }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="info" label="描述" rules={[{ required: true, message: '请输入描述' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AppSelector
