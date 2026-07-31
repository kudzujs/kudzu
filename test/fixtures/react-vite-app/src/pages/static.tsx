import React from "react"
import logo from "../logo.svg?url"

function StaticPage() {
  return <React.Fragment><main><img src={logo} alt="Leaf mark" /><h1>Static Vite page</h1></main></React.Fragment>
}

export default React.memo(StaticPage)
