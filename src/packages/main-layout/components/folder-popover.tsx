import { useState, useEffect, useCallback } from 'react'
import { Input, Button, Table, Dropdown, Modal, Space, Pagination, Tag, message } from 'antd'
import { FolderOutlined, PlusOutlined, MoreOutlined, CheckSquareOutlined, CloseOutlined, AppstoreOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
import apis from '../../../apis'
import type { FolderItem } from '../../../index.d'
import FolderTreePicker from './folder-tree-picker'
import EditAddModal from '../../config-list/components/edit-add-modal'
import ExportModal from '../../config-list/components/export-modal'
import BackupModal from '../../config-list/components/backup-modal'
import BackupHistory from '../../config-list/components/backup-history'
import ImportModal from '../../config-list/components/import-modal'

interface Props {
  appId: number
  path: string
  currentBaseId?: string
  onClose: () => void
  onNavigateFolder?: (newPath: string) => void
}

const FolderPopover = ({ appId, path, currentBaseId, onClose, onNavigateFolder }: Props) => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [pageNum, setPageNum] = useState(1)
  const [pageSize] = useState(20)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [createFolderName, setCreateFolderName] = useState('')
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [renamingItem, setRenamingItem] = useState<{ path: string; newName: string } | null>(null)
  const [movePickerOpen, setMovePickerOpen] = useState(false)
  const [moveItems, setMoveItems] = useState<FolderItem[]>([])
  const [createBaseOpen, setCreateBaseOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [exportObj, setExportObj] = useState<{ visible: boolean; iceId?: number | string; pushId?: number }>({ visible: false })
  const [backupObj, setBackupObj] = useState<{ visible: boolean; iceId: string | number }>({ visible: false, iceId: '' })
  const [historyObj, setHistoryObj] = useState<{ visible: boolean; iceId: string | number; name: string }>({ visible: false, iceId: '', name: '' })
  const [importVisible, setImportVisible] = useState(false)

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
      const newPath = path ? `${path}/${item.name}` : item.name
      if (onNavigateFolder) {
        onNavigateFolder(newPath)
      } else {
        navigate(`/app/${appId}/base/${newPath}`)
        onClose()
      }
    } else if (item.id !== undefined) {
      const basePath = path ? `${path}/${item.id}` : `${item.id}`
      navigate(`/app/${appId}/base/${basePath}`)
      onClose()
    }
  }

  const handleCreateFolder = async () => {
    if (!createFolderName.trim()) return
    try {
      await apis.folderCreate({ app: appId, path, name: createFolderName.trim() })
      setCreateFolderName('')
      setShowCreateFolder(false)
      message.success('创建成功')
      refresh()
    } catch {}
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
    const parentUrl = path ? `/app/${appId}/base/${path}` : `/app/${appId}/base`
    navigate(parentUrl)
  }

  const handleDelete = (item: FolderItem) => {
    if (item.type === 'folder') {
      const folderPath = path ? `${path}/${item.name}` : item.name
      Modal.confirm({
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
      Modal.confirm({
        title: `确认删除 Rule #${item.id} 吗？`,
        onOk: async () => {
          await apis.iceDelete({ app: appId, id: item.id! })
          message.success('删除成功')
          refresh()
          if (isCurrentBase) {
            navigateUp()
          }
        }
      })
    }
  }

  const handleBatchDelete = () => {
    const selected = list.filter(item => {
      const key = item.type === 'folder' ? `folder-${item.name}` : `base-${item.id}`
      return selectedRowKeys.includes(key)
    })
    const folders = selected.filter(i => i.type === 'folder')
    const bases = selected.filter(i => i.type === 'base')
    const parts: string[] = []
    if (folders.length) parts.push(`${folders.length} 个文件夹`)
    if (bases.length) parts.push(`${bases.length} 个 Rule`)

    const deletingCurrent = currentBaseId && bases.some(i => String(i.id) === currentBaseId)
    Modal.confirm({
      title: `确认删除 ${parts.join('、')} 吗？`,
      onOk: async () => {
        await apis.batchDelete({
          app: appId,
          items: selected.map(i => ({
            type: i.type,
            ...(i.type === 'folder' ? { path: path ? `${path}/${i.name}` : i.name, name: i.name } : { id: i.id })
          }))
        })
        message.success('删除成功')
        refresh()
        if (deletingCurrent) {
          navigateUp()
        }
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
        ...(i.type === 'folder' ? { path: path ? `${path}/${i.name}` : i.name, name: i.name } : { id: i.id })
      })),
      targetPath
    })
    setMovePickerOpen(false)
    message.success('移动成功')
    refresh()
  }

  const getMenuItems = (item: FolderItem) => {
    if (item.type === 'folder') {
      const folderPath = path ? `${path}/${item.name}` : item.name
      return [
        { key: 'rename', label: '重命名', onClick: () => setRenamingItem({ path: folderPath, newName: item.name }) },
        { key: 'move', label: '移动到', onClick: () => openMovePicker([item]) },
        { key: 'delete', label: '删除', danger: true, onClick: () => handleDelete(item) }
      ]
    }
    return [
      { key: 'edit', label: '编辑', onClick: () => setEditItem({ id: item.id, name: item.name, scenes: item.scenes, debug: item.debug }) },
      { key: 'export', label: '导出', onClick: () => setExportObj({ visible: true, iceId: item.id }) },
      { key: 'backup', label: '备份', onClick: () => setBackupObj({ visible: true, iceId: item.id! }) },
      { key: 'history', label: '历史', onClick: () => setHistoryObj({ visible: true, iceId: item.id!, name: item.name || `#${item.id}` }) },
      { key: 'move', label: '移动到', onClick: () => openMovePicker([item]) },
      { key: 'delete', label: '删除', danger: true, onClick: () => handleDelete(item) }
    ]
  }

  const columns: any[] = [
    {
      title: 'ID',
      key: 'id',
      width: 60,
      render: (_: any, item: FolderItem) => item.type === 'base' ? item.id : null
    },
    {
      title: '名称',
      key: 'name',
      ellipsis: true,
      render: (_: any, item: FolderItem) => (
        <div style={{ cursor: 'pointer', margin: '-8px -8px', padding: '8px 8px' }} onClick={(e) => { e.stopPropagation(); handleItemClick(item) }}>
          {item.type === 'folder'
            ? <><FolderOutlined style={{ color: '#faad14', marginRight: 6 }} />{item.name} {item.childCount ? <span style={{ color: '#999' }}>({item.childCount})</span> : null}</>
            : <><AppstoreOutlined style={{ color: '#1677ff', marginRight: 6 }} />{item.name || '-'}</>
          }
          {item.type === 'base' && String(item.id) === currentBaseId && <Tag color="blue" style={{ marginLeft: 4 }}>当前</Tag>}
        </div>
      )
    },
    {
      title: '场景',
      key: 'scenes',
      width: 80,
      ellipsis: true,
      render: (_: any, item: FolderItem) => item.type === 'base' ? (item.scenes || '-') : null
    },
    {
      title: 'Log',
      key: 'debug',
      width: 50,
      render: (_: any, item: FolderItem) => item.type === 'base' ? (item.debug ?? '-') : null
    },
    {
      title: '',
      key: 'action',
      width: 36,
      render: (_: any, item: FolderItem) => (
        <Dropdown menu={{ items: getMenuItems(item) }} trigger={['click']}>
          <MoreOutlined style={{ cursor: 'pointer' }} onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      )
    }
  ]

  const handleBatchMove = () => {
    const selected = list.filter(item => {
      const key = item.type === 'folder' ? `folder-${item.name}` : `base-${item.id}`
      return selectedRowKeys.includes(key)
    })
    openMovePicker(selected)
  }

  return (
    <div className="folder-popover-content">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
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
        rowKey={(item) => item.type === 'folder' ? `folder-${item.name}` : `base-${item.id}`}
        loading={loading}
        pagination={false}
        rowSelection={selectMode ? {
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        } : undefined}
        scroll={{ y: 360 }}
      />

      {/* Bottom bar: actions + pagination in one row */}
      <div className="folder-bottom-bar">
        <div className="folder-actions-inline">
          {selectMode ? (
            <Space size="small">
              <Button size="small" onClick={handleBatchMove} disabled={!selectedRowKeys.length}>移动</Button>
              <Button size="small" danger onClick={handleBatchDelete} disabled={!selectedRowKeys.length}>删除({selectedRowKeys.length})</Button>
              <Button size="small" icon={<CloseOutlined />} onClick={() => { setSelectMode(false); setSelectedRowKeys([]) }} />
            </Space>
          ) : showCreateFolder ? (
            <Space size="small">
              <Input
                size="small"
                placeholder="文件夹名"
                value={createFolderName}
                onChange={(e) => setCreateFolderName(e.target.value)}
                onPressEnter={handleCreateFolder}
                autoFocus
                style={{ width: 120 }}
              />
              <Button size="small" type="primary" onClick={handleCreateFolder}>确定</Button>
              <Button size="small" onClick={() => { setShowCreateFolder(false); setCreateFolderName('') }}>取消</Button>
            </Space>
          ) : (
            <Space size="small">
              <Button size="small" icon={<PlusOutlined />} onClick={() => setShowCreateFolder(true)}>文件夹</Button>
              <Button size="small" icon={<PlusOutlined />} onClick={() => setCreateBaseOpen(true)}>Rule</Button>
              <Button size="small" icon={<CheckSquareOutlined />} onClick={() => setSelectMode(true)}>选择</Button>
            </Space>
          )}
        </div>
        {total > pageSize && (
          <Pagination
            size="small"
            current={pageNum}
            pageSize={pageSize}
            total={total}
            onChange={(p) => setPageNum(p)}
            showSizeChanger={false}
            simple
          />
        )}
      </div>

      {/* Modals - all rendered inside popover so they stack on top */}
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
        onOk={() => {
          setCreateBaseOpen(false)
          refresh()
        }}
        app={appId}
        folderPath={path}
      />

      <EditAddModal
        open={!!editItem}
        data={editItem}
        onCancel={() => setEditItem(null)}
        onOk={() => {
          setEditItem(null)
          refresh()
        }}
        app={appId}
      />

      <ExportModal
        open={exportObj.visible}
        iceId={exportObj.iceId}
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

      <ImportModal
        open={importVisible}
        onCancel={() => setImportVisible(false)}
        onOk={() => {
          setImportVisible(false)
          refresh()
        }}
        app={appId}
      />
    </div>
  )
}

export default FolderPopover
