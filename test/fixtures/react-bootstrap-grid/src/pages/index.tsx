/* Licensed to the Apache Software Foundation (ASF) under Apache License 2.0. */
import { Col, Row } from "react-bootstrap"

export default function Page() {
  return <main>
    <Row><Col md={6}>Questions</Col></Row>
    <Row><Col className="mx-auto" md={6} lg={4} xl={3}>Login</Col></Row>
    <Row><Col className="mb-4" xl={3} lg={4} md={4} sm={6} xs={12}>Tag</Col></Row>
  </main>
}
