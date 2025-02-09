import { useEffect, useState } from 'react'
import { Button, Modal, Form, Input, message } from 'antd'
import { FormOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
import request from '../../utils/request'
import './index.less'

interface AppItem {
  id: number
  name: string
  info: string
}

interface EditModel {
  type: number
  open: boolean
  name: string
  info: string
  id: number
}

const AppList = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [editModel, setEditModel] = useState<EditModel>({
    type: 1,
    open: false,
    name: '',
    info: '',
    id: 0
  })

  const { data: response, run: getList } = useRequest<{ list: AppItem[] }>(
    () => request.get('/ice-server/app/list'),
    {
      formatResult: (res) => res.data
    }
  )

  const { run: handleEdit, loading } = useRequest(
    (params: Partial<AppItem>) => request.post('/ice-server/app/edit', params),
    {
      manual: true,
      onSuccess: () => {
        getList()
        closeModal()
        message.success('操作成功')
      }
    }
  )

  // 当 editModel 改变时更新表单数据
  useEffect(() => {
    if (editModel.open) {
      form.setFieldsValue({
        name: editModel.name,
        info: editModel.info
      })
    }
  }, [editModel, form])

  const closeModal = () => {
    setEditModel({
      type: 1,
      open: false,
      name: '',
      info: '',
      id: 0
    })
    form.resetFields()
  }

  const onOk = async () => {
    try {
      const values = await form.validateFields()
      if (editModel.type === 2) {
        // 编辑时才传入 id
        await handleEdit({ ...values, id: editModel.id })
      } else {
        // 新建时只传入 name 和 info
        await handleEdit(values)
      }
    } catch (error) {
      console.error('Form validation failed:', error)
    }
  }

  const linkToList = (id: number) => {
    navigate(`/config/list?app=${id}`)
  }

  const list = response?.list || []

  return (
    <div className="app-list">
      <div className="header">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() =>
            setEditModel({
              type: 1,
              open: true,
              name: '',
              info: '',
              id: 0
            })
          }
        >
          新建应用
        </Button>
      </div>
      <div className="content">
        {list.map((item) => (
          <div key={item.id} className="item" onClick={() => linkToList(item.id)}>
            <div className="item-header">
              <span className="title">{item.name}</span>
              <span className="id">ID: {item.id}</span>
            </div>
            <div className="desc">{item.info}</div>
            <div className="operation" onClick={(e) => e.stopPropagation()}>
              <FormOutlined
                onClick={() =>
                  setEditModel({
                    type: 2,
                    open: true,
                    name: item.name,
                    info: item.info,
                    id: item.id
                  })
                }
              />
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="empty">
            <div className="empty-text">暂无应用</div>
            <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={() =>
                setEditModel({
                  type: 1,
                  open: true,
                  name: '',
                  info: '',
                  id: 0
                })
              }
            >
              新建应用
            </Button>
          </div>
        )}
      </div>
      <Modal
        title={editModel.type === 1 ? '新建应用' : '编辑应用'}
        open={editModel.open}
        onOk={onOk}
        onCancel={closeModal}
        confirmLoading={loading}
        destroyOnClose
      >
        <Form 
          form={form}
          labelCol={{ span: 4 }} 
          wrapperCol={{ span: 20 }}
          preserve={false}
        >
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入应用名称' }]}
          >
            <Input placeholder="请输入应用名称" />
          </Form.Item>
          <Form.Item
            label="描述"
            name="info"
            rules={[{ required: true, message: '请输入应用描述' }]}
          >
            <Input.TextArea placeholder="请输入应用描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AppList
