/* Licensed to the Apache Software Foundation (ASF) under Apache License 2.0. */
import { useSearchParams } from "react-router-dom"
import { QUESTION_ORDER_KEYS, type QuestionOrder } from "../order"

export default function Page() {
  const [urlSearchParams] = useSearchParams()
  const curOrder = (urlSearchParams.get("order") || QUESTION_ORDER_KEYS[0]) as QuestionOrder
  return <main data-order={curOrder}><output>{curOrder}</output></main>
}
