import { Modal, Input, Form, message } from 'antd'
import apis from '../../../../apis'
import { useRequest } from 'ahooks'
import { useEffect } from 'react'

interface Props {
  visible: boolean
  closeModal: () => void
  getConfigList: () => void
  iceId: number
  app: string
}

const DeleteModal = ({
  visible,
  closeModal,
  getConfigList,
  iceId,
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
          message.success('success')
        } else {
          message.error(res?.msg || 'failed')
        }
      },
      onError: (err: any) => {
        message.error(err.msg || 'server error')
      }
    }
  )

  const confirm = () => {
    run({
      app,
      id: iceId,
      status: 0
    })
  }

  return (
    <Modal
      onCancel={closeModal}
      title={`确认删除<${iceId}>吗？`}
      open={visible}
      onOk={confirm}
      confirmLoading={loading}
    >
    </Modal>
  )
}

export default DeleteModal
