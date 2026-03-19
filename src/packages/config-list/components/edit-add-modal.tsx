import { Modal, Form, Input, InputNumber, message } from 'antd'
import { useEffect, useRef, useState } from 'react'
import apis from '../../../apis'
import { useRequest } from 'ahooks'

interface Props {
  open: boolean
  data?: any
  onCancel: () => void
  onOk: () => void
  app: string | number
  folderPath?: string
}

const EditAddModal = ({ open, data, onCancel, onOk, app, folderPath }: Props) => {
  const [form] = Form.useForm()
  const [hasChanges, setHasChanges] = useState(false)
  const initialValuesRef = useRef<any>({})

  const { run, loading } = useRequest(
    (params: object, isCreate: boolean) => isCreate ? apis.iceCreate(params) : apis.iceEdit(params),
    {
      manual: true,
      onSuccess: () => {
        message.success('success')
        onOk()
      },
    }
  )

  useEffect(() => {
    if (open && data) {
      const values = { name: data.name, scenes: data.scenes, debug: data.debug }
      form.setFieldsValue(values)
      initialValuesRef.current = values
    } else {
      form.resetFields()
      initialValuesRef.current = {}
    }
    setHasChanges(false)
  }, [open, data, form])

  const isEdit = !!data
  const onValuesChange = () => {
    if (isEdit) {
      const current = form.getFieldsValue()
      const init = initialValuesRef.current
      setHasChanges(
        (current.name || '') !== (init.name || '') ||
        (current.scenes || '') !== (init.scenes || '') ||
        (current.debug ?? '') !== (init.debug ?? '')
      )
    }
  }

  const canSave = isEdit ? hasChanges : true

  const handleOk = () => {
    form.validateFields().then(values => {
      const isCreate = !data
      if (isCreate) {
        const { specifiedId, ...rest } = values
        run({ app: Number(app), ...rest, id: specifiedId || undefined, path: folderPath || '' }, true)
      } else {
        run({ app: Number(app), ...values, id: data.id }, false)
      }
    }).catch(err => {
      console.error(err)
    })
  }

  return (
    <Modal
      title={data ? '编辑Rule' : '新增Rule'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okButtonProps={{ disabled: !canSave }}
    >
      <Form
        form={form}
        labelCol={{ span: 6 }}
        onValuesChange={onValuesChange}
      >
        {!data && (
          <Form.Item
            name="specifiedId"
            label="指定ID"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              precision={0}
              placeholder="留空则自动分配"
            />
          </Form.Item>
        )}
        <Form.Item
          name="name"
          label="名称"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="scenes"
          label="场景(逗号分隔)"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="debug"
          label="debug"
        >
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default EditAddModal
