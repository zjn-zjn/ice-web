import { Modal, Table, Button, Popconfirm, App } from 'antd'
import apis from '../../apis'
import { useRequest } from 'ahooks'
import { useEffect } from 'react'
import dayjs from 'dayjs'
import type { HistoryItem } from '../../types'

interface Props {
  name: string
  open: boolean
  onCancel: () => void
  app: string | number
  iceId: string | number
  openExportModal: (id: number, pushId?: number) => void
  getConfigList?: () => void
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
  const { message } = App.useApp()
  const { data: response, run, loading } = useRequest(
    () =>
      apis.pushHistory({
        app: Number(app),
        iceId: Number(iceId)
      }),
    {
      manual: true
    }
  )

  const { run: rollbackRun } = useRequest(
    (pushId: number) => apis.rollback({ app: Number(app), pushId }),
    {
      manual: true,
      onSuccess: () => {
        onCancel()
        getConfigList?.()
        message.success('success')
      },
    }
  )

  const { run: deleteRun } = useRequest(
    (pushId: number) => apis.deleteHistory({ app: Number(app), pushId }),
    {
      manual: true,
      onSuccess: () => {
        run()
        message.success('success')
      },
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
      render: (_: unknown, record: HistoryItem) => (
        <>
          <Popconfirm
            title={`确认将 <${name}> 回滚到 [${record.id}] 版本吗？`}
            onConfirm={() => rollbackRun(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button type="link">回滚</Button>
          </Popconfirm>
          <Button
            type="link"
            onClick={() => openExportModal(record.iceId, record.id)}
          >
            导出
          </Button>
          <Popconfirm
            title={`确认物理删除ID为<${record.id}> 的备份吗？`}
            onConfirm={() => deleteRun(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button type="link">删除</Button>
          </Popconfirm>
        </>
      )
    }
  ]

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
