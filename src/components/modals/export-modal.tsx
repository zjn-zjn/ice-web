import { Modal, Button, Input, Alert } from 'antd'
import apis from '../../apis'
import { useRequest } from 'ahooks'
import copy from 'copy-to-clipboard'
import { useEffect } from 'react'

interface Props {
  open: boolean
  iceId?: number | string
  iceIds?: (number | string)[]
  folderPath?: string
  folderPaths?: string[]
  pushId?: number
  onCancel: () => void
  onOk: () => void
  app: string | number
}

const mergeResults = (results: string[], app: number): string => {
  const merged: { app: number; bases: any[]; confs: any[] } = {
    app, bases: [], confs: []
  }
  const confMap = new Map<number, any>()
  for (const r of results) {
    try {
      const parsed = JSON.parse(r)
      if (parsed.bases) merged.bases.push(...parsed.bases)
      if (parsed.confs) {
        for (const c of parsed.confs) confMap.set(c.id, c)
      }
    } catch {}
  }
  merged.confs = Array.from(confMap.values())
  return JSON.stringify(merged)
}

const ExportModal = ({ open, iceId, iceIds, folderPath, folderPaths, pushId, onCancel, onOk, app }: Props) => {
  const allFolderPaths = folderPaths || (folderPath !== undefined ? [folderPath] : [])
  const isBatch = (iceIds && iceIds.length > 0) || allFolderPaths.length > 0
  const isSingleFolder = !iceIds?.length && allFolderPaths.length === 1 && !iceId

  const { data, run } = useRequest(
    async () => {
      if (!isBatch && iceId !== undefined) {
        return apis.iceExport({ iceId: Number(iceId), app: Number(app), pushId })
      }
      const requests: Promise<string>[] = []
      if (iceIds && iceIds.length > 0) {
        requests.push(apis.iceExportBatch({ iceIds: iceIds.map(Number), app: Number(app) }))
      }
      for (const fp of allFolderPaths) {
        requests.push(apis.exportFolder({ app: Number(app), path: fp }))
      }
      const results = await Promise.all(requests)
      return mergeResults(results, Number(app))
    },
    {
      manual: true
    }
  )

  useEffect(() => {
    if (open) {
      run()
    }
  }, [iceId, iceIds, folderPath, folderPaths, pushId, open, run])

  const onCopy = () => {
    if (data) {
      copy(data)
      onOk()
    }
  }

  const formatJson = () => {
    if (!data) return '{}'
    try {
      const parsed = JSON.parse(data)
      return JSON.stringify(parsed, null, 2)
    } catch (e) {
      return data
    }
  }

  const title = isSingleFolder ? '导出文件夹' : isBatch ? '批量导出' : '导出ICE'

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={isBatch ? 720 : 520}
    >
      <Alert message="导出不包含编辑中内容" type="info" showIcon style={{ marginBottom: 10 }} />
      <Input.TextArea
        rows={20}
        cols={10}
        value={formatJson()}
      />
      <Button onClick={onCopy} style={{ marginTop: 10 }}>
        复制配置
      </Button>
    </Modal>
  )
}

export default ExportModal
