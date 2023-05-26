import { Modal, Input, message } from 'antd'
import apis from '../../../../apis'
import { useRequest } from 'ahooks'
import { useState } from 'react'

interface Props {
  visible: boolean
  closeModal: () => void
}

const ImportModal = ({ visible, closeModal }: Props) => {
  const [json, setJson] = useState('')
  const { run, loading } = useRequest(() => apis.iceImport({ json }), {
    manual: true,
    onSuccess: (res: any) => {
      if (res?.ret === 0) {
        closeModal()
        message.success('success')
      } else {
        message.error(res?.msg || 'failed')
      }
    },
    onError: (err: any) => {
      message.error(err.msg || 'server error')
    }
  })

  const confirm = () => {
    run()
  }

  return (
    <Modal
      onCancel={closeModal}
      title='导入'
      visible={visible}
      onOk={confirm}
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
