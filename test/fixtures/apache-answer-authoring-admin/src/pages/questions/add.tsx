import { useState } from "react";

export default function AskQuestion() {
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");

  return (
    <main>
      <h1>Ask a question</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const fields = new FormData(event.currentTarget);
          const question = {
            id: Date.now(),
            title: String(fields.get("title")),
            body: String(fields.get("body")),
          };
          const questions = JSON.parse(
            localStorage.getItem("answer-questions") || "[]",
          );
          localStorage.setItem(
            "answer-questions",
            JSON.stringify([...questions, question]),
          );
          setStatus("saved");
        }}
      >
        <label>
          Title <input name="title" required minLength={5} />
        </label>
        <label>
          Markdown{" "}
          <textarea
            name="body"
            required
            value={body}
            onInput={(event) => setBody(event.currentTarget.value)}
          />
        </label>
        <label>
          Import markdown{" "}
          <input
            type="file"
            accept=".md,text/markdown,text/plain"
            onChange={async (event) => {
              const file = event.currentTarget.files?.[0];
              if (file) setBody(await file.text());
            }}
          />
        </label>
        <button>Publish</button>
      </form>
      <section aria-label="Preview">
        <pre>{body}</pre>
      </section>
      {status && <p role="status">Question saved</p>}
    </main>
  );
}
