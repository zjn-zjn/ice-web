import { useState, useEffect, useCallback } from 'react'
import { Input, Table, Modal, App } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
import apis from '../../../../apis'
import type { FolderItem } from '../../../../types'
import FolderTreePicker from '../folder-tree-picker'
import EditAddModal from '../../../../components/modals/edit-add-modal'
import type { EditData } from '../../../../components/modals/edit-add-modal'
import ExportModal from '../../../../components/modals/export-modal'
import BackupModal from '../../../../components/modals/backup-modal'
import BackupHistory from '../../../../components/modals/backup-history'
import { getColumns } from './columns'
import ActionBar from './action-bar'

interface Props {
  appId: number
  path: string
  currentBaseId?: string
  onClose: () => void
  onNavigateFolder?: (newPath: string) => void
  onBaseNameChange?: (name: string) => void
}

const getItemKey = (item: FolderItem) => item.type === 'folder' ? `folder-${item.name}` : `base-${item.id}`
const buildPath = (base: string, name: string) => base ? `${base}/${name}` : name

const FolderPopover = ({ appId, path, currentBaseId, onClose, onNavigateFolder, onBaseNameChange }: Props) => {
  const { modal, message } = App.useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [pageNum, setPageNum] = useState(1)
  const [pageSize] = useState(20)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [renamingItem, setRenamingItem] = useState<{ path: string; newName: string } | null>(null)
  const [movePickerOpen, setMovePickerOpen] = useState(false)
  const [moveItems, setMoveItems] = useState<FolderItem[]>([])
  const [createBaseOpen, setCreateBaseOpen] = useState(false)
  const [editItem, setEditItem] = useState<EditData | null>(null)
  const [exportObj, setExportObj] = useState<{ visible: boolean; iceId?: number | string; iceIds?: (number | string)[]; folderPath?: string; folderPaths?: string[]; pushId?: number }>({ visible: false })
  const [backupObj, setBackupObj] = useState<{ visible: boolean; iceId: string | number }>({ visible: false, iceId: '' })
  const [historyObj, setHistoryObj] = useState<{ visible: boolean; iceId: string | number; name: string }>({ visible: false, iceId: '', name: '' })
  const { data, run: fetchList, loading } = useRequest(
    () => apis.folderList({ app: appId, path, pageNum, pageSize, name: search || undefined }),
    { refreshDeps: [appId, path, pageNum, pageSize, search] }
  )

  const refresh = useCallback(() => {
    fetchList()
    setSelectedRowKeys([])
  }, [fetchList])

  useEffect(() => {
    if (data && data.actualPath !== data.path) {
      const newUrl = data.actualPath
        ? `/app/${appId}/base/${data.actualPath}`
        : `/app/${appId}/base`
      navigate(newUrl, { replace: true })
    }
  }, [data, appId, navigate])

  const list = data?.list || []
  const total = data?.total || 0

  const handleItemClick = (item: FolderItem) => {
    if (item.type === 'folder') {
      const newPath = buildPath(path, item.name)
      if (onNavigateFolder) {
        onNavigateFolder(newPath)
      } else {
        navigate(`/app/${appId}/base/${newPath}`)
        onClose()
      }
    } else if (item.id !== undefined) {
      const basePath = buildPath(path, `${item.id}`)
      navigate(`/app/${appId}/base/${basePath}`)
      onClose()
    }
  }

  const handleRename = async () => {
    if (!renamingItem || !renamingItem.newName.trim()) return
    try {
      await apis.folderRename({ app: appId, path: renamingItem.path, newName: renamingItem.newName.trim() })
      setRenamingItem(null)
      message.success('重命名成功')
      refresh()
    } catch {}
  }

  const navigateUp = () => {
    const segments = path.split('/').filter(Boolean)
    segments.pop()
    const parentUrl = segments.length ? `/app/${appId}/base/${segments.join('/')}` : `/app/${appId}/base`
    navigate(parentUrl)
  }

  const handleDelete = (item: FolderItem) => {
    if (item.type === 'folder') {
      const folderPath = buildPath(path, item.name)
      modal.confirm({
        title: `确认删除文件夹 "${item.name}" 吗？`,
        content: item.childCount ? `将删除文件夹下所有 ${item.childCount} 个 Rule` : undefined,
        onOk: async () => {
          await apis.folderDelete({ app: appId, path: folderPath })
          message.success('删除成功')
          refresh()
        }
      })
    } else if (item.id !== undefined) {
      const isCurrentBase = String(item.id) === currentBaseId
      modal.confirm({
        title: `确认删除 Rule #${item.id} 吗？`,
        onOk: async () => {
          await apis.iceDelete({ app: appId, id: item.id! })
          message.success('删除成功')
          refresh()
          if (isCurrentBase) navigateUp()
        }
      })
    }
  }

  const handleBatchDelete = () => {
    const selected = list.filter(item => selectedRowKeys.includes(getItemKey(item)))
    const folders = selected.filter(i => i.type === 'folder')
    const bases = selected.filter(i => i.type === 'base')
    const parts: string[] = []
    if (folders.length) parts.push(`${folders.length} 个文件夹`)
    if (bases.length) parts.push(`${bases.length} 个 Rule`)

    const deletingCurrent = currentBaseId && bases.some(i => String(i.id) === currentBaseId)
    modal.confirm({
      title: `确认删除 ${parts.join('、')} 吗？`,
      onOk: async () => {
        await apis.batchDelete({
          app: appId,
          items: selected.map(i => ({
            type: i.type,
            ...(i.type === 'folder' ? { path: buildPath(path, i.name), name: i.name } : { id: i.id })
          }))
        })
        message.success('删除成功')
        refresh()
        if (deletingCurrent) navigateUp()
      }
    })
  }

  const openMovePicker = (items: FolderItem[]) => {
    setMoveItems(items)
    setMovePickerOpen(true)
  }

  const handleMove = async (targetPath: string) => {
    await apis.batchMove({
      app: appId,
      items: moveItems.map(i => ({
        type: i.type,
        ...(i.type === 'folder' ? { path: buildPath(path, i.name), name: i.name } : { id: i.id })
      })),
      targetPath
    })
    setMovePickerOpen(false)
    message.success('移动成功')
    refresh()
  }

  const getMenuItems = (item: FolderItem) => {
    if (item.type === 'folder') {
      const folderPath = buildPath(path, item.name)
      return [
        { key: 'rename', label: '重命名', onClick: () => setRenamingItem({ path: folderPath, newName: item.name }) },
        { key: 'export', label: '导出', onClick: () => setExportObj({ visible: true, folderPath }) },
        { key: 'move', label: '移动', onClick: () => openMovePicker([item]) },
        { key: 'delete', label: '删除', danger: true, onClick: () => handleDelete(item) }
      ]
    }
    return [
      { key: 'edit', label: '编辑', onClick: () => setEditItem({ id: item.id!, name: item.name, scenes: item.scenes, debug: item.debug }) },
      { key: 'export', label: '导出', onClick: () => setExportObj({ visible: true, iceId: item.id }) },
      { key: 'backup', label: '备份', onClick: () => setBackupObj({ visible: true, iceId: item.id! }) },
      { key: 'history', label: '历史', onClick: () => setHistoryObj({ visible: true, iceId: item.id!, name: item.name || `#${item.id}` }) },
      { key: 'move', label: '移动', onClick: () => openMovePicker([item]) },
      { key: 'delete', label: '删除', danger: true, onClick: () => handleDelete(item) }
    ]
  }

  const handleBatchExport = () => {
    const selected = list.filter(item => selectedRowKeys.includes(getItemKey(item)))
    const baseIds = selected.filter(i => i.type === 'base' && i.id !== undefined).map(i => i.id!)
    const folderPaths = selected.filter(i => i.type === 'folder').map(i => buildPath(path, i.name))
    if (baseIds.length || folderPaths.length) {
      setExportObj({ visible: true, iceIds: baseIds.length ? baseIds : undefined, folderPaths: folderPaths.length ? folderPaths : undefined })
    }
  }

  const handleBatchMove = () => {
    const selected = list.filter(item => selectedRowKeys.includes(getItemKey(item)))
    openMovePicker(selected)
  }

  const columns = getColumns({ currentBaseId, handleItemClick, getMenuItems })

  return (
    <div className="folder-popover-content">
      <div className="folder-toolbar">
        <Input
          className="folder-search"
          placeholder="搜索..."
          allowClear
          size="small"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPageNum(1) }}
          style={{ flex: 1 }}
        />
      </div>

      <Table
        size="small"
        columns={columns}
        dataSource={list}
        rowKey={getItemKey}
        loading={loading}
        pagination={false}
        rowSelection={selectMode ? {
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        } : undefined}
        scroll={{ y: 360 }}
      />

      <ActionBar
        selectMode={selectMode}
        selectedCount={selectedRowKeys.length}
        total={total}
        pageNum={pageNum}
        pageSize={pageSize}
        onBatchMove={handleBatchMove}
        onBatchExport={handleBatchExport}
        onBatchDelete={handleBatchDelete}
        onExitSelect={() => { setSelectMode(false); setSelectedRowKeys([]) }}
        onEnterSelect={() => setSelectMode(true)}
        onCreateFolder={async (name) => {
          try {
            await apis.folderCreate({ app: appId, path, name })
            message.success('创建成功')
            refresh()
          } catch {}
        }}
        onCreateBase={() => setCreateBaseOpen(true)}
        onPageChange={setPageNum}
      />

      <Modal
        title="重命名文件夹"
        open={!!renamingItem}
        onCancel={() => setRenamingItem(null)}
        onOk={handleRename}
      >
        <Input
          value={renamingItem?.newName || ''}
          onChange={(e) => renamingItem && setRenamingItem({ ...renamingItem, newName: e.target.value })}
          onPressEnter={handleRename}
        />
      </Modal>

      <FolderTreePicker
        open={movePickerOpen}
        appId={appId}
        onCancel={() => setMovePickerOpen(false)}
        onOk={handleMove}
      />

      <EditAddModal
        open={createBaseOpen}
        onCancel={() => setCreateBaseOpen(false)}
        onOk={() => { setCreateBaseOpen(false); refresh() }}
        app={appId}
        folderPath={path}
      />

      <EditAddModal
        open={!!editItem}
        data={editItem}
        onCancel={() => setEditItem(null)}
        onOk={(name) => {
          if (editItem && String(editItem.id) === currentBaseId && name !== undefined) {
            onBaseNameChange?.(name)
          }
          setEditItem(null)
          refresh()
        }}
        app={appId}
      />

      <ExportModal
        open={exportObj.visible}
        iceId={exportObj.iceId}
        iceIds={exportObj.iceIds}
        folderPath={exportObj.folderPath}
        folderPaths={exportObj.folderPaths}
        pushId={exportObj.pushId}
        onCancel={() => setExportObj({ visible: false })}
        onOk={() => setExportObj({ visible: false })}
        app={appId}
      />

      <BackupModal
        open={backupObj.visible}
        iceId={backupObj.iceId}
        onCancel={() => setBackupObj({ visible: false, iceId: '' })}
        onOk={() => setBackupObj({ visible: false, iceId: '' })}
        app={appId}
      />

      <BackupHistory
        open={historyObj.visible}
        iceId={historyObj.iceId}
        name={historyObj.name}
        app={appId}
        onCancel={() => setHistoryObj({ visible: false, iceId: '', name: '' })}
        openExportModal={(id: number, pushId?: number) => {
          setExportObj({ visible: true, iceId: id, pushId })
          setHistoryObj({ visible: false, iceId: '', name: '' })
        }}
      />

    </div>
  )
}

export default FolderPopover
