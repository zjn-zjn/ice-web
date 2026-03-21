import { Modal, Form, Input, InputNumber, App, Checkbox } from 'antd'
import { useEffect, useRef, useState } from 'react'
import apis from '../../apis'
import { useRequest } from 'ahooks'

export interface EditData {
  id: number
  name?: string
  scenes?: string
  debug?: number
}

interface Props {
  open: boolean
  data?: EditData | null
  onCancel: () => void
  onOk: (name?: string) => void
  app: string | number
  folderPath?: string
}

const debugOptions = [
  { label: '输入', value: 1 },
  { label: '过程', value: 2 },
  { label: '输出', value: 4 },
]

const debugToChecked = (debug?: number): number[] => {
  if (!debug) return []
  return debugOptions.map(o => o.value).filter(v => (debug & v) !== 0)
}

const checkedToDebug = (checked: number[]): number | undefined => {
  const v = checked.reduce((a, b) => a | b, 0)
  return v || undefined
}

const EditAddModal = ({ open, data, onCancel, onOk, app, folderPath }: Props) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [hasChanges, setHasChanges] = useState(false)
  const initialValuesRef = useRef<{ name?: string; scenes?: string; debug?: number }>({})

  const { run, loading } = useRequest(
    (params: any, isCreate: boolean) => isCreate ? apis.iceCreate(params) : apis.iceEdit(params),
    {
      manual: true,
      onSuccess: (_: any, [params]: any) => {
        message.success('success')
        onOk(params?.name)
      },
    }
  )

  useEffect(() => {
    if (open && data) {
      const values = { name: data.name, scenes: data.scenes, debug: debugToChecked(data.debug) }
      form.setFieldsValue(values)
      initialValuesRef.current = { name: data.name, scenes: data.scenes, debug: data.debug }
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
        (checkedToDebug(current.debug || []) ?? '') !== (init.debug ?? '')
      )
    }
  }

  const canSave = isEdit ? hasChanges : true

  const handleOk = () => {
    form.validateFields().then(values => {
      const { debug: debugChecked, ...rest } = values
      const debug = checkedToDebug(debugChecked || [])
      const isCreate = !data
      if (isCreate) {
        const { specifiedId, ...params } = rest
        run({ app: Number(app), ...params, debug, id: specifiedId || undefined, path: folderPath || '' }, true)
      } else {
        run({ app: Number(app), ...rest, debug, id: data.id }, false)
      }
    }).catch(() => {})
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
          <Checkbox.Group options={debugOptions} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default EditAddModal
