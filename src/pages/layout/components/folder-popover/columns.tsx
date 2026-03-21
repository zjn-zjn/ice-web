import { Dropdown, Tag, Tooltip } from 'antd'
import { FolderOutlined, MoreOutlined, AppstoreOutlined } from '@ant-design/icons'
import type { FolderItem } from '../../../../types'

const debugLabels: [number, string, string][] = [[1, 'I', '输入'], [2, 'P', '过程'], [4, 'O', '输出']]
const formatDebug = (debug?: number) => {
  if (!debug) return '-'
  const tags = debugLabels.filter(([v]) => (debug! & v) !== 0)
  return <div style={{ display: 'flex', gap: 2 }}>{tags.map(([v, s, tip]) => <Tooltip key={v} title={tip}><Tag style={{ margin: 0, cursor: 'default' }}>{s}</Tag></Tooltip>)}</div>
}

interface ColumnOptions {
  currentBaseId?: string
  handleItemClick: (item: FolderItem) => void
  getMenuItems: (item: FolderItem) => any[]
}

export const getColumns = ({ currentBaseId, handleItemClick, getMenuItems }: ColumnOptions) => [
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
      <div className="folder-cell-click" onClick={(e) => { e.stopPropagation(); handleItemClick(item) }}>
        {item.type === 'folder'
          ? <><FolderOutlined style={{ color: 'var(--color-warning)', marginRight: 6 }} />{item.name} {item.childCount ? <span style={{ color: 'var(--color-text-tertiary)' }}>({item.childCount})</span> : null}</>
          : <><AppstoreOutlined style={{ color: 'var(--color-primary)', marginRight: 6 }} />{item.name || '-'}</>
        }
        {item.type === 'base' && String(item.id) === currentBaseId && <Tag color="blue" style={{ marginLeft: 4 }}>当前</Tag>}
      </div>
    )
  },
  {
    title: '场景',
    key: 'scenes',
    width: 80,
    ellipsis: { showTitle: false },
    render: (_: any, item: FolderItem) => item.type === 'base' ? (item.scenes || '-') : null
  },
  {
    title: 'Log',
    key: 'debug',
    width: 90,
    render: (_: any, item: FolderItem) => item.type === 'base' ? formatDebug(item.debug) : null
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
