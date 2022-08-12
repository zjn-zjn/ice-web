import { Modal, Input, Form, message } from 'antd'
import apis from '../../../../apis'
import { useRequest } from 'ahooks'
import { useEffect } from 'react'

interface Props {
  visible: boolean
  closeModal: () => void
  currentItem?: ConfigItem
  getConfigList: () => void
  app: string
}

const EditAddModal = ({
  visible,
  closeModal,
  currentItem,
  getConfigList,
  app
}: Props) => {
  const [form] = Form.useForm()
  const { run, loading } = useRequest(
    (params: object) => apis.iceEdit(params),
    {
      manual: true,
      onSuccess: (res: any) => {
        if (res?.ret === 0) {
          getConfigList()
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
    if (visible) {
      if (currentItem) {
        form.setFieldsValue({
          name: currentItem.name,
          scenes: currentItem.scenes,
          debug: currentItem.debug
        })
      }
    } else {
      form.resetFields()
    }
  }, [visible, currentItem])

  const confirm = () => {
    run({
      app,
      id: currentItem?.id,
      type: currentItem?.id ? 2 : 1,
      ...form.getFieldsValue()
    })
  }

  return (
    <Modal
      onCancel={closeModal}
      title={currentItem ? '编辑ICE' : '新增ICE'}
      visible={visible}
      onOk={confirm}
      confirmLoading={loading}
    >
      <Form form={form} labelCol={{ span: 6 }}>
        <Form.Item name='name' label='名称'>
          <Input />
        </Form.Item>
        <Form.Item name='scenes' label='场景(逗号分隔)'>
          <Input />
        </Form.Item>
        <Form.Item name='debug' label='debug'>
          <Input type='number' />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default EditAddModal
