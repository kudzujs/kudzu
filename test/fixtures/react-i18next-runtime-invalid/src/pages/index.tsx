/* Licensed to the Apache Software Foundation (ASF) under Apache License 2.0. */
import { useTranslation } from "react-i18next"

export default function Page() {
  const { t } = useTranslation("translation", { keyPrefix: "question" })
  const { t: t2 } = useTranslation("translation")
  return <main><h1>{t("questions", { keyPrefix: "page_title" })}</h1><p>{t2("website_welcome", { site_name: "Answer" })}</p></main>
}
