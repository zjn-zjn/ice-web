import { Modal, Input, Form, Select, message } from 'antd'
import apis from '../../../../apis'
import { useRequest } from 'ahooks'
import type { TreeItem } from '../tree'
import { RelationNodeMap } from '../tree/constant'
import type { ClassItem } from '../../../../index.d'
import { useState } from 'react'

const relationTypeOptions = [
  { label: 'Relation', value: 1 },
  { label: 'Flow', value: 5 },
  { label: 'Result', value: 6 },
  { label: 'None', value: 7 },
  { label: '节点ID', value: 13 }
]

const nodeTypeOptions = [...RelationNodeMap].map((item) => ({
  label: item[1],
  value: item[0]
}))

interface Props {
  visible: boolean
  closeModal: () => void
  modalType: string
  app: string
  iceId: string
  address: string
  selectedNode: TreeItem | undefined
  refresh: () => void
}

const AddExchangeNodeModal = ({
  visible,
  closeModal,
  modalType,
  app,
  iceId,
  selectedNode,
  refresh
}: Props) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
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

  const onRelationTypeChange = (value: number) => {
    if (value === 1) {
      getClass(1)
    }
  }

  const confirm = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()
      const params = {
        app,
        iceId,
        editType: modalType === 'exchange' ? 5 : modalType === 'front' ? 4 : 1,
        parentId: selectedNode?.parentId,
        selectId: selectedNode?.showConf.nodeId,
        nextId: selectedNode?.nextId,
        index: selectedNode?.index,
        nodeType: values.nodeType,
        name: values.name,
        clazz: values.clazz,
        field: values.field,
        relationType: values.relationType,
        confName: values.confName,
        confField: values.confField,
        multiplexIds: values.multiplexIds
      }
      console.log('AddExchangeNodeModal editConf params:', params)
      await apis.editConf(params)
      console.log('AddExchangeNodeModal editConf success')
      await new Promise(resolve => setTimeout(resolve, 100))
      console.log('AddExchangeNodeModal calling refresh')
      refresh()
      console.log('AddExchangeNodeModal refresh done')
      message.success('success')
      console.log('AddExchangeNodeModal calling closeModal')
      closeModal()
      console.log('AddExchangeNodeModal closeModal done')
    } catch (err: any) {
      console.error('AddExchangeNodeModal error:', err)
      if (err.errorFields) {
        console.log('AddExchangeNodeModal form validation error:', err.errorFields)
        return
      }
      message.error(err.msg || 'server error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      onCancel={closeModal}
      title={
        modalType === 'exchange'
          ? '转换节点'
          : `添加${modalType === 'front' ? '前置节点' : '子节点'}`
      }
      open={visible}
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
          name='relationType'
          label='节点类型'
          rules={[{ required: true, message: '请选择节点类型' }]}
          initialValue={1}
        >
          <Select
            options={relationTypeOptions}
            onChange={onRelationTypeChange}
          />
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(pre, next) => pre.relationType !== next.relationType}
        >
          {(form) => {
            const relationType = form.getFieldValue('relationType')
            return (
              <>
                {relationType === 1 && (
                  <Form.Item
                    name='nodeType'
                    label='关系类型'
                    rules={[{ required: true, message: '请选择节点类型' }]}
                    initialValue={1}
                  >
                    <Select options={nodeTypeOptions} />
                  </Form.Item>
                )}
                {relationType !== 1 && relationType !== 13 && (
                  <>
                    <Form.Item
                      name='confName'
                      label='叶子节点'
                      rules={[{ required: true, message: '请选择/输入节点类' }]}
                    >
                      <Select
                        showSearch
                        optionFilterProp='label'
                        options={(data?.data || []).map((item) => ({
                          label:
                            item.fullName.substring(
                              item.fullName.lastIndexOf('.') + 1
                            ) + (item.name ? '(' + item.name + ')' : ''),
                          value: item.fullName
                        }))}
                      />
                    </Form.Item>
                    <Form.Item name='confField' label='配置Json'>
                      <Input.TextArea rows={6} />
                    </Form.Item>
                  </>
                )}
                {relationType === 13 && (
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

export default AddExchangeNodeModal
