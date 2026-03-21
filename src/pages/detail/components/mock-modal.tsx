import { Tabs, DatePicker, Input, Button, Space, Tag, Typography, App, theme } from 'antd'
import { DeleteOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRequest } from 'ahooks'
import apis from '../../../apis'
import dayjs from 'dayjs'

export interface MockProcessNode {
  confId: number
  name: string
  state: string  // T, F, N, O, S, R
  costMs?: number
}

export function parseProcess(process: string): MockProcessNode[] {
  const result: MockProcessNode[] = []
  const regex = /\[(\d+):([^:]*):([A-Z](?:-[A-Z])?)(?::(\d+))?\]/g
  let match
  while ((match = regex.exec(process)) !== null) {
    result.push({
      confId: parseInt(match[1]),
      name: match[2],
      state: match[3].charAt(0),
      costMs: match[4] !== undefined ? parseInt(match[4]) : undefined,
    })
  }
  return result
}

interface MockModalProps {
  open: boolean
  onClose: () => void
  app: number
  iceId?: number
  confId?: number
  nodeName?: string
  lane?: string
  address?: string
  selectorValue: string[]
  onProcessResult?: (nodes: MockProcessNode[]) => void
  onFallback?: () => void
}

interface SchemaField {
  key: string
  nodeId: number
  nodeName: string
  dynamic: boolean
}

interface RoamField {
  key: string
  value: string
  dynamic: boolean
}

interface MockResultData {
  mockId: string
  success: boolean
  roam?: Record<string, any>
  trace?: string
  ts?: number
  process?: string
  error?: string
  fallback?: boolean
  executeAt: number
}

function deriveTarget(selectorValue: string[]): { target: string } {
  if (!selectorValue.length || (selectorValue[0] === 'trunk' && selectorValue.length === 1)) {
    return { target: 'all' }
  }
  if (selectorValue[0] === 'trunk' && selectorValue.length > 1) {
    return { target: `address:${selectorValue[1]}` }
  }
  if (selectorValue.length === 1) {
    return { target: `lane:${selectorValue[0]}` }
  }
  return { target: `address:${selectorValue[1]}` }
}

const MockModal = ({ open, onClose, app, iceId, confId, nodeName, lane, address, selectorValue, onProcessResult, onFallback }: MockModalProps) => {
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const [activeTab, setActiveTab] = useState('form')
  const [ts, setTs] = useState<dayjs.Dayjs>(dayjs())
  const [fields, setFields] = useState<RoamField[]>([])
  const [jsonText, setJsonText] = useState('{}')
  const [result, setResult] = useState<MockResultData | null>(null)

  // Drag state - use ref to remember position across open/close
  const lastPos = useRef({ x: 12, y: 12 })
  const [pos, setPos] = useState({ x: 12, y: 12 })
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panelRef = useRef<HTMLDivElement>(null)

  const { target } = deriveTarget(selectorValue)

  const schemaParams = {
    app,
    ...(iceId ? { iceId } : {}),
    ...(confId ? { confId } : {}),
    ...(lane ? { lane } : {}),
    ...(address ? { address } : {}),
  }

  const { loading: schemaLoading } = useRequest(
    () => apis.mockSchema(schemaParams),
    {
      ready: open,
      refreshDeps: [app, iceId, confId, lane, address, open],
      onSuccess: (data: { fields: SchemaField[]; fallback?: boolean }) => {
        if (data?.fallback) {
          message.warning('目标客户端已下线，已回退查询')
          onClose()
          onFallback?.()
          return
        }
        const schemaFields = data?.fields
        if (!schemaFields?.length) {
          setFields([])
          return
        }
        setFields(schemaFields.map(f => ({ key: f.key, value: '', dynamic: f.dynamic })))
      },
    }
  )

  useEffect(() => {
    if (open) {
      setResult(null)
      setTs(dayjs())
      setActiveTab('form')
      setJsonText('{}')
      setPos(lastPos.current)
    }
  }, [open])

  // Drag handlers on document (only when open)
  useEffect(() => {
    if (!open) return
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const next = {
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      }
      setPos(next)
      lastPos.current = next
    }
    const onMouseUp = () => { dragging.current = false }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [open])

  const onTitleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    dragStart.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    }
    e.preventDefault()
  }

  const addField = useCallback(() => {
    setFields(prev => [...prev, { key: '', value: '', dynamic: true }])
  }, [])

  const removeField = useCallback((index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index))
  }, [])

  const updateField = useCallback((index: number, field: Partial<RoamField>) => {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, ...field } : f))
  }, [])

  const collectRoam = (): Record<string, any> | null => {
    if (activeTab === 'json') {
      try {
        return JSON.parse(jsonText)
      } catch {
        message.error('JSON 格式错误')
        return null
      }
    }
    const roam: Record<string, any> = {}
    for (const f of fields) {
      if (!f.key) continue
      let val: any = f.value
      try { val = JSON.parse(f.value) } catch {}
      roam[f.key] = val
    }
    return roam
  }

  const { run: execute, loading: executing } = useRequest(
    (roam: Record<string, any>) => apis.mockExecute({
      app, iceId, ts: ts.valueOf(), roam, target,
      ...(confId ? { confId } : {}),
    }),
    {
      manual: true,
      onSuccess: (data: MockResultData) => {
        if (data.fallback) {
          message.warning('目标客户端已下线，已回退查询')
          onClose()
          onFallback?.()
          return
        }
        setResult(data)
        if (data.process && onProcessResult) {
          onProcessResult(parseProcess(data.process))
        }
      },
      onError: () => message.error('执行超时或出错'),
    }
  )

  const handleExecute = () => {
    const roam = collectRoam()
    if (roam === null) return
    setResult(null)
    execute(roam)
  }

  if (!open) return null

  const title = nodeName ? `Mock 执行 (${nodeName})` : 'Mock 执行'

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: 560,
        zIndex: 100,
        borderRadius: token.borderRadiusLG,
        boxShadow: token.boxShadowSecondary,
        background: token.colorBgElevated,
        color: token.colorText,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100% - 24px)',
      }}
    >
      {/* Draggable title bar */}
      <div
        onMouseDown={onTitleMouseDown}
        style={{
          padding: '12px 16px',
          cursor: 'move',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <strong>{title}</strong>
        <CloseOutlined onClick={onClose} style={{ cursor: 'pointer', fontSize: 14, color: token.colorTextTertiary }} />
      </div>

      {/* Scrollable body */}
      <div style={{ padding: '12px 16px', overflow: 'auto', flex: 1 }}>
        <div style={{ marginBottom: 12 }}>
          <span style={{ color: token.colorTextTertiary }}>时间: </span>
          <DatePicker showTime value={ts} onChange={v => v && setTs(v)} style={{ width: 240 }} />
        </div>

        <Tabs activeKey={activeTab} onChange={tab => {
          if (tab === 'json') {
            // sync form fields to JSON
            const roam: Record<string, any> = {}
            for (const f of fields) {
              if (!f.key) continue
              let val: any = f.value
              try { val = JSON.parse(f.value) } catch {}
              roam[f.key] = val
            }
            setJsonText(JSON.stringify(roam, null, 2))
          }
          setActiveTab(tab)
        }} size="small" items={[
          {
            key: 'form',
            label: '表单模式',
            children: (
              <div>
                {schemaLoading ? <div style={{ color: token.colorTextTertiary }}>加载字段...</div> : (
                  <>
                    {fields.map((f, i) => (
                      <Space key={i} style={{ display: 'flex', marginBottom: 8 }} align="start">
                        {f.dynamic ? (
                          <Input
                            value={f.key}
                            onChange={e => updateField(i, { key: e.target.value })}
                            placeholder="key"
                            style={{ width: 160 }}
                            suffix={<span style={{ color: token.colorWarning, fontSize: 12 }}>*</span>}
                          />
                        ) : (
                          <Input value={f.key} disabled style={{ width: 160 }} />
                        )}
                        <Input
                          value={f.value}
                          onChange={e => updateField(i, { value: e.target.value })}
                          placeholder="value"
                          style={{ width: 280 }}
                        />
                        <Button
                          icon={<DeleteOutlined />}
                          type="text"
                          danger
                          onClick={() => removeField(i)}
                        />
                      </Space>
                    ))}
                    <Button type="dashed" icon={<PlusOutlined />} onClick={addField} block>
                      添加字段
                    </Button>
                  </>
                )}
              </div>
            ),
          },
          {
            key: 'json',
            label: 'JSON 模式',
            children: (
              <Input.TextArea
                rows={10}
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                placeholder='{"key": "value"}'
              />
            ),
          },
        ]} />

        {result && (
          <div style={{ marginTop: 12, padding: 10, background: token.colorBgContainer, borderRadius: token.borderRadius, border: `1px solid ${token.colorBorderSecondary}` }}>
            <div style={{ marginBottom: 6 }}>
              <Tag color={result.success ? 'green' : 'red'}>{result.success ? '成功' : '失败'}</Tag>
            </div>
            {result.error && (
              <div style={{ marginBottom: 6 }}>
                <Typography.Text type="danger" style={{ fontSize: 13 }}>{result.error}</Typography.Text>
              </div>
            )}
            {result.process && (
              <div style={{ marginBottom: 6 }}>
                <div style={{ color: token.colorTextTertiary, marginBottom: 2, fontSize: 12 }}>Process:</div>
                <Typography.Text code copyable style={{ wordBreak: 'break-all', fontSize: 12 }}>
                  {result.process}
                </Typography.Text>
              </div>
            )}
            <div>
              <div style={{ color: token.colorTextTertiary, marginBottom: 2, fontSize: 12 }}>
                Roam:
                {result.ts != null && <span style={{ display: 'inline-block', marginLeft: 8, padding: '0 6px', border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadiusSM, fontSize: 11, color: token.colorTextSecondary }}>ts: {result.ts}</span>}
                {result.trace && <span style={{ display: 'inline-block', marginLeft: 6, padding: '0 6px', border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadiusSM, fontSize: 11, color: token.colorTextSecondary }}>trace: {result.trace}</span>}
              </div>
              <Input.TextArea
                rows={8}
                readOnly
                value={JSON.stringify(result.roam ?? {}, null, 2)}
                style={{ fontSize: 12 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${token.colorBorderSecondary}`, textAlign: 'right', flexShrink: 0 }}>
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={executing} onClick={handleExecute}>执行</Button>
        </Space>
      </div>
    </div>
  )
}

export default MockModal
