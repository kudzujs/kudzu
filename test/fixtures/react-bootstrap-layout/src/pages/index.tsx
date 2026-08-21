/* Licensed to the Apache Software Foundation (ASF) under Apache License 2.0. */
import { FC } from "react";
import { Col, Row } from "react-bootstrap";

const Page: FC = () => {
  return (
    <Row className="pt-4 mb-5">
      <Col className="page-main flex-auto overflow-x-hidden">
        <h1>Questions</h1>
      </Col>
      <Col className="page-right-side mt-4 mt-xl-0">
        <aside>Welcome</aside>
      </Col>
    </Row>
  );
};

export default Page;
