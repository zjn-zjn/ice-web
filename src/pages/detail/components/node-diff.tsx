import { Tabs, theme } from 'antd'
import { useMemo } from 'react'
import type { IceConfRaw } from '../../../types'

const nodeTypeNames: Record<number, string> = {
  0: 'NONE', 1: 'AND', 2: 'TRUE', 3: 'ALL', 4: 'ANY',
  5: 'LEAF_FLOW', 6: 'LEAF_RESULT', 7: 'LEAF_NONE',
  8: 'P_NONE', 9: 'P_AND', 10: 'P_TRUE', 11: 'P_ALL', 12: 'P_ANY',
}

const timeTypeNames: Record<number, string> = {
  1: '不限时间', 5: '≥ 开始', 6: '≤ 结束', 7: '闭区间内',
}

interface Props {
  active: IceConfRaw | null
  update: IceConfRaw
}

const fmt = (v: any): string => {
  if (v === null || v === undefined) return '-'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  return String(v)
}

// Normalize default values so undefined/false/null/0/"" don't show as meaningful diffs
const normInverse = (v?: boolean | null): string => (!v ? '-' : 'true')
const normTimeType = (v?: number | null): string => {
  const t = v ?? 1
  return timeTypeNames[t] || String(t)
}
const normName = (v?: string | null): string => (v || '-')
const normTime = (v?: number | null): string => (v != null && v !== 0 ? new Date(v).toLocaleString() : '-')
const normSonIds = (v?: string | null): string => (v || '-')

// Parse confField JSON, return key-value entries
const parseConfField = (raw?: string): Record<string, any> | null => {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

// LCS-based line diff
const diffLines = (oldText: string, newText: string): { old: { text: string; type: 'same' | 'removed' }[]; new: { text: string; type: 'same' | 'added' }[] } => {
  const a = oldText.split('\n')
  const b = newText.split('\n')
  // Build LCS table
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
  // Backtrack to find matches
  const oldResult: { text: string; type: 'same' | 'removed' }[] = []
  const newResult: { text: string; type: 'same' | 'added' }[] = []
  let i = m, j = n
  const oldMarks: ('same' | 'removed')[] = Array(m).fill('removed')
  const newMarks: ('same' | 'added')[] = Array(n).fill('added')
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { oldMarks[i - 1] = 'same'; newMarks[j - 1] = 'same'; i--; j-- }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--
    else j--
  }
  a.forEach((text, idx) => oldResult.push({ text, type: oldMarks[idx] }))
  b.forEach((text, idx) => newResult.push({ text, type: newMarks[idx] }))
  return { old: oldResult, new: newResult }
}

const PropertyTable = ({ active, update }: Props) => {
  const { token } = theme.useToken()
  const isNew = !active

  const rows: { label: string; oldVal: string; newVal: string }[] = useMemo(() => {
    const a = active
    const u = update
    const result: { label: string; oldVal: string; newVal: string }[] = []

    result.push({ label: '类型', oldVal: a ? (nodeTypeNames[a.type] || String(a.type)) : '-', newVal: nodeTypeNames[u.type] || String(u.type) })
    result.push({ label: '名称', oldVal: normName(a?.name), newVal: normName(u.name) })
    result.push({ label: '反转', oldVal: normInverse(a?.inverse), newVal: normInverse(u.inverse) })

    const isLeaf = u.type >= 5 && u.type <= 7
    if (isLeaf || a?.confName) {
      result.push({ label: 'confName', oldVal: fmt(a?.confName), newVal: fmt(u.confName) })
    }

    const isRelation = (t?: number) => t !== undefined && ((t >= 0 && t <= 4) || (t >= 8 && t <= 12))
    if (isRelation(u.type) || isRelation(a?.type)) {
      result.push({ label: '子节点', oldVal: normSonIds(a?.sonIds), newVal: normSonIds(u.sonIds) })
    }

    if (a?.forwardId != null || u.forwardId != null) {
      result.push({ label: '前置节点', oldVal: fmt(a?.forwardId), newVal: fmt(u.forwardId) })
    }

    result.push({ label: '时间类型', oldVal: normTimeType(a?.timeType), newVal: normTimeType(u.timeType) })

    const showStart = (a?.start != null && a.start !== 0) || (u.start != null && u.start !== 0)
    if (showStart) {
      result.push({ label: '开始时间', oldVal: normTime(a?.start), newVal: normTime(u.start) })
    }
    const showEnd = (a?.end != null && a.end !== 0) || (u.end != null && u.end !== 0)
    if (showEnd) {
      result.push({ label: '结束时间', oldVal: normTime(a?.end), newVal: normTime(u.end) })
    }

    return result
  }, [active, update])

  // confField diff
  const fieldDiff = useMemo(() => {
    const oldObj = parseConfField(active?.confField)
    const newObj = parseConfField(update.confField)
    if (!oldObj && !newObj) return null

    const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})])
    const entries: { key: string; oldVal: string; newVal: string; status: 'same' | 'added' | 'removed' | 'modified' }[] = []
    for (const k of allKeys) {
      const ov = oldObj ? oldObj[k] : undefined
      const nv = newObj ? newObj[k] : undefined
      const ovs = ov === undefined ? '-' : (typeof ov === 'object' ? JSON.stringify(ov) : String(ov))
      const nvs = nv === undefined ? '-' : (typeof nv === 'object' ? JSON.stringify(nv) : String(nv))
      let status: 'same' | 'added' | 'removed' | 'modified' = 'same'
      if (ov === undefined) status = 'added'
      else if (nv === undefined) status = 'removed'
      else if (ovs !== nvs) status = 'modified'
      entries.push({ key: k, oldVal: ovs, newVal: nvs, status })
    }
    return entries
  }, [active?.confField, update.confField])

  const changedColor = token.colorWarningBg
  const addedColor = token.colorSuccessBg
  const removedColor = token.colorErrorBg
  const borderColor = token.colorBorderSecondary

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${borderColor}` }}>
            <th style={{ textAlign: 'left', padding: '6px 8px', width: 100 }}>属性</th>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>{isNew ? '' : '旧值'}</th>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>新值</th>
          </tr>
        </thead>
        <tbody>
          {rows.filter(r => isNew || r.oldVal !== r.newVal).map(r => {
            return (
              <tr key={r.label} style={{ background: isNew ? undefined : changedColor, borderBottom: `1px solid ${borderColor}` }}>
                <td style={{ padding: '4px 8px', fontWeight: 500 }}>{r.label}</td>
                <td style={{ padding: '4px 8px', color: isNew ? token.colorTextQuaternary : undefined }}>{r.oldVal}</td>
                <td style={{ padding: '4px 8px' }}>{r.newVal}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {fieldDiff && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 500, marginBottom: 4, fontSize: 13 }}>confField</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${borderColor}` }}>
                <th style={{ textAlign: 'left', padding: '4px 8px', width: 120 }}>字段</th>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>{isNew ? '' : '旧值'}</th>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>新值</th>
              </tr>
            </thead>
            <tbody>
              {fieldDiff.filter(e => isNew || e.status !== 'same').map(e => (
                <tr key={e.key} style={{
                  background: e.status === 'added' ? addedColor : e.status === 'removed' ? removedColor : e.status === 'modified' ? changedColor : undefined,
                  borderBottom: `1px solid ${borderColor}`,
                }}>
                  <td style={{ padding: '4px 8px', fontFamily: 'monospace' }}>{e.key}</td>
                  <td style={{ padding: '4px 8px', fontFamily: 'monospace', textDecoration: e.status === 'removed' ? 'line-through' : undefined }}>{e.oldVal}</td>
                  <td style={{ padding: '4px 8px', fontFamily: 'monospace' }}>{e.newVal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Strip internal fields for clean JSON view
const toDisplayObj = (conf: IceConfRaw | null): Record<string, any> => {
  if (!conf) return {}
  const obj: Record<string, any> = {}
  obj.type = nodeTypeNames[conf.type] || conf.type
  if (conf.name) obj.name = conf.name
  if (conf.inverse) obj.inverse = true
  if (conf.confName) obj.confName = conf.confName
  if (conf.confField) {
    try { obj.confField = JSON.parse(conf.confField) } catch { obj.confField = conf.confField }
  }
  if (conf.sonIds) obj.sonIds = conf.sonIds
  if (conf.forwardId != null) obj.forwardId = conf.forwardId
  const tt = conf.timeType ?? 1
  if (tt !== 1) obj.timeType = timeTypeNames[tt] || tt
  if (conf.start != null && conf.start !== 0) obj.start = new Date(conf.start).toLocaleString()
  if (conf.end != null && conf.end !== 0) obj.end = new Date(conf.end).toLocaleString()
  return obj
}

const JsonDiff = ({ active, update }: Props) => {
  const { token } = theme.useToken()
  const { old: oldLines, new: newLines } = useMemo(() => {
    const oldText = JSON.stringify(toDisplayObj(active), null, 2)
    const newText = JSON.stringify(toDisplayObj(update), null, 2)
    return diffLines(oldText, newText)
  }, [active, update])

  const codeStyle: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: 12, padding: 8, margin: 0,
    overflow: 'auto', border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 4, minHeight: 60, whiteSpace: 'pre', background: token.colorBgContainer,
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{active ? '旧值 (Active)' : '(新增节点)'}</div>
        <pre style={codeStyle}>
          {oldLines.map((l, i) => (
            <div key={i} style={{ background: l.type === 'removed' ? token.colorErrorBg : undefined }}>
              {l.text}
            </div>
          ))}
        </pre>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>新值 (Pending)</div>
        <pre style={codeStyle}>
          {newLines.map((l, i) => (
            <div key={i} style={{ background: l.type === 'added' ? token.colorSuccessBg : undefined }}>
              {l.text}
            </div>
          ))}
        </pre>
      </div>
    </div>
  )
}

const NodeDiff = (props: Props) => (
  <Tabs
    size="small"
    defaultActiveKey="props"
    items={[
      { key: 'props', label: '属性对比', children: <PropertyTable {...props} /> },
      { key: 'json', label: 'JSON 对比', children: <JsonDiff {...props} /> },
    ]}
  />
)

export default NodeDiff
