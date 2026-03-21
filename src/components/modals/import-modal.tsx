import { Modal, Input, App } from 'antd'
import apis from '../../apis'
import { useRequest } from 'ahooks'
import { useState } from 'react'

interface Props {
  open: boolean
  onCancel: () => void
  onOk: () => void
  app: string | number
}

const ImportModal = ({ open, onCancel, onOk, app }: Props) => {
  const { message } = App.useApp()
  const [json, setJson] = useState('')
  const { run, loading } = useRequest(
    () => apis.iceImport(json),
    {
      manual: true,
      onSuccess: () => {
        message.success('success')
        onOk()
      },
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
