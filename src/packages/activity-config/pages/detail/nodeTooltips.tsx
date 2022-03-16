import React from "react"

import "./index.scss"

const NodeTooltips = ({ x, y, detail }: any) => {
  return (
    <div className="node-tooltips" style={{ top: `${y}px`, left: `${x}px` }}>
      {Object.keys(detail).map((key: any) => (
        <div key={key} className="key-item">
          <span className="key">{key}:</span>
          <span>
            {detail[key].toString ? detail[key].toString() : detail[key]}
          </span>
        </div>
      ))}
    </div>
  )
}

export default NodeTooltips
