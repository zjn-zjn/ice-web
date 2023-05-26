import { Modal, Table, Button, Popconfirm, message } from 'antd'
import apis from '../../../../apis'
import { useRequest } from 'ahooks'
import { useEffect } from 'react'
import dayjs from 'dayjs'

interface HistoryItem {
  id: number
  app: number
  iceId: number
  reason: string
  operator: string
  createAt: string
}

interface Props {
  name: string
  visible: boolean
  closeModal: () => void
  app: string
  iceId: string | number
  openExportModal: (id: number, pushId?: number) => void
  getConfigList: () => void
}

const BackupHistory = ({
  visible,
  closeModal,
  app,
  iceId,
  openExportModal,
  name,
  getConfigList
}: Props) => {
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

  const { run: rollbackRun } = useRequest(
    (pushId: number) => apis.rollback({ pushId }),
    {
      manual: true,
      onSuccess: (res: any) => {
        if (res?.ret === 0) {
          closeModal()
          getConfigList()
          message.success('success')
        } else {
          message.error(res?.data?.msg || 'failed')
        }
      },
      onError: (err: any) => {
        message.error(err.msg || 'server error')
      }
    }
  )

  const { run: deleteRun } = useRequest(
    (pushId: number) => apis.deleteHistory({ pushId }),
    {
      manual: true,
      onSuccess: (res: any) => {
        if (res?.ret === 0) {
          run()
        } else {
          message.error(res?.data?.msg || 'failed')
        }
      },
      onError: (err: any) => {
        message.error(err.msg || 'server error')
      }
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
      dataIndex: 'createAt',
      render: (text: string) =>
        text && dayjs(text).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '备注',
      dataIndex: 'reason'
    },
    {
      title: '操作',
      dataIndex: 'operation',
      render: (text: any, record: HistoryItem) => (
        <>
          <Popconfirm
            title={`确认将 <${name}> 回滚到 [${record.id}] 版本吗？`}
            onConfirm={() => pushRollback(record.id)}
            okText='是'
            cancelText='否'
          >
            <Button type='link'>回滚</Button>
          </Popconfirm>
          <Button
            type='link'
            onClick={() => exportIce(record.iceId, record.id)}
          >
            导出
          </Button>
          <Popconfirm
            title={`确认物理删除ID为<${record.id}> 的备份吗？`}
            onConfirm={() => deleteHistory(record.id)}
            okText='是'
            cancelText='否'
          >
            <Button type='link'>删除</Button>
          </Popconfirm>
        </>
      )
    }
  ]

  const pushRollback = (pushId: number) => {
    rollbackRun(pushId)
  }

  const exportIce = (iceId: number, pushId: number) => {
    closeModal()
    openExportModal(iceId, pushId)
  }

  const deleteHistory = (pushId: number) => {
    deleteRun(pushId)
  }

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
