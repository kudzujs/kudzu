import { CheckIcon, SearchIcon } from "../icons"

export default function IconPage() {
  return <main>
    <h1>Source-owned icons</h1>
    <SearchIcon data-icon="search" className="catalog-icon" size={20} width={28} strokeWidth={1.5} role="img" title="Search catalog" />
    <CheckIcon data-icon="check" className="status-icon" size={16} height={18} fill="currentColor" aria-hidden={true} />
  </main>
}
