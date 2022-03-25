import React, { useEffect, useRef, useState } from "react"
import ReactDOM from "react-dom"
import { connect } from "@utils"
import { JNFormModal } from "../../../../groot"
import {Select, Button, Modal } from "antd"
import NodeTooltips from "./nodeTooltips"
import { CopyToClipboard } from "react-copy-to-clipboard"
import queryString from 'querystring'

// TODO
// import G6 from "@antv/g6"

import "./index.scss"

const { Option } = Select;

const getStyle = (type: number) => {
  if (type <= 4) {
    return {
      type: "circle",
      color: "#FFFACD",
      stroke: "#EEAD0E",
      size: [30, 30],
    }
  } else if (type === 5) {
    return {
      type: "diamond",
      color: "#C1FFC1",
      stroke: "#00CD00",
      size: [31, 31],
    }
  } else if (type === 6) {
    return {
      type: "rect",
      color: "#C1FFC1",
      stroke: "#00CD00",
      size: [26, 26],
    }
  } else if (type === 7) {
    return {
      type: "triangle",
      color: "#C1FFC1",
      stroke: "#00CD00",
      size: [16, 16],
    }
  } else {
    return {
      type: "circle",
      color: "#DDA0DD",
      stroke: "#9400D3",
      size: [30, 30],
    }
  }
}

const createList = (list: any = []) =>
  list.map((item: any) => ({ props: { value: item.id }, text: item.name }))
const createClassList = (list: any = []) =>
  list.map((item: any) => ({
    props: { value: item.fullName },
    text: item.shortName,
  }))

const nodeTypeList = [
  { name: "Relation", id: 1 },
  { name: "Flow", id: 5 },
  { name: "Result", id: 6 },
  { name: "None", id: 7 },
  { name: "节点ID", id: 13 },
]

const relationTypeList = [
  { name: "AND", id: 1 },
  { name: "TRUE", id: 2 },
  { name: "ALL", id: 3 },
  { name: "ANY", id: 4 },
  { name: "NONE", id: 0 },
  { name: "P_AND", id: 9 },
  { name: "P_TRUE", id: 10 },
  { name: "P_ALL", id: 11 },
  { name: "P_ANY", id: 12 },
  { name: "P_NONE", id: 8 },
]

const timeTypeList = [
  { name: "无时间限制", id: 1 },
//   { name: "大于开始时间", id: 2 },
//   { name: "小于结束时间", id: 3 },
//   { name: "在开始时间与结束时间之内", id: 4 },
  { name: "大于开始时间", id: 5 },
  { name: "小于结束时间", id: 6 },
  { name: "在开始时间与结束时间之内", id: 7 },
]

let graph: any = null

const Detail = (props: any) => {
  const {history, createDispatch, match, config = {} } = props
  let { app, iceId, addr} = match.params
  const {iceExport } = config
  app = parseInt(app, 10)
  iceId = parseInt(iceId, 10)
  addr = queryString.parse(history.location.search.split(`?`)[1]).addr
  const {
    details: { ret = -1, data: detailsData = {} } = {},
    confClass = [],
  } = config

  let createRoot = false

  const ref = useRef(null)

  const [showGroup, setShowGroup] = useState<any[]>([])
  const [selectedNode, setSelectedNode] = useState<any>({})
  const [showOperation, setShowOperation] = useState(false)
  const [addNodeModal, setAddNodeModal] = useState({
    type: "child",
    visible: false,
  })
  const [editNodeModal, setEditNodeModal] = useState({
    type: "child",
    visible: false,
  })
  const [selectedNodeType, setSelectedNodeType] = useState(1)
  const [timeType, setTimeType] = useState(1)

  const showConf = selectedNode.showConf || {}
  const isLeafNode =
    showConf.nodeType === 5 ||
    showConf.nodeType === 6 ||
    showConf.nodeType === 7

  useEffect(() => {
    getDetail(addr)
    return () => {
      if (graph && graph.destroy) {
        graph.destroy()
        graph = null
      }
    }
  }, [])

  useEffect(() => {
    if (ret === 0) {
      if (detailsData) {
        createRoot = false
        if (graph && graph.destroy) {
          graph.destroy()
          graph = null
        }
        const { root = [] } = detailsData || {}

        const createTreeData = (data: any[] = []): any => {
          if (data.length === 0) {
            return []
          }
          return data.map((da: any) => {
            const daItem = { ...da }
            const children = daItem.children ? [...daItem.children] : []
            if (daItem.forward) {
              children.unshift({ ...daItem.forward, isNotChildren: true })
            }
            daItem.children = children

            return {
              ...daItem,
              children: createTreeData(daItem.children),
            }
          })
        }

        if (!root.children) {
          root.children = []
        }
        const rootChildren = root.forward
          ? [{ ...root.forward, isNotChildren: true }, ...root.children]
          : [...root.children]

        const treeData = {
          ...root,
          children: createTreeData(rootChildren),
        }

        initTree(treeData)
      } else {
        const emptyTreeData: any = {
          children: [],
          showConf: {},
        }
        createRoot = true
        initTree(emptyTreeData)
      }
    }
  }, [detailsData])

  const getDetail = async (address?:any) => {
    await createDispatch("config/details", { app, iceId, address})
  }

  const bindEvents = () => {
    // 监听node上面mouse事件
    graph.on("click", (ev: any) => {
      const { item } = ev
      if (!item) {
        setShowGroup([])
      }
      // setSelectedNode({})
      setShowOperation(false)
    })

    graph.on("node:click", (evt: any) => {
      if (createRoot) {
        openAddNodeModal()
      } else {
        const { item } = evt
        const model = item.getModel()
        const { x, y } = model
        const point = graph.getCanvasByPoint(x, y)
        setSelectedNode({
          ...model,
          id: item._cfg.id,
          x: point.x + 15,
          y: point.y + 105,
        })
        setShowOperation(true)
      }
    })
  }

  const initTree = (treeData: any[]) => {
    if (!graph) {
      graph = new G6.TreeGraph({
        container: ReactDOM.findDOMNode(ref.current) as any,
        width: (ref.current as any).clientWidth,
        height: (ref.current as any).clientHeight,
        modes: {
          default: ["drag-canvas", "zoom-canvas"],
        },
        defaultNode: {
          anchorPoints: [
            [0, 0.5],
            [1, 0.5],
          ],
          style: {
            cursor: "pointer"
          },
        },
        defaultEdge: {
          type: "cubic-horizontal",
          style: {
            stroke: "#CFCFCF",
          },
        },
        layout: {
          type: "compactBox",
          direction: "LR",
          getId: function getId(d: any) {
            return d.id
          },
          getVGap: function getVGap() {
            return 10
          },
          getHGap: function getHGap() {
            return 120
          },
        },
      })

      graph.node((node: any) => {
        const { nodeType, labelName} = node.showConf

        return {
          type: getStyle(nodeType).type,
          label: createRoot
            ? "ERROR"
            : `${labelName}`,
          size: getStyle(nodeType).size,
          strokeOpacity:0.5,
          style: {
            fill: node.isNotChildren ? "#FFCCCC" : getStyle(nodeType).color,
            stroke: node.isNotChildren ? ((nodeType === 8||nodeType === 9||nodeType === 10||nodeType === 11||nodeType === 12)?getStyle(nodeType).stroke:"#FF0000") : getStyle(nodeType).stroke,
          },
          labelCfg: {
            position: "right",
            style: {
              fontSize: 15,
            },
          },
        }
      })

      graph.data(treeData)
      graph.render()
      graph.fitView()
      bindEvents()
    }
  }

  // const showMsg = () => {
  //   const nowNode = selectedNode
  //   setShowOperation(false)
  //   setShowGroup((old: any) => {
  //     const isHaveItem = old.find((a: any) => a.id === nowNode.id)
  //     if (isHaveItem) {
  //       return [...old]
  //     }
  //     return [...old, nowNode]
  //   })
  //   setSelectedNode({})
  // }

  const nodeTypeChange = (type: number) => {
    setSelectedNodeType(type)
    if (type !== 1 && type !== 13) {
      createDispatch("config/getClass", { app, type: type })
    }
  }

  const addNodeFormData: any[] = [
    {
      id: "name",
      label: "名称",
      type: "input",
    },
    {
      id: "nodeType",
      label: "nodeType",
      type: "select",
      options: {
        initialValue: 1,
        onChange: nodeTypeChange,
        rules: [
          {
            required: true,
            message: "请选择节点类型",
          },
        ],
      },
      childData: createList(
        createRoot ? nodeTypeList.slice(0, 4) : nodeTypeList
      ),
    },
    {
      id: "relationType",
      label: "relationType",
      type: "select",
      show: selectedNodeType === 1,
      options: {
        initialValue: 1,
        rules: [
          {
            required: true,
            message: "请选择节点类型",
          },
        ],
      },
      childData: createList(relationTypeList),
    },
    {
      id: "confName",
      label: "confName",
      type: "select",
      show: selectedNodeType !== 1 && selectedNodeType !== 13,
      options: {
        // initialValue: 1,
        rules: [
          {
            required: true,
            message: "请选择/输入confName",
          },
        ],
      },
      props: {
        maxTagCount: 1,
        mode: "tags",
      },
      childData: createClassList(confClass),
    },
    {
      id: "multiplexIds",
      label: "节点ID(逗号分隔)",
      type: "input",
      show: selectedNodeType === 13,
      options: {
        rules: [
          {
            required: true,
            message: "节点ID必须填写",
          },
        ],
      },
    },
    {
      id: "confField",
      label: "配置Json",
      type: "textArea",
      show:
        selectedNodeType === 5 ||
        selectedNodeType === 6 ||
        selectedNodeType === 7,
    },
  ]

  const openAddNodeModal = (type: "child" | "front" = "child") => {
    setShowOperation(false)
    setSelectedNodeType(1)
    setAddNodeModal({ visible: true, type: type })
  }

   const openExchangeModal = () => {
      setShowOperation(false)
      setSelectedNodeType(1)
      setAddNodeModal({ visible: true, type: "exchange" })
    }

  const closeAddNodeModal = () => {
    setAddNodeModal({ visible: false, type: "child" })
  }

  const confirm = async (values: any) => {
    const { nodeType } = values
    if (nodeType === 1) {
      values.nodeType = values.relationType
    }
    if (nodeType === 8) {
      delete values.nodeType
    }
    await createDispatch("config/editConf", {
      app,
      iceId,
      editType: addNodeModal.type === "child" ? 1 : addNodeModal.type === "exchange" ? 5 : 4,
      selectId: showConf.nodeId,
      parentId: selectedNode.parentId,
      nextId:selectedNode.nextId,
      ...values,
      confName: values.confName && values.confName[0],
      index: selectedNode.index,
    })
    closeAddNodeModal()
    getDetail(addr)
  }

  const openEditModal = (timetype:number) => {
    setShowOperation(false)
    timeTypeChange(timetype)
    setEditNodeModal({ type: "", visible: true })
  }

  const release = async () => {
    setShowOperation(false)
    Modal.confirm({
      title: `确认发布所有变更吗？`,
      onOk: async () => {
        await createDispatch("config/release", {app, iceId})
        setTimeout(() => {
          getDetail(addr)
        }, 1500)
      },
    })
  }

  const edit = async (values: any) => {
    await createDispatch("config/editConf", {
      app,
      iceId,
      editType: 2,
      selectId: showConf.nodeId,
      parentId: selectedNode.parentId,
      nextId: selectedNode.nextId,
      ...showConf,
      ...values,
      confName: undefined,
    })
    closeEditNodeModal()
    getDetail(addr)
  }

  const closeEditNodeModal = () => {
    setEditNodeModal({ type: "", visible: false })
  }

  const timeTypeChange = (v: any) => {
    setTimeType(v)
  }

  const editFormData: any[] = [
    {
      id: "name",
      label: "名称",
      type: "input",
      options: {
        initialValue: showConf.nodeName,
      },
      props:{
        disabled: addr && addr !== "server"
      }
    },
    {
      id: "timeType",
      label: "时间类型",
      type: "select",
      options: {
        onChange: timeTypeChange,
        initialValue: selectedNode.timeType || 1,
        rules: [
          {
            required: true,
            message: "请选择时间类型",
          },
        ],
      },
      props:{
        disabled: addr && addr !== "server"
      },
      childData: createList(timeTypeList),
    },
    {
      id: "start",
      label: "开始时间",
      type: "datePicker",
      options: {
        initialValue: selectedNode.start,
        rules: [
          {
            required:
              timeType === 2 ||
              timeType === 4 ||
              timeType === 5 ||
              timeType === 7,
            message: "请选择开始时间",
          },
        ],
      },
      props: {
        format: 'YY-MM-DD HH:mm:ss',
        showTime: { format: 'HH:mm:ss' },
        disabled: addr && addr !== "server"
      }
    },
    {
      id: "end",
      label: "结束时间",
      type: "datePicker",
      options: {
        initialValue: selectedNode.end,
        rules: [
          {
            required:
              timeType === 3 ||
              timeType === 4 ||
              timeType === 6 ||
              timeType === 7,
            message: "请选择结束时间",
          },
        ],
      },
      props: {
        format: 'YY-MM-DD HH:mm:ss',
        showTime: { format: 'HH:mm:ss' },
        disabled: addr && addr !== "server"
      }
    },
    {
      id: "debug",
      label: "debug",
      type: "radio",
      options: {
        initialValue: showConf.debug || true,
      },
      props:{
        disabled: addr && addr !== "server"
      },
      childData: [
        { props: { value: true }, text: "true" },
        { props: { value: false }, text: "false" },
      ],
    },
    {
      id: "inverse",
      label: "inverse",
      type: "radio",
      options: {
        initialValue: showConf.inverse || false,
      },
      props:{
        disabled: addr && addr !== "server"
      },
      childData: [
        { props: { value: true }, text: "true" },
        { props: { value: false }, text: "false" },
      ],
    },
    {
      id: "confField",
      label: "配置Json",
      type: "textArea",
      show: isLeafNode,
      options: {
        initialValue: showConf.confField,
      },
      props:{
        disabled: addr && addr !== "server"
      }
    },
  ]

  const deleteNode = () => {
    setShowOperation(false)
    Modal.confirm({
      title: `确认删除<${showConf.labelName}>节点吗？`,
      onOk: async () => {
        await createDispatch("config/editConf", {
          app,
          iceId,
          editType: 3,
          selectId: showConf.nodeId,
          parentId: selectedNode.parentId,
          nextId: selectedNode.nextId,
          index:selectedNode.index
        })
        closeAddNodeModal()
        getDetail(addr)
      },
    })
  }

  const updateClean = () => {
    setShowOperation(false)
    Modal.confirm({
      title: `确认清除所有变更吗？`,
      onOk: async () => {
        await createDispatch("config/updateClean", {
          app,
          iceId
        })
        closeAddNodeModal()
        getDetail(addr)
      },
    })
  }

  const downNode = async () => {
      setShowOperation(false)
        await createDispatch("config/editConf", {
          app,
          iceId,
          editType: 6,
          selectId: showConf.nodeId,
          parentId: selectedNode.parentId,
          nextId: selectedNode.nextId,
          index:selectedNode.index,
          moveTo:selectedNode.index+1,
        })
        closeAddNodeModal()
        getDetail(addr)
    }

    const upNode = async () => {
          setShowOperation(false)
            await createDispatch("config/editConf", {
              app,
              iceId,
              editType: 6,
              selectId: showConf.nodeId,
              parentId: selectedNode.parentId,
              nextId: selectedNode.nextId,
              index:selectedNode.index,
              moveTo:selectedNode.index-1,
            })
            closeAddNodeModal()
            getDetail(addr)
        }
        function onChange(value:string) {
          history.push(`/config/detail/${app}/${iceId}?addr=${value}`)
          getDetail(value)
        }
        const [exportVisible, setExportVisible] = useState(false)
        const exportIce = async () => {
          await createDispatch("config/iceExport", {
            app,
            iceId
          })
          setExportVisible(true)
        }
        const onCopy = () => {
          closeExportModal()
        }
        const [importVisible, setImportVisible] = useState(false)
        const importConfirm = async (values: any) => {
          await createDispatch("config/iceImport", {
            json: values.parameter,
          })
          closeImportModal()
          getDetail(addr)
        }
        const openImportModal = () => {
          setImportVisible(true)
        }
      
        const closeImportModal = () => {
          setImportVisible(false)
        }
      
        const importFormData: any[] = [
          {
            id: "parameter",
            label: "配置",
            type: "textArea",
          },
        ]
        const closeExportModal = () => setExportVisible(false)
  return (
    <>
      <div key={`${app}+${iceId}`}>
      <Select
      showSearch
      style={{ width: 205 }}
      placeholder="Server"
      optionFilterProp="children"
      defaultValue={addr}
      onChange={onChange}
    >
    <Option value="server">Server</Option>
    {detailsData && detailsData.registerClients&&detailsData.registerClients.map((a:string)=>(
          <Option value={a} key={`${app}+${iceId}`+`${a}`}>Client:{a}</Option>
      ))}
  </Select>
      <Button type="primary" style={{ marginLeft: 20 }} onClick={() => release()}>发布</Button>
      <Button type="danger" style={{ marginLeft: 20 }} onClick={() => updateClean()}>清除</Button>
      <Button style={{ marginLeft: 20 }} onClick={() => openImportModal()}>导入</Button>
      <Button style={{ marginLeft: 20 }} onClick={() => exportIce()}>导出</Button>
        <div className="tree-container" ref={ref}>
          {showGroup.map((s: any) => (
            <NodeTooltips key={s.id} x={s.x} y={s.y} detail={s.showConf} />
          ))}
          {showOperation && (
            <div
              className="operation-container"
              style={{
                top: `${selectedNode.y}px`,
                left: `${selectedNode.x}px`,
              }}
            >
              {/* <div className="operation-item" onClick={showMsg}>
                详细信息
              </div> */}
              <div className="operation-item" onClick={() => openEditModal(selectedNode.timeType || 1)}>
                {addr && addr !== "server"?"查看节点":"查看/编辑节点"}
              </div>
              {!isLeafNode && (!addr || addr === "server") && (
                <div
                  className="operation-item"
                  onClick={() => openAddNodeModal("child")}
                >
                  添加子节点
                </div>
              )}
              {!selectedNode.forward && (!addr || addr === "server") &&(
                <div
                  className="operation-item"
                  onClick={() => openAddNodeModal("front")}
                >
                  添加前置节点
                </div>
              )}
              {(!addr || addr === "server") &&(
                <div className="operation-item" onClick={() => openExchangeModal()}>
                转换节点
              </div>
              )}
              {(!addr || addr === "server") &&(
              <div className="operation-item" onClick={() => upNode()}>
              上移节点
            </div>
              )}

              {(!addr || addr === "server") &&(
                <div className="operation-item" onClick={() => downNode()}>
                下移节点
              </div>
              )}
             {(!addr || addr === "server") &&(
                 <div className="operation-item" onClick={() => deleteNode()}>
                 删除本节点
               </div>
              )}      
            </div>
          )}
        </div>
      </div>
      <JNFormModal
        visible={addNodeModal.visible}
        confirm={confirm}
        cancel={closeAddNodeModal}
        formData={addNodeFormData}
        title={addNodeModal.type === `exchange`?`转换节点`:`添加节点`}
      />
      <JNFormModal
        visible={editNodeModal.visible}
        confirm={edit}
        cancel={closeEditNodeModal}
        formData={editFormData}
        title={addr && addr !== `server`?`查看节点`:`查看/编辑节点`}
      />
      <JNFormModal
        visible={importVisible}
        confirm={importConfirm}
        cancel={closeImportModal}
        formData={importFormData}
        title="导入"
      />
      <Modal
        title="导出"
        visible={exportVisible}
        onCancel={closeExportModal}
        footer={null}
      >
        <div>{iceExport.data}</div>
        <div className="btn-group">
          <CopyToClipboard text={iceExport.data} onCopy={onCopy}>
            <Button>复制配置</Button>
          </CopyToClipboard>
          {/* <Button onClick={toProd} type="danger" style={{ marginLeft: 40 }}>发布到线上</Button> */}
        </div>
      </Modal>
    </>
  )
}



export default connect("config")(Detail)
