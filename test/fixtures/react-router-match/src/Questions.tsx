/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership.
 * Licensed under the Apache License, Version 2.0.
 */
import { useMatch } from "react-router-dom"

export default function Questions() {
  const isIndexPage = useMatch("/")
  let pageTitle = "Questions"
  let slogan = ""
  if (isIndexPage) {
    pageTitle = "Answer"
    slogan = "Questions and answers"
  }
  return <main><h1>{pageTitle}</h1><p>{slogan}</p></main>
}
