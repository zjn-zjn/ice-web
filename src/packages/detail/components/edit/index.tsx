import {
  Form, Input, Select, Button, message, Checkbox, Collapse, Modal, Space, Tag, Tooltip
} from 'antd'
import { useEffect, useState, useRef, useMemo } from 'react'
import apis from '../../../../apis'
import { CustomDatePicker } from '../../../../components'
import TextArea from 'antd/es/input/TextArea'
import type { ChildrenItem, FieldItem as IFieldItem, LeafClassInfo } from '../../../../index.d'
import { RelationNodeMap } from '../../types'

const isStringType = (t: string) => ['java.lang.String', 'string', 'str'].includes(t)

const displayValue = (value: any, type: string): string => {
  if (value === null || value === undefined) return ''
  if (isStringType(type)) return value
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

const TimeTypeOptions = [
  { label: '不限时间', value: 1 },
  { label: '≥ 开始', value: 5 },
  { label: '≤ 结束', value: 6 },
  { label: '闭区间内', value: 7 }
]

const relationOptions = [...RelationNodeMap].map(([value, label]) => ({ label, value }))
const leafTypeOptions = [
  { label: '叶子-Flow', value: 5 },
  { label: '叶子-Result', value: 6 },
  { label: '叶子-None', value: 7 },
]

export interface NodeFormProps {
  open: boolean
  onClose: () => void
  selectedNode: ChildrenItem | undefined
  app: string | number
  iceId: string | number
  refresh: () => void
  leafClassMap?: Record<number, LeafClassInfo[]>
  mode?: 'edit' | 'add-child' | 'add-front'
}

const InfoTag = ({ label, value }: { label: string; value: string }) => (
  <Tooltip title={value}>
    <span style={{ display: 'inline-flex', alignItems: 'center', flex: 1, minWidth: 0, fontSize: 12, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 4, padding: '1px 8px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
      <span style={{ color: '#999', marginRight: 4, flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#333', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
    </span>
  </Tooltip>
)

const FieldItem = ({ item }: { item: IFieldItem }) => {
  const shortType = item.type.substring(item.type.lastIndexOf('.') + 1)
  return (
    <div className='filed-item'>
      <div style={{ width: '100%', display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        {item.name && <InfoTag label="名称" value={item.name} />}
        <InfoTag label="字段" value={item.field} />
        <InfoTag label="类型" value={shortType} />
        {item.desc && <InfoTag label="描述" value={item.desc} />}
      </div>
      <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Form.Item name={['fields', item.field, 'value']} style={{ flex: 1, margin: 0 }}>
          <TextArea autoSize={{ minRows: 1, maxRows: 5 }} placeholder={shortType} />
        </Form.Item>
        <Form.Item name={['fields', item.field, 'isNull']} valuePropName='checked'
          initialValue={item.valueNull} style={{ margin: 0 }}>
          <Checkbox>null</Checkbox>
        </Form.Item>
      </div>
    </div>
  )
}

const getClasses = (map: Record<number, LeafClassInfo[]> | undefined, type: number | undefined) => {
  if (!type || !map) return []
  return map[type] || map[String(type) as any] || []
}

const NodeFormModal = ({ open, onClose, selectedNode, app, iceId, refresh, leafClassMap, mode = 'edit' }: NodeFormProps) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [nodeType, setNodeType] = useState<number | undefined>()
  const [confName, setConfName] = useState<string | undefined>()
  const [nodeIdInput, setNodeIdInput] = useState('')
  const initialRef = useRef<any>(null)
  const initialFieldsRef = useRef<any>(null)

  const isCreate = mode !== 'edit'
  const origType = isCreate ? undefined : selectedNode?.showConf?.nodeType
  const origConf = isCreate ? undefined : selectedNode?.showConf?.confName
  const activeType = nodeType ?? origType
  const isLeaf = activeType != null && [5, 6, 7].includes(activeType)
  const typeChanged = isCreate || (nodeType !== undefined && nodeType !== origType)
  const confChanged = confName !== origConf

  const classInfo = useMemo(() => {
    if (!isLeaf || !confName || !leafClassMap) return null
    return getClasses(leafClassMap, activeType).find(c => c.clazz === confName) || null
  }, [isLeaf, confName, activeType, leafClassMap])

  const nodeInfo = !isCreate ? selectedNode?.showConf?.nodeInfo : null
  const activeFieldSrc = (confChanged && classInfo) ? classInfo : null
  const fields = activeFieldSrc?.iceFields || nodeInfo?.iceFields
  const hideFields = activeFieldSrc?.hideFields || nodeInfo?.hideFields
  const hasFieldItems = isLeaf && confName && (fields?.length || hideFields?.length)

  useEffect(() => {
    if (!open) return
    form.resetFields()
    setNodeIdInput('')
    if (isCreate) {
      setNodeType(undefined); setConfName(undefined); setHasChanges(false)
      initialRef.current = '{}'
      form.setFieldsValue({ timeType: 1, debug: true, inverse: false })
    } else if (selectedNode) {
      const fv: Record<string, any> = {}
      selectedNode.showConf?.nodeInfo?.iceFields?.forEach(i => {
        fv[i.field] = { value: displayValue(i.value, i.type), isNull: i.valueNull }
      })
      selectedNode.showConf?.nodeInfo?.hideFields?.forEach(i => {
        fv[i.field] = { value: displayValue(i.value, i.type), isNull: i.valueNull }
      })
      const vals = {
        name: selectedNode.showConf?.nodeName, timeType: selectedNode.timeType || 1,
        start: selectedNode.start, end: selectedNode.end,
        debug: selectedNode.showConf?.debug ?? true, inverse: selectedNode.showConf?.inverse ?? false,
        confField: selectedNode.showConf?.confField, fields: fv
      }
      form.setFieldsValue(vals)
      initialRef.current = JSON.stringify(form.getFieldsValue())
      initialFieldsRef.current = JSON.parse(JSON.stringify(form.getFieldValue('fields') || {}))
      setHasChanges(false)
      setNodeType(selectedNode.showConf?.nodeType)
      setConfName(selectedNode.showConf?.confName)
    }
  }, [open, selectedNode, mode])

  useEffect(() => {
    if (!open) return
    if (isCreate) { setHasChanges(!!activeType); return }
    const changed = JSON.stringify(form.getFieldsValue()) !== initialRef.current || typeChanged || confChanged
    setHasChanges(changed)
  }, [nodeType, confName])

  const onChange = () => {
    if (isCreate) { setHasChanges(!!activeType); return }
    const changed = JSON.stringify(form.getFieldsValue()) !== initialRef.current || typeChanged || confChanged
    setHasChanges(changed)
  }

  const handleTypeClick = (type: number) => {
    setNodeType(type)
    if (type === origType) {
      setConfName(origConf)
      form.setFieldValue('fields', JSON.parse(JSON.stringify(initialFieldsRef.current || {})))
    } else {
      setConfName(undefined)
      form.setFieldValue('fields', {})
    }
  }

  const handleSave = async () => {
    if (!selectedNode) return
    try {
      setLoading(true)
      const { confField, fields: fv, ...rest } = await form.validateFields()

      const fieldTypes: Record<string, string> = {}
      const allFi = [...(fields || []), ...(hideFields || []), ...(nodeInfo?.iceFields || []), ...(nodeInfo?.hideFields || [])]
      allFi.forEach(f => { if (f.field) fieldTypes[f.field] = f.type })

      const obj: Record<string, any> = {}
      Object.entries<{ value?: string; isNull?: boolean }>(fv || {}).forEach(([k, v]) => {
        if (v.value || v.isNull) {
          if (v.isNull) { obj[k] = null; return }
          const ft = fieldTypes[k]
          if (ft && !isStringType(ft)) {
            try { obj[k] = JSON.parse(v.value!); return } catch {}
          }
          obj[k] = v.value
        }
      })
      const hasObj = Object.keys(obj).length > 0

      if (isCreate) {
        if (!activeType) { message.warning('请选择节点类型'); return }
        await apis.editConf({
          app: Number(app), iceId: Number(iceId), editType: mode === 'add-front' ? 4 : 1,
          parentId: selectedNode.parentId, selectId: selectedNode.showConf.nodeId,
          nextId: selectedNode.nextId, index: selectedNode.index,
          nodeType: activeType, relationType: isLeaf ? activeType : 1,
          confName: isLeaf ? confName : undefined,
          confField: isLeaf ? (hasObj ? JSON.stringify(obj) : confField || undefined) : undefined,
          name: rest.name || undefined, ...rest,
        })
      } else if (typeChanged || confChanged) {
        const p: any = {
          app: Number(app), iceId: Number(iceId), editType: 5, selectId: selectedNode.showConf?.nodeId,
          parentId: selectedNode.parentId, nextId: selectedNode.nextId,
          index: selectedNode.index, nodeType: activeType, ...rest,
        }
        if (isLeaf && confName) {
          p.confName = confName
          p.confField = hasObj ? JSON.stringify(obj) : confField || undefined
        }
        await apis.editConf(p)
      } else {
        await apis.editConf({
          app: Number(app), iceId: Number(iceId), editType: 2, selectId: selectedNode.showConf?.nodeId,
          parentId: selectedNode.parentId, nextId: selectedNode.nextId,
          ...selectedNode.showConf, ...rest, confName: undefined,
          confField: !selectedNode.showConf?.haveMeta ? confField : JSON.stringify(obj)
        })
      }
      refresh(); message.success('success'); onClose()
    } catch (err: any) {
      if (err.errorFields) return
    } finally { setLoading(false) }
  }

  const handleLink = async () => {
    if (!nodeIdInput.trim() || !selectedNode) return
    try {
      setLoading(true)
      await apis.editConf({
        app, iceId, editType: mode === 'add-front' ? 4 : 1,
        parentId: selectedNode.parentId, selectId: selectedNode.showConf.nodeId,
        nextId: selectedNode.nextId, index: selectedNode.index,
        multiplexIds: nodeIdInput.trim(), relationType: 13, nodeType: 13,
        name: form.getFieldValue('name') || undefined,
      })
      refresh(); message.success('success'); onClose()
    } catch {}
    finally { setLoading(false) }
  }

  if (!selectedNode) return null

  const title = isCreate ? (mode === 'add-front' ? '添加前置节点' : '添加子节点') : `编辑节点 #${selectedNode.showConf?.nodeId || ''}`
  const canSave = isCreate ? !!activeType && (!isLeaf || !!confName) : hasChanges

  return (
    <Modal title={title} open={open} onCancel={onClose} width={820} destroyOnClose centered
      styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' } }}
      footer={[
        <Button key="cancel" onClick={onClose}>取消</Button>,
        <Button key="save" type="primary" loading={loading} disabled={!canSave} onClick={handleSave}>
          {isCreate ? '创建' : '保存'}
        </Button>
      ]}
    >
      <Form form={form} onValuesChange={onChange} style={{ paddingTop: 16 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Form.Item name='name' style={{ margin: 0, flex: 1 }}>
            <Input maxLength={50} placeholder="名称（可选）" />
          </Form.Item>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <Form.Item name='debug' valuePropName='checked' style={{ margin: 0 }}><Checkbox>记录</Checkbox></Form.Item>
            <Form.Item name='inverse' valuePropName='checked' style={{ margin: 0 }}><Checkbox>反转</Checkbox></Form.Item>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 6 }}>
            {relationOptions.map(o => (
              <Tag key={o.value} color={activeType === o.value ? 'blue' : undefined}
                style={{ cursor: 'pointer', padding: '4px 0', fontSize: 13, margin: 0, textAlign: 'center' }}
                onClick={() => handleTypeClick(o.value)}>
                {o.label}
              </Tag>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: isLeaf ? 16 : 0 }}>
            {leafTypeOptions.map(o => (
              <Tag key={o.value} color={activeType === o.value ? 'green' : undefined}
                style={{ cursor: 'pointer', padding: '4px 0', fontSize: 13, margin: 0, textAlign: 'center' }}
                onClick={() => handleTypeClick(o.value)}>
                {o.label}
              </Tag>
            ))}
          </div>
          {isLeaf && (
            <Select showSearch optionFilterProp="label" value={confName}
              onChange={(v) => {
                setConfName(v)
                form.setFieldValue('fields', v === origConf
                  ? JSON.parse(JSON.stringify(initialFieldsRef.current || {}))
                  : {})
              }}
              placeholder="选择叶子类" style={{ width: '100%' }}>
              {getClasses(leafClassMap, activeType).map(c => (
                <Select.Option key={c.clazz} value={c.clazz} label={`${c.clazz} ${c.name || ''}`}>
                  {c.clazz.substring(c.clazz.lastIndexOf('.') + 1)}{c.name ? ` (${c.name})` : ''}
                </Select.Option>
              ))}
            </Select>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Form.Item name='timeType' style={{ margin: 0, width: 160, flexShrink: 0 }}>
            <Select options={TimeTypeOptions} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.timeType !== c.timeType}>
            {() => (
              <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                {![1, 6].includes(form.getFieldValue('timeType')) && (
                  <Form.Item name='start' style={{ margin: 0, flex: 1 }}
                    rules={[{ required: [5, 7].includes(form.getFieldValue('timeType')), message: '请选择' }]}>
                    <CustomDatePicker showTime placeholder="开始时间" />
                  </Form.Item>
                )}
                {![1, 5].includes(form.getFieldValue('timeType')) && (
                  <Form.Item name='end' style={{ margin: 0, flex: 1 }}
                    rules={[{ required: [6, 7].includes(form.getFieldValue('timeType')), message: '请选择' }]}>
                    <CustomDatePicker showTime placeholder="结束时间" />
                  </Form.Item>
                )}
              </div>
            )}
          </Form.Item>
        </div>

        {hasFieldItems ? (
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
            {fields?.map((item, i) => <FieldItem item={item} key={i} />)}
            {hideFields?.length ? (
              <Collapse size="small" style={{ marginTop: 8 }}
                defaultActiveKey={fields?.length ? [] : ['1']}
                items={[{ key: '1', label: '其他属性', forceRender: true,
                  children: hideFields.map((item, i) => <FieldItem item={item} key={i} />) }]} />
            ) : null}
          </div>
        ) : isLeaf && confName && !classInfo && !nodeInfo ? (
          <Form.Item name='confField' style={{ margin: 0, marginTop: 16 }}>
            <Input.TextArea rows={5} placeholder='未注册的节点类，手动输入 JSON' />
          </Form.Item>
        ) : isLeaf && confName && !hasFieldItems && !isCreate && !selectedNode?.showConf?.haveMeta ? (
          <Form.Item name='confField' style={{ margin: 0, marginTop: 16 }}>
            <Input.TextArea rows={6} />
          </Form.Item>
        ) : null}

        {isCreate && (
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginTop: 16 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input placeholder="引用已有节点 ID（逗号分隔）" value={nodeIdInput}
                onChange={e => setNodeIdInput(e.target.value)} onPressEnter={handleLink} />
              <Button type="primary" loading={loading} onClick={handleLink} disabled={!nodeIdInput.trim()}>引用</Button>
            </Space.Compact>
          </div>
        )}
      </Form>
    </Modal>
  )
}

export default NodeFormModal
