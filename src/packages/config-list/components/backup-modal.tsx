import { Modal, Input, Form, message } from 'antd'
import apis from '../../../apis'
import { useRequest } from 'ahooks'
import { useEffect } from 'react'

interface Props {
  open: boolean
  iceId: string | number
  onCancel: () => void
  onOk: () => void
  app: string
}

const BackupModal = ({ open, iceId, onCancel, onOk, app }: Props) => {
  const [form] = Form.useForm()
  const { run, loading } = useRequest(
    (params: object) => apis.pushConf(params),
    {
      manual: true,
      onSuccess: () => {
        onOk()
        message.success('success')
      },
      onError: (err: any) => {
        message.error(err.msg || 'server error')
      }
    }
  )

  useEffect(() => {
    if (!open) {
      form.resetFields()
    }
  }, [open])

  const handleOk = () => {
    run({
      app,
      iceId,
      ...form.getFieldsValue()
    })
  }

  return (
    <Modal
      title="备份"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
    >
      <Form form={form}>
        <Form.Item name="reason" label="备注">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default BackupModal
