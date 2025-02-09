import { Modal, Button, Input } from 'antd'
import apis from '../../../apis'
import { useRequest } from 'ahooks'
import copy from 'copy-to-clipboard'
import { useEffect } from 'react'

interface Props {
  open: boolean
  iceId: number | string
  onCancel: () => void
  onOk: () => void
  app: string
}

const ExportModal = ({ open, iceId, onCancel, onOk, app }: Props) => {
  const { data, run } = useRequest<any, any[]>(
    (iceId: number | string) => apis.iceExport({ iceId, app }),
    {
      manual: true
    }
  )

  useEffect(() => {
    if (open) {
      run(iceId)
    }
  }, [iceId, open])

  const onCopy = () => {
    if (data) {
      copy(data)
      onOk()
    }
  }

  const formatJson = () => {
    if (!data) return '{}'
    try {
      const parsed = JSON.parse(data)
      return JSON.stringify(parsed, null, 2)
    } catch (e) {
      return data
    }
  }

  return (
    <Modal
      title="导出ICE"
      open={open}
      onCancel={onCancel}
      footer={null}
    >
      <Input.TextArea
        rows={20}
        cols={10}
        value={formatJson()}
      />
      <Button onClick={onCopy} style={{ marginTop: 10 }}>
        复制配置
      </Button>
    </Modal>
  )
}

export default ExportModal
