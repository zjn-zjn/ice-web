import { Modal, Input, message } from 'antd'
import apis from '../../../apis'
import { useRequest } from 'ahooks'
import { useState } from 'react'

interface Props {
  open: boolean
  onCancel: () => void
  onOk: () => void
  app: string
}

const ImportModal = ({ open, onCancel, onOk, app }: Props) => {
  const [json, setJson] = useState('')
  const { run, loading } = useRequest(
    () => apis.iceImport({ json, app }),
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

  const handleOk = () => {
    run()
  }

  return (
    <Modal
      title="导入"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
    >
      <Input.TextArea
        rows={15}
        cols={10}
        value={json}
        onChange={(e) => {
          setJson(e.target.value)
        }}
      />
    </Modal>
  )
}

export default ImportModal
