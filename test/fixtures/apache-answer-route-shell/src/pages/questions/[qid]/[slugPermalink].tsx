import { useParams } from "react-router-dom";
import { Shell } from "../../../Shell";
export const layout = Shell;
export const runtimeParams = true;
export default function Question() {
  const { qid, slugPermalink } = useParams<{
    qid: string;
    slugPermalink: string;
  }>();
  return (
    <main>
      <h1>{slugPermalink}</h1>
      <p data-question-id>{qid}</p>
    </main>
  );
}
