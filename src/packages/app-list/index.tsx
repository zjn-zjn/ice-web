import apis from '../../apis'
import { useState } from 'react'
import { Button, Modal, Form, Input, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useForm } from 'antd/lib/form/Form'
import { useHistory } from 'react-router-dom'
import { useRequest } from 'ahooks'
import './index.less'

const AppList = () => {
  const history = useHistory()
  const [form] = useForm()
  const [visible, setVisible] = useState(false)

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

  const openModal = () => {
    setVisible(true)
  }

  const closeModal = () => {
    setVisible(false)
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
      <Button icon={<PlusOutlined />} onClick={openModal}>
        新增
      </Button>
      <div className='app-list'>
        {list.map((item: AppItem) => {
          return (
            <div
              key={item.id}
              className='app-item'
              onClick={() => {
                linkToList(item.id)
              }}
            >
              <div>{item.name}</div>
              <div>id: {item.id} </div>
              <div>{item.info}</div>
            </div>
          )
        })}
      </div>
      <Modal
        visible={visible}
        onCancel={closeModal}
        onOk={onOk}
        title='新增'
        okText='确认'
        cancelText='取消'
        confirmLoading={loading}
      >
        <Form form={form}>
          <Form.Item label='名称' name='name'>
            <Input />
          </Form.Item>
          <Form.Item label='描述' name='info'>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AppList
