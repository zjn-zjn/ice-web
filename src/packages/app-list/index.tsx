import apis from '../../apis'
import { useEffect, useRef, useState } from 'react'
import { Button, Modal, Form, Input, message } from 'antd'
import { FormOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
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
  const [hasChanges, setHasChanges] = useState(false)
  const initialValuesRef = useRef<{ name: string; info: string }>({ name: '', info: '' })
  const [editModel, setEditModel] = useState<EditModel>({
    type: 1,
    open: false,
    name: '',
    info: '',
    id: 0
  })

  const { data, run: getList } = useRequest(apis.appList)

  const { run: handleEdit, loading } = useRequest(apis.appEdit, {
    manual: true,
    onSuccess: () => {
      getList()
      closeModal()
      message.success('操作成功')
    }
  })

  useEffect(() => {
    if (editModel.open) {
      const values = { name: editModel.name, info: editModel.info }
      form.setFieldsValue(values)
      initialValuesRef.current = values
      setHasChanges(false)
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
    setHasChanges(false)
  }

  const onValuesChange = () => {
    const current = form.getFieldsValue()
    if (editModel.type === 2) {
      const init = initialValuesRef.current
      setHasChanges(
        current.name !== init.name || (current.info || '') !== (init.info || '')
      )
    } else {
      setHasChanges(!!current.name?.trim())
    }
  }

  const canSave = editModel.type === 1 ? hasChanges : hasChanges

  const onOk = async () => {
    try {
      const values = await form.validateFields()
      if (editModel.type === 2) {
        await handleEdit({ ...values, id: editModel.id })
      } else {
        await handleEdit(values)
      }
    } catch (error) {
      console.error('Form validation failed:', error)
    }
  }

  const linkToList = (id: number) => {
    navigate(`/config/list?app=${id}`)
  }

  const list = data?.list || []

  return (
    <div>
      <Button 
        type="primary"
        icon={<PlusOutlined />} 
        onClick={() => setEditModel({
          type: 1,
          open: true,
          name: '',
          info: '',
          id: 0
        })}
        style={{ padding: '12px 12px', top: '6px', left: '12px' }}
      >
        新增
      </Button>
      <div className='app-list'>
        {list.map((item: AppItem) => (
          <div
            key={item.id}
            className='app-item'
            onClick={() => {
              linkToList(item.id)
            }}
          >
            <div className='app-edit'>
              <FormOutlined
                onClick={(e: any) => {
                  e.stopPropagation()
                  setEditModel({
                    type: 2,
                    open: true,
                    name: item.name,
                    info: item.info,
                    id: item.id
                  })
                }}
              />
            </div>
            <p>{item.name}</p>
            <p>app: {item.id} </p>
            <p>{item.info}</p>
          </div>
        ))}
      </div>
      <Modal
        title={editModel.type === 1 ? '新增' : '编辑'}
        open={editModel.open}
        onOk={onOk}
        onCancel={closeModal}
        okText='确认'
        cancelText='取消'
        confirmLoading={loading}
        okButtonProps={{ disabled: !canSave }}
      >
        <Form form={form} onValuesChange={onValuesChange}>
          <Form.Item
            label='名称'
            name='name'
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label='描述'
            name='info'
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AppList
