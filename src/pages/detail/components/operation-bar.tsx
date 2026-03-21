import { Button, Cascader, Space, Badge } from 'antd'
import { AimOutlined, ReloadOutlined } from '@ant-design/icons'

interface Props {
  selectorValue: string[]
  cascaderOptions: any[]
  onSelectorChange: (value: (string | number)[]) => void
  updateCount: number
  hasClients: boolean
  onImport: () => void
  onExport: () => void
  onRelease: () => void
  onClean: () => void
  onMock: () => void
  onResetView: () => void
  onRefresh: () => void
}

const getCascaderWidth = (value: string[]) => {
  if (!value.length || (value.length === 1 && value[0] === 'trunk')) return 90
  const text = value[value.length - 1] || ''
  return Math.max(90, Math.min(300, text.length * 9 + 60))
}

const OperationBar = ({
  selectorValue, cascaderOptions, onSelectorChange,
  updateCount, hasClients, onImport, onExport, onRelease, onClean,
  onMock, onResetView, onRefresh
}: Props) => (
  <div className="operation-wrap">
    <Space size={12}>
      <Cascader
        value={selectorValue}
        options={cascaderOptions}
        onChange={onSelectorChange}
        changeOnSelect
        expandTrigger="hover"
        style={{ width: getCascaderWidth(selectorValue) }}
        placeholder="主干"
        allowClear={false}
      />
      <Button onClick={onImport}>导入</Button>
      <Button onClick={onExport}>导出</Button>
      <Badge count={updateCount} size="small" offset={[-4, 2]}>
        <Button onClick={onRelease} disabled={!updateCount}
          className={updateCount ? 'release-btn-active' : undefined}>发布</Button>
      </Badge>
      <Button onClick={onClean} disabled={!updateCount}>清除</Button>
      <Button onClick={onMock} disabled={!hasClients}>Mock</Button>
      <Button icon={<AimOutlined />} onClick={onResetView} />
      <Button icon={<ReloadOutlined />} onClick={onRefresh} title="刷新" />
    </Space>
  </div>
)

export default OperationBar
