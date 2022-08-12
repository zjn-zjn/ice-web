import { Modal, Input, Form, message } from 'antd'
import apis from '../../../../apis'
import { useRequest } from 'ahooks'
import { useEffect } from 'react'

interface Props {
  visible: boolean
  closeModal: () => void
  app: string
  iceId: string | number
}

const BackupModal = ({ visible, closeModal, app, iceId }: Props) => {
  const [form] = Form.useForm()
  const { run, loading } = useRequest(
    (params: object) => apis.pushConf(params),
    {
      manual: true,
      onSuccess: (res: any) => {
        if (res?.ret === 0) {
          closeModal()
        } else {
          message.error(res?.data?.msg || 'failed')
        }
      },
      onError: (err: any) => {
        message.error(err.msg || 'server error')
      }
    }
  )

  useEffect(() => {
    if (!visible) {
      form.resetFields()
    }
  }, [visible])

  const confirm = () => {
    run({
      app,
      iceId,
      ...form.getFieldsValue()
    })
  }

  return (
    <Modal
      onCancel={closeModal}
      title='备份'
      visible={visible}
      onOk={confirm}
      confirmLoading={loading}
    >
      <Form form={form}>
        <Form.Item name='reason' label='备注'>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default BackupModal
