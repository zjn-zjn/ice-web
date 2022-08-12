import { Modal, Table, Button } from 'antd'
import apis from '../../../../apis'
import { useRequest } from 'ahooks'
import { useEffect } from 'react'

interface HistoryItem {
  id: number
  app: number
  iceId: number
  reason: string
  operator: string
  createAt: string
}

interface Props {
  visible: boolean
  closeModal: () => void
  app: string
  iceId: string | number
}

const BackupHistory = ({ visible, closeModal, app, iceId }: Props) => {
  const { data, run, loading } = useRequest<
    {
      data: {
        list: HistoryItem[]
      }
    },
    any[]
  >(
    () =>
      apis.pushHistory({
        app,
        iceId
      }),
    {
      manual: true
    }
  )

  useEffect(() => {
    if (visible) {
      run()
    }
  }, [visible])

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id'
    },
    {
      title: '操作人',
      dataIndex: 'operator'
    },
    {
      title: '时间',
      dataIndex: 'createAt'
      // render: (text: any) =>
      //   text && <p>{moment(text).format('YYYY-MM-DD HH:mm:ss')}</p>
    },
    {
      title: '备注',
      dataIndex: 'reason'
    },
    {
      title: '操作',
      dataIndex: 'operation',
      render: (text: any, record: any) => (
        <>
          <Button type='link' onClick={() => pushRollback(record.id)}>
            回滚
          </Button>
          <Button
            type='link'
            onClick={() => exportIce(record.iceId, record.id)}
          >
            导出
          </Button>
          <Button type='link' onClick={() => deleteHistory(record.id)}>
            删除
          </Button>
        </>
      )
    }
  ]

  const pushRollback = (id: number) => {}

  const exportIce = (iceId: number, id: number) => {}

  const deleteHistory = (id: number) => {}

  return (
    <Modal
      onCancel={closeModal}
      title='备份历史'
      visible={visible}
      footer={null}
      width={900}
    >
      <Table<HistoryItem>
        rowKey='id'
        columns={columns}
        loading={loading}
        dataSource={data?.data?.list}
      />
    </Modal>
  )
}

export default BackupHistory
