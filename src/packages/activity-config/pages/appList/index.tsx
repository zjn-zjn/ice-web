import React, { useEffect ,useState} from "react"
import connect  from "utils/connect"
import Button from "antd/lib/button"
import Icon from "antd/lib/icon"
import "./index.scss"
import {JNFormModal } from "../../../../groot"

const AppList = (props: any) => {
  const { history, config = {}, createDispatch } = props
  const { appList = {} } = config
  const {list = []} =appList

  useEffect(() => {
    createDispatch("config/appList")
  }, [])

  const linkToList = (id: number) => {
    history.push(`/config/list/${id}`)
  }

  // console.log(appList)
  const [editModal, setEditModal] = useState({ type: 1, visible: false })
  const [seletedActicity, setSeletedActicity] = useState<any>({})

  const openEditModal = (type: 1 | 2, record?: any) => {
    setEditModal({ visible: true, type: type })
    if (record) {
      setSeletedActicity(record)
    }
  }

  const editConfirm = async (values: any) => {
    await createDispatch("config/appEdit", {
      id: seletedActicity.id,
      type: editModal.type,
      ...values,
    })
    closeEditModal()
    createDispatch("config/appList")
  }

  const closeEditModal = () => {
    setEditModal({ visible: false, type: 1})
    setSeletedActicity({})
  }

  const editFormData: any[] = [
    {
      id: "name",
      label: "名称",
      type: "input",
      options: {
        initialValue: seletedActicity.name,
      },
    },
    {
      id: "info",
      label: "描述",
      type: "input",
      options: {
        initialValue: seletedActicity.info,
      },
    },
  ]

  return (
    <div>
      <div>
        <Button onClick={() => openEditModal(1)}>新增</Button>
      </div>
      <div className="app-list">
      {list.map((a: any) => (
        <div className="app-item" key={a.id} onClick={() => linkToList(a.id)}>
          <div className="app-edit">
            <Icon type="form" onClick={(e:any) => {
              e.stopPropagation()  
              return openEditModal(2, a) 
            }}/>
          </div>
          <p>{a.name}</p>
          <p>app: {a.id}</p>
          <p>{a.info}</p>
        </div>
      ))}
      </div>
      <JNFormModal
        visible={editModal.visible}
        confirm={editConfirm}
        cancel={closeEditModal}
        formData={editFormData}
        title={editModal.type === 1 ? "新增" : "编辑"}
      />
    </div>
  )
}

export default connect("config")(AppList)
