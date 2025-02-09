import { Modal, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import apis from '../../../apis'
import { useRequest } from 'ahooks'

interface Props {
  open: boolean
  data?: any
  onCancel: () => void
  onOk: () => void
  app: string
}

const EditAddModal = ({ open, data, onCancel, onOk, app }: Props) => {
  const [form] = Form.useForm()

  const { run, loading } = useRequest(
    (params: object) => apis.iceEdit(params),
    {
      manual: true,
      onSuccess: () => {
        message.success('success')
        onOk()
      },
      onError: (err: any) => {
        message.error(err.msg || 'server error')
      }
    }
  )

  useEffect(() => {
    if (open && data) {
      form.setFieldsValue({
        name: data.name,
        scenes: data.scenes,
        debug: data.debug
      })
    } else {
      form.resetFields()
    }
  }, [open, data, form])

  const handleOk = () => {
    form.validateFields().then(values => {
      run({
        app,
        ...values,
        id: data?.id,
        type: data?.id ? 2 : 1
      })
    }).catch(err => {
      console.error(err)
    })
  }

  return (
    <Modal
      title={data ? '编辑ICE' : '新增ICE'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
    >
      <Form
        form={form}
        labelCol={{ span: 6 }}
      >
        <Form.Item
          name="name"
          label="名称"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="scenes"
          label="场景(逗号分隔)"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="debug"
          label="debug"
        >
          <Input type="number" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default EditAddModal
