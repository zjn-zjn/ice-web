import { Input, Button, Space, Pagination } from 'antd'
import { PlusOutlined, CheckSquareOutlined, CloseOutlined } from '@ant-design/icons'
import { useState } from 'react'

interface Props {
  selectMode: boolean
  selectedCount: number
  total: number
  pageNum: number
  pageSize: number
  onBatchMove: () => void
  onBatchExport: () => void
  onBatchDelete: () => void
  onExitSelect: () => void
  onEnterSelect: () => void
  onCreateFolder: (name: string) => void
  onCreateBase: () => void
  onPageChange: (page: number) => void
}

const ActionBar = ({
  selectMode, selectedCount, total, pageNum, pageSize,
  onBatchMove, onBatchExport, onBatchDelete, onExitSelect, onEnterSelect,
  onCreateFolder, onCreateBase, onPageChange
}: Props) => {
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [createFolderName, setCreateFolderName] = useState('')

  const handleCreate = () => {
    if (!createFolderName.trim()) return
    onCreateFolder(createFolderName.trim())
    setCreateFolderName('')
    setShowCreateFolder(false)
  }

  return (
    <div className="folder-bottom-bar">
      <div className="folder-actions-inline">
        {selectMode ? (
          <Space size="small">
            <Button size="small" onClick={onBatchMove} disabled={!selectedCount}>移动</Button>
            <Button size="small" onClick={onBatchExport} disabled={!selectedCount}>导出({selectedCount})</Button>
            <Button size="small" danger onClick={onBatchDelete} disabled={!selectedCount}>删除({selectedCount})</Button>
            <Button size="small" icon={<CloseOutlined />} onClick={onExitSelect} />
          </Space>
        ) : showCreateFolder ? (
          <Space size="small">
            <Input
              size="small"
              placeholder="文件夹名"
              value={createFolderName}
              onChange={(e) => setCreateFolderName(e.target.value)}
              onPressEnter={handleCreate}
              autoFocus
              style={{ width: 120 }}
            />
            <Button size="small" type="primary" onClick={handleCreate}>确定</Button>
            <Button size="small" onClick={() => { setShowCreateFolder(false); setCreateFolderName('') }}>取消</Button>
          </Space>
        ) : (
          <Space size="small">
            <Button size="small" icon={<PlusOutlined />} onClick={() => setShowCreateFolder(true)}>文件夹</Button>
            <Button size="small" icon={<PlusOutlined />} onClick={onCreateBase}>Rule</Button>
            <Button size="small" icon={<CheckSquareOutlined />} onClick={onEnterSelect}>选择</Button>
          </Space>
        )}
      </div>
      {total > pageSize && (
        <Pagination
          size="small"
          current={pageNum}
          pageSize={pageSize}
          total={total}
          onChange={onPageChange}
          showSizeChanger={false}
          simple
        />
      )}
    </div>
  )
}

export default ActionBar
