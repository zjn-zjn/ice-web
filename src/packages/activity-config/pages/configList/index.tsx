import React, { useEffect, useState } from "react"
import { JNSearchTable, JNFormModal } from "../../../../groot"
import { Button, Modal, Table } from "antd"
import { connect } from "@utils"
import moment from "moment"
import { CopyToClipboard } from "react-copy-to-clipboard"

import "./index.scss"

// const createList = (list: any = []) =>
//   list.map((item: any) => ({ props: { value: item.id }, text: item.name }))

// const timeTypeList = [
//   { name: "无时间限制", id: 1 },
// //   { name: "大于开始时间", id: 2 },
// //   { name: "小于结束时间", id: 3 },
// //   { name: "在开始时间与结束时间之内", id: 4 },
//   { name: "大于开始时间", id: 5 },
//   { name: "小于结束时间", id: 6 },
//   { name: "在开始时间与结束时间之内", id: 7 },
// ]

const ActivityList = (props: any) => {
  const { history, createDispatch, match = {}, config } = props
  const { confList, pushHistory = {}, iceExport } = config
  const {list=[]} = pushHistory

  const { id = 0 } = match ? match.params : {}
  const app = parseInt(id, 10)

  const isTableLoading = false

  const [showHistory, setShowHistory] = useState({
    visible: false,
    iceId: "",
    name: "",
  })
  const [editModal, setEditModal] = useState({ type: 1, visible: false })
  //   const [timeType, setTimeType] = useState(1)
  const [seletedActicity, setSeletedActicity] = useState<any>({})
  const [pushVisible, setPushVisible] = useState<any>({ visible: false })
  const [importVisible, setImportVisible] = useState(false)
  const [exportVisible, setExportVisible] = useState(false)

  useEffect(() => {
    createDispatch("config/confList", { app })
  }, [])

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
    },
    {
      title: "名称",
      dataIndex: "name",
    },
    {
      title: "场景",
      dataIndex: "scenes",
    },
    {
      title: "配置ID",
      dataIndex: "confId",
    },
//     {
//       title: "时间类型",
//       dataIndex: "timeType",
//     },
//     {
//       title: "开始时间",
//       dataIndex: "start",
//       render: (text: any) =>
//         text && <p>{moment(text).format("YYYY-MM-DD hh:mm:ss")}</p>,
//     },
//     {
//       title: "结束时间",
//       dataIndex: "end",
//       render: (text: any) =>
//         text && <p>{moment(text).format("YYYY-MM-DD hh:mm:ss")}</p>,
//     },
//     {
//       title: "状态",
//       dataIndex: "status",
//     },
    {
      title: "Debug",
      dataIndex: "debug",
    },
    {
      title: "操作",
      dataIndex: "operation",
      render: (text: any, record: any) => (
        <>
          <Button type="link" onClick={() => openEditModal(2, record)}>
            编辑
          </Button>
          <Button
            type="link"
            onClick={() => linkToDetail(record.app, record.id)}
          >
            查看详情
          </Button>
          <Button
            type="link"
            onClick={() => openPushModal(record.name, record.id)}
          >
            备份
          </Button>
          <Button
            type="link"
            onClick={() => openPushHistory(record.name, record.id)}
          >
            备份历史
          </Button>
          <Button
            type="link"
            onClick={() => exportIce({ iceId: record.id })}
          >
            导出
          </Button>
        </>
      ),
    },
  ]

  const openPushModal = (name: string, iceId: any) =>
    setPushVisible({ visible: true, name, iceId, app })
  const closePushModal = () => setPushVisible({ visible: false })

  const pushConfirm = async (values: any) => {
    await createDispatch("config/pushConf", {
      app,
      iceId: pushVisible.iceId,
      ...values,
    })
    closePushModal()
  }

  const openPushHistory = async (name: string, iceId: any) => {
    setShowHistory({ visible: true, iceId, name })
    await createDispatch("config/pushHistory", {
      app,
      iceId,
    })
  }

  const colseHistory = () => {
    setShowHistory({ visible: false, iceId: "", name: "" })
  }

  const pushRollback = async (pushId: number | string) => {
    Modal.confirm({
      title: `确认将 <${showHistory.name}> 回滚到 [${pushId}] 版本吗？`,
      onOk: async () => {
        await createDispatch("config/rollback", {
          // app,
          // iceId: showHistory.iceId,
          pushId,
        })
        colseHistory()
        createDispatch("config/confList", { app })
      },
    })
  }

  const deleteHistory = async (pushId: number | string) => {
    Modal.confirm({
      title: `确认物理删除ID为<${pushId}> 的备份吗？`,
      onOk: async () => {
        await createDispatch("config/deleteHistory", {
          pushId,
        })
        colseHistory()
      },
    })
  }

//   const toProd = () => {
//     Modal.confirm({
//       title: `确认发布到线上？`,
//       onOk: async () => {
//         await createDispatch("config/iceTopro", {
//           map: iceExport.data
//         })
//       },
//     })
//   }

  const searchFormData = [
    {
      id: "name",
      label: "名称",
      type: "input",
    },
    {
      id: "scene",
      label: "场景",
      type: "input",
    },
    {
      id: "id",
      label: "ID",
      type: "number",
    },
  ]

  const linkToDetail = (appId: number, iceId: any) => {
    history.push(`/config/detail/${appId}/${iceId}?addr=server`)
  }

//   const timeTypeChange = (v: any) => {
//     setTimeType(v)
//   }

  const pushFormData: any[] = [
    {
      id: "reason",
      label: "备注",
      type: "input",
    },
  ]

  const editFormData: any[] = [
    {
      id: "name",
      label: "名称",
      type: "input",
      options: {
        initialValue: seletedActicity.name,
      },
    },
//     {
//       id: "timeType",
//       label: "时间类型",
//       type: "select",
//       options: {
//         onChange: timeTypeChange,
//         initialValue: seletedActicity.timeTypeEnum || 1,
//         rules: [
//           {
//             required: true,
//             message: "请选择时间类型",
//           },
//         ],
//       },
//       childData: createList(timeTypeList),
//     },
//     {
//       id: "start",
//       label: "开始时间",
//       type: "datePicker",
//       options: {
//         initialValue: seletedActicity.start,
//         rules: [
//           {
//             required:
//               timeType === 2 ||
//               timeType === 4 ||
//               timeType === 5 ||
//               timeType === 7,
//             message: "请选择开始时间",
//           },
//         ],
//       },
//     },
//     {
//       id: "end",
//       label: "结束时间",
//       type: "datePicker",
//       options: {
//         initialValue: seletedActicity.end,
//         rules: [
//           {
//             required:
//               timeType === 3 ||
//               timeType === 4 ||
//               timeType === 6 ||
//               timeType === 7,
//             message: "请选择结束时间",
//           },
//         ],
//       },
//     },
    {
      id: "scenes",
      label: "场景(逗号分隔)",
      type: "input",
      options: {
        initialValue: seletedActicity.scenes,
      },
    },
    {
      id: "debug",
      label: "debug",
      type: "number",
      options: {
        initialValue: seletedActicity.debug,
      },
    },
//     {
//       id: "status",
//       label: "状态",
//       type: "radio",
//       options: {
//         initialValue: seletedActicity.status === 0 ? 0 : 1,
//       },
//       childData: [
//         { props: { value: 1 }, text: "上线" },
//         { props: { value: 0 }, text: "下线" },
//       ],
//     },
  ]

  const closeEditModal = () => {
    setSeletedActicity({})
    setEditModal({ visible: false, type: 1 })
  }

  const openEditModal = (type: 1 | 2, record?: any) => {
    setEditModal({ visible: true, type: type })
    if (record) {
      setSeletedActicity(record)
    }
  }

  const editConfirm = async (values: any) => {
    await createDispatch("config/iceEdit", {
      app,
      id: seletedActicity.id,
      type: editModal.type,
      ...values,
    })
    closeEditModal()
    createDispatch("config/confList", { app })
  }

  const historyColumns = [
    {
      title: "ID",
      dataIndex: "id",
    },
    {
      title: "操作人",
      dataIndex: "operator",
    },
    {
      title: "时间",
      dataIndex: "createAt",
      render: (text: any) =>
        text && <p>{moment(text).format("YYYY-MM-DD HH:mm:ss")}</p>,
    },
    {
      title: "备注",
      dataIndex: "reason",
    },
    {
      title: "操作",
      dataIndex: "operation",
      render: (text: any, record: any) => (
        <>
          <Button type="link" onClick={() => pushRollback(record.id)}>
            回滚
          </Button>
          <Button
            type="link"
            onClick={() =>
              exportIce({ iceId: record.iceId, pushId: record.id })
            }
          >
            导出
          </Button>
          <Button type="link" onClick={() => deleteHistory(record.id)}>
            删除
          </Button>
        </>
      ),
    },
  ]

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

  const importConfirm = async (values: any) => {
    await createDispatch("config/iceImport", {
      json: values.parameter,
    })
    closeImportModal()
    createDispatch("config/confList", { app })
  }

  const exportIce = async (v: any) => {
    await createDispatch("config/iceExport", {
      ...v,
    })
    setExportVisible(true)
    colseHistory()
  }

  const onCopy = () => {
    closeExportModal()
  }

  const closeExportModal = () => setExportVisible(false)

  return (
    <div>
      <Button onClick={() => openEditModal(1)}>新增</Button>
      <Button style={{ marginLeft: 20 }} onClick={() => openImportModal()}>
        导入
      </Button>
      <JNSearchTable
        searchFormData={searchFormData}
        tableProps={{
          loading: isTableLoading,
          columns: columns,
          dataSource: confList.list,
          rowKey: "id",
          pagination: { total: confList.total },
        }}
        onSearch={(val:any) => {
          createDispatch("config/confList", { app, ...val })
        }}
      />
      <Modal
        title={`备份历史`}
        visible={showHistory.visible}
        onCancel={colseHistory}
        footer={null}
        width={800}
      >
        <Table columns={historyColumns} dataSource={list} rowKey="id" />
      </Modal>
      <JNFormModal
        visible={editModal.visible}
        confirm={editConfirm}
        cancel={closeEditModal}
        formData={editFormData}
        title={editModal.type === 1 ? "新增ICE" : "编辑ICE"}
      />
      <JNFormModal
        visible={pushVisible.visible}
        confirm={pushConfirm}
        cancel={closePushModal}
        formData={pushFormData}
        title="备份"
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
    </div>
  )
}

export default connect("config")(ActivityList)
