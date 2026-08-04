import { useNavigate as useRouteNavigation } from "react-router-dom"

export default function Page() {
  const navigate = useRouteNavigation()

  function openItem() {
    navigate("/items/oak?view=full#details")
  }

  return <main>
    <button data-open onClick={openItem}>Open item</button>
    <button data-replace onClick={() => navigate("/login", { replace: true })}>Replace with login</button>
  </main>
}
