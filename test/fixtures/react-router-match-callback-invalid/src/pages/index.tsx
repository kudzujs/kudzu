import { useMatch } from "react-router-dom"

const HandleClick = () => {
  const match = useMatch("/")
  console.log(match)
}

export default function Page() {
  return <button onClick={HandleClick}>Check</button>
}
