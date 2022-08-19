import { TreeItem } from '../tree'
import { Form, Input, Select, DatePicker, Radio, Button, message } from 'antd'
import { useEffect, useState } from 'react'
import { useRequest } from 'ahooks'
import apis from '../../../../apis'

const TimeTypeOptions = [
  { label: '无时间限制', value: 1 },
  { label: '大于开始时间', value: 5 },
  { label: '小于结束时间', value: 6 },
  { label: '在开始时间与结束时间之内', value: 7 }
]

const debugInverseOptions = [
  {
    label: 'true',
    value: true
  },
  {
    label: 'false',
    value: false
  }
]

interface Props {
  selectedNode: TreeItem | undefined
  address: string
  app: string
  iceId: string
  refresh: () => void
}

const Edit = ({ selectedNode, address, app, iceId, refresh }: Props) => {
  const [isEdit, setIsEdit] = useState(false)
  const [form] = Form.useForm()

  const { run, loading } = useRequest(
    (params: object) => apis.editConf(params),
    {
      manual: true,
      onSuccess: (res: any) => {
        if (res?.ret === 0) {
          setIsEdit(false)
          refresh()
        } else {
          message.error(res?.msg || 'failed')
        }
      },
      onError: (err: any) => {
        message.error(err.msg || 'server error')
      }
    }
  )

  useEffect(() => {
    form.setFieldsValue({
      name: selectedNode?.showConf?.nodeName,
      timeType: selectedNode?.timeType || 1,
      start: selectedNode?.start,
      end: selectedNode?.end,
      debug: selectedNode?.showConf?.debug ?? true,
      inverse: selectedNode?.showConf?.inverse ?? false,
      confField: selectedNode?.showConf?.confField
    })
  }, [selectedNode])

  const confirmEdit = () => {
    form
      .validateFields()
      .then((values) => {
        const params = {
          app,
          iceId,
          editType: 2,
          selectId: selectedNode?.showConf?.nodeId,
          parentId: selectedNode?.parentId,
          nextId: selectedNode?.nextId,
          ...selectedNode?.showConf,
          ...values,
          confName: undefined
        }
        run(params)
      })
      .catch(() => {})
  }

  return (
    <div className='edit-wrap'>
      <Form
        className='form-wrap'
        form={form}
        disabled={(!!address && address !== 'server') || !isEdit}
      >
        <Form.Item label='名称' name='name'>
          <Input />
        </Form.Item>
        <Form.Item label='时间类型' name='timeType' required>
          <Select options={TimeTypeOptions} />
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.timeType !== currentValues.timeType
          }
        >
          {() => (
            <>
              <Form.Item
                label='开始时间'
                name='start'
                dependencies={['timeType']}
                rules={[
                  {
                    required: [2, 5, 5, 7].includes(
                      form.getFieldValue('timeType')
                    ),
                    validator: (rule, value) =>
                      value || !rule.required
                        ? Promise.resolve()
                        : Promise.reject(new Error('请选择开始时间'))
                  }
                ]}
              >
                <DatePicker showTime format={'YYYY-MM-DD HH:mm:ss'} />
              </Form.Item>
              <Form.Item
                label='结束时间'
                name='end'
                dependencies={['timeType']}
                rules={[
                  {
                    required: [3, 4, 6, 7].includes(
                      form.getFieldValue('timeType')
                    ),
                    validator: (rule, value) =>
                      value || !rule.required
                        ? Promise.resolve()
                        : Promise.reject(new Error('请选择结束时间'))
                  }
                ]}
              >
                <DatePicker showTime format={'YYYY-MM-DD HH:mm:ss'} />
              </Form.Item>
            </>
          )}
        </Form.Item>
        <Form.Item label='debug' name='debug'>
          <Radio.Group options={debugInverseOptions} />
        </Form.Item>
        <Form.Item label='inverse' name='inverse'>
          <Radio.Group options={debugInverseOptions} />
        </Form.Item>
        <Form.Item label='配置Json' name='confField'>
          <Input.TextArea rows={8} />
        </Form.Item>
      </Form>
      <div className='btn-wrap'>
        {isEdit ? (
          <>
            <Button
              type='primary'
              onClick={() => {
                setIsEdit(false)
              }}
            >
              取消
            </Button>
            <Button
              type='primary'
              style={{ marginLeft: 15 }}
              loading={loading}
              onClick={confirmEdit}
            >
              保存
            </Button>
          </>
        ) : (
          <Button
            type='primary'
            onClick={() => {
              setIsEdit(true)
            }}
            disabled={!!address && address !== 'server'}
          >
            编辑
          </Button>
        )}
      </div>
    </div>
  )
}

export default Edit
