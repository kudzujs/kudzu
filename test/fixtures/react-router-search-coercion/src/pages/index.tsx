/* Licensed to the Apache Software Foundation (ASF) under Apache License 2.0. */
import { useSearchParams } from "react-router-dom"

export default function Page() {
  const [urlSearchParams] = useSearchParams()
  const curPage = Number(urlSearchParams.get("page")) || 1
  return <main data-page={curPage}><output>{curPage}</output></main>
}
