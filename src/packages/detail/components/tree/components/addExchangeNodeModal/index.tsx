import { Modal, Input, Form, Select, message } from 'antd'
import apis from '../../../../../../apis'
import { useRequest } from 'ahooks'
import { TreeItem } from '../..'
import { RelationNodeMap } from '../../constant'

const nodeTypeOptions = [
  { label: 'Relation', value: 1 },
  { label: 'Flow', value: 5 },
  { label: 'Result', value: 6 },
  { label: 'None', value: 7 },
  { label: '节点ID', value: 13 }
]

const relationTypeOptions = [...RelationNodeMap].map((item) => ({
  label: item[1],
  value: item[0]
}))

interface Props {
  visible: boolean
  closeModal: () => void
  modalType: string
  app: string
  iceId: string
  refresh: () => void
  selectedNode: TreeItem | undefined
}

const AddNodeModal = ({
  visible,
  closeModal,
  modalType,
  app,
  refresh,
  iceId,
  selectedNode
}: Props) => {
  const [form] = Form.useForm()
  const { data, run: getClass } = useRequest<
    {
      data: ClassItem[]
    },
    any[]
  >(
    (type: number) =>
      apis.getClass({
        app,
        type
      }),
    {
      manual: true
    }
  )

  const { run: addNode, loading } = useRequest(
    (params: object) => apis.editConf(params),
    {
      manual: true,
      onSuccess: (res: any) => {
        if (res?.ret === 0) {
          message.success('success')
          closeModal()
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

  const onNodeTypeChange = (value: number) => {
    if (value !== 1 && value !== 13) {
      getClass(value)
    }
  }

  const confirm = () => {
    form
      .validateFields()
      .then((values) => {
        const params = {
          app,
          iceId,
          editType:
            modalType === 'exchange' ? 5 : modalType === 'front' ? 4 : 1,
          selectId: selectedNode?.showConf?.nodeId,
          parentId: selectedNode?.parentId,
          nextId: selectedNode?.nextId,
          ...values,
          confName: values.confName && values.confName[0],
          index: selectedNode?.index
        }
        addNode(params)
      })
      .catch(() => {})
  }

  return (
    <Modal
      onCancel={closeModal}
      title={
        modalType === 'exchange'
          ? '转换节点'
          : `添加${modalType === 'front' ? '前置节点' : '子节点'}`
      }
      visible={visible}
      onOk={confirm}
      confirmLoading={loading}
      width={600}
      afterClose={() => {
        form.resetFields()
      }}
    >
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 14 }}>
        <Form.Item name='name' label='名称'>
          <Input />
        </Form.Item>
        <Form.Item
          name='nodeType'
          label='nodeType'
          rules={[{ required: true, message: '请选择节点类型' }]}
          initialValue={1}
        >
          <Select options={nodeTypeOptions} onChange={onNodeTypeChange} />
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(pre, next) => pre.nodeType !== next.nodeType}
        >
          {(form) => {
            const nodeType = form.getFieldValue('nodeType')
            return (
              <>
                {nodeType === 1 && (
                  <Form.Item
                    name='relationType'
                    label='relationType'
                    rules={[{ required: true, message: '请选择节点类型' }]}
                    initialValue={1}
                  >
                    <Select options={relationTypeOptions} />
                  </Form.Item>
                )}
                {nodeType !== 1 && nodeType !== 13 && (
                  <>
                    <Form.Item
                      name='confName'
                      label='confName'
                      rules={[
                        { required: true, message: '请选择/输入confName' }
                      ]}
                    >
                      <Select
                        mode='tags'
                        maxTagCount={1}
                        options={(data?.data || []).map((item) => ({
                          label: item.shortName,
                          value: item.fullName
                        }))}
                      />
                    </Form.Item>
                    <Form.Item name='confField' label='配置Json'>
                      <Input.TextArea rows={6} />
                    </Form.Item>
                  </>
                )}
                {nodeType === 13 && (
                  <Form.Item
                    name='multiplexIds'
                    label='节点ID(逗号分隔)'
                    rules={[
                      {
                        required: true,
                        message: '节点ID必须填写'
                      }
                    ]}
                  >
                    <Input />
                  </Form.Item>
                )}
              </>
            )
          }}
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default AddNodeModal
