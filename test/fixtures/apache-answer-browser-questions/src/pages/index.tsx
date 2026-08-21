/* Licensed to the Apache Software Foundation (ASF) under Apache License 2.0. */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { QUESTION_ORDER_KEYS, type QuestionOrder } from "../order";

type Question = {
  id: number;
  title: string;
  tags: { slug: string; name: string }[];
};

export default function Questions() {
  const [urlSearchParams] = useSearchParams();
  const curPage = Number(urlSearchParams.get("page")) || 1;
  const curOrder = (urlSearchParams.get("order") ||
    QUESTION_ORDER_KEYS[0]) as QuestionOrder;
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    setStatus("loading");
    setError("");
    const endpoint = curOrder === "recommend" ? "recommend/page" : "page";
    void fetch(
      `/answer/api/v1/question/${endpoint}?page_size=20&page=${curPage}&order=${curOrder}`,
    )
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((next) => {
        setQuestions(next.data);
        setStatus("success");
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : String(cause));
        setStatus("error");
      });
  }, [curPage, curOrder]);

  return (
    <main data-page={curPage} data-order={curOrder}>
      <h1>Questions</h1>
      {status === "loading" && <p role="status">Loading questions</p>}
      {status === "error" && <p role="alert">{error}</p>}
      {status === "success" && (
        <ul id="questions">
          {questions.map((question) => (
            <li key={question.id}>
              <h2>{question.title}</h2>
              <ul>
                {question.tags.map((tag) => (
                  <li key={tag.slug}>{tag.name}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
