import React from "react"
import { Link as RouterLink } from "react-router-dom"
import logo from "../logo.svg?url"
import cssUrl from "../download.css?url"

function StaticPage() {
  return <React.Fragment><main><img src={logo} alt="Leaf mark" /><h1>Static Vite page</h1><RouterLink to="/about?tab=all#top" className="about-link">About</RouterLink><a href={cssUrl}>Download CSS</a></main></React.Fragment>
}

export default React.memo(StaticPage)
