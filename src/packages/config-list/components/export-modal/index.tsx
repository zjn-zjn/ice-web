import { Modal, Button, Input } from 'antd'
import apis from '../../../../apis'
import { useRequest } from 'ahooks'
import copy from 'copy-to-clipboard'
import { useEffect } from 'react'

interface Props {
  visible: boolean
  closeModal: () => void
  iceId: number | string
  pushId?: number
}

const ExportModal = ({ visible, closeModal, iceId, pushId }: Props) => {
  const { data, run } = useRequest<any, any[]>(
    (iceId: number | string) => apis.iceExport({ iceId, pushId }),
    {
      manual: true
    }
  )
  useEffect(() => {
    if (visible) {
      run(iceId)
    }
  }, [iceId, visible])

  const onCopy = () => {
    copy(data.data)
    closeModal()
  }

  return (
    <Modal footer={null} onCancel={closeModal} title='导出' open={visible}>
      <Input.TextArea
        rows={20}
        cols={10}
        value={JSON.stringify(JSON.parse(data?.data || '{}'), undefined, 2)}
      />
      <Button onClick={onCopy} style={{ marginTop: 10 }}>
        复制配置
      </Button>
    </Modal>
  )
}

export default ExportModal
