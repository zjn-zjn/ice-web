import { Modal, Table, Button, Popconfirm, message } from 'antd'
import apis from '../../../apis'
import { useRequest } from 'ahooks'
import { useEffect } from 'react'
import dayjs from 'dayjs'

interface HistoryItem {
  id: number
  app: number
  iceId: number
  reason?: string
  operator: string
  createAt: string
}

interface Props {
  name: string
  open: boolean
  onCancel: () => void
  app: string
  iceId: string | number
  openExportModal: (id: number, pushId?: number) => void
  getConfigList: () => void
}

const BackupHistory = ({
  open,
  onCancel,
  app,
  iceId,
  openExportModal,
  name,
  getConfigList
}: Props) => {
  const { data: response, run, loading } = useRequest(
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
      onSuccess: () => {
        onCancel()
        getConfigList()
        message.success('success')
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
      onSuccess: () => {
        run()
        message.success('success')
      },
      onError: (err: any) => {
        message.error(err.msg || 'server error')
      }
    }
  )

  useEffect(() => {
    if (open) {
      run()
    }
  }, [open])

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
            okText="是"
            cancelText="否"
          >
            <Button type="link">回滚</Button>
          </Popconfirm>
          <Button
            type="link"
            onClick={() => exportIce(record.iceId, record.id)}
          >
            导出
          </Button>
          <Popconfirm
            title={`确认物理删除ID为<${record.id}> 的备份吗？`}
            onConfirm={() => deleteHistory(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button type="link">删除</Button>
          </Popconfirm>
        </>
      )
    }
  ]

  const pushRollback = (pushId: number) => {
    rollbackRun(pushId)
  }

  const exportIce = (iceId: number, pushId: number) => {
    openExportModal(iceId, pushId)
  }

  const deleteHistory = (pushId: number) => {
    deleteRun(pushId)
  }

  return (
    <Modal
      title="备份历史"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={900}
    >
      <Table<HistoryItem>
        rowKey="id"
        columns={columns}
        loading={loading}
        dataSource={response?.list}
      />
    </Modal>
  )
}

export default BackupHistory
