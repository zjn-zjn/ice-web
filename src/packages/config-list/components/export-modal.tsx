import { Modal, Button, Input } from 'antd'
import apis from '../../../apis'
import { useRequest } from 'ahooks'
import copy from 'copy-to-clipboard'
import { useEffect } from 'react'

interface Props {
  open: boolean
  iceId?: number | string
  iceIds?: (number | string)[]
  pushId?: number
  onCancel: () => void
  onOk: () => void
  app: string | number
}

const ExportModal = ({ open, iceId, iceIds, pushId, onCancel, onOk, app }: Props) => {
  const isBatch = iceIds && iceIds.length > 0

  const { data, run } = useRequest(
    () => {
      if (isBatch) {
        return apis.iceExportBatch({ iceIds: iceIds!.map(Number), app: Number(app) })
      }
      return apis.iceExport({ iceId: Number(iceId!), app: Number(app), pushId })
    },
    {
      manual: true
    }
  )

  useEffect(() => {
    if (open) {
      run()
    }
  }, [iceId, iceIds, pushId, open, run])

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
      title={isBatch ? `批量导出 (${iceIds!.length}项)` : '导出ICE'}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={isBatch ? 720 : 520}
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
