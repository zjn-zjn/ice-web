import apis from '../../apis'
import { useState } from 'react'
import { Button, Modal, Form, Input, message } from 'antd'
import { FormOutlined } from '@ant-design/icons'
import { PlusOutlined } from '@ant-design/icons'
import { useForm } from 'antd/lib/form/Form'
import { useHistory } from 'react-router-dom'
import { useRequest } from 'ahooks'
import './index.less'

const AppList = () => {
  const history = useHistory()
  const [form] = useForm()
  const [editModel, setEditModel] = useState({ type: 1, visible: false, name: '', info: '', id: 0 })

  const { data, run: getList } = useRequest<
    {
      data: {
        list: AppItem[]
      }
    },
    any[]
  >(apis.appList)

  const { run: add, loading } = useRequest(
    (params: object) => apis.appEdit(params),
    {
      manual: true,
      onSuccess: (res: any) => {
        if (res?.ret === 0) {
          getList()
          closeModal()
        } else {
          message.error(res?.data?.msg || 'failed')
        }
      },
      onError: (err: any) => {
        message.error(err.msg || 'server error')
      }
    }
  )

  const openModal = (type: 1 | 2, name?: any, info?: any, id?: any) => {
    setEditModel({ type: type, visible: true, name: name, info: info, id: id })
  }

  const closeModal = () => {
    setEditModel({ type: 1, visible: false, name: '', info: '', id: 0 })
    form.resetFields()
  }

  const onOk = () => {
    add(form.getFieldsValue())
  }

  const linkToList = (id: number) => {
    history.push(`/config/list?id=${id}`)
  }

  const list = data?.data?.list || []

  return (
    <div>
      <Button icon={<PlusOutlined />} onClick={() => openModal(1)}>
        新增
      </Button>
      <div className='app-list'>
        {list.map((item: AppItem) => (
          <div key={item.id} className='app-item' onClick={() => { linkToList(item.id) }}>
            <div className="app-edit">
              <FormOutlined onClick={(e: any) => {
                e.stopPropagation()
                return openModal(2, item.name, item.info, item.id)
              }} />
            </div>
            <p>{item.name}</p>
            <p>app: {item.id} </p>
            <p>{item.info}</p>
          </div>
        ))}
      </div>
      <Modal
        visible={editModel.visible}
        onCancel={closeModal}
        onOk={onOk}
        title={editModel.type === 1 ? "新增" : "编辑"}
        okText='确认'
        cancelText='取消'
        confirmLoading={loading}
      >
        <Form form={form}>
          <Form.Item name='id' initialValue={editModel.id > 0 ? editModel.id : null} hidden={true}>
          </Form.Item>
          <Form.Item label='名称' name='name' initialValue={editModel.name}>
            <Input />
          </Form.Item>
          <Form.Item label='描述' name='info' initialValue={editModel.info}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AppList
