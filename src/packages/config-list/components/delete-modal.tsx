import { Modal, message } from 'antd'
import apis from '../../../apis'
import { useRequest } from 'ahooks'

interface Props {
  open: boolean
  onCancel: () => void
  onOk: () => void
  iceId: string | number
  app: string
}

const DeleteModal = ({
  open,
  onCancel,
  onOk,
  iceId,
  app
}: Props) => {
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

  const confirm = () => {
    run({
      app,
      id: iceId,
      status: 0
    })
  }

  return (
    <Modal
      onCancel={onCancel}
      title={`确认删除<${iceId}>吗？`}
      open={open}
      onOk={confirm}
      confirmLoading={loading}
    >
      <p>确定要删除该配置吗？此操作不可恢复！</p>
    </Modal>
  )
}

export default DeleteModal
