import { usePayees } from "../usePayees"

export default function Page() {
  const data = "Unrelated local"
  const { data: payees, setData: setPayees, rename: renamePayees, reset: resetPayees, shadow: selectLocal, collide: appendSuffix, scoped: nestedScope, setterCollision: localSetter, scopedLoop: loopScope, assignment: assignDefault } = usePayees()
  const { data: other, setData: setOther, rename: renameOther } = usePayees()
  return <main title={data}>
    <output id="payees">{payees}</output><output id="other">{other}</output>
    <button id="rename" onClick={renamePayees}>Rename</button>
    <button id="other-rename" onClick={renameOther}>Rename other</button>
    <button id="set" onClick={() => setPayees("Selected")}>Select</button>
    <button id="other-set" onClick={() => setOther("Other")}>Select other</button>
    <button id="reset" onClick={resetPayees}>Reset</button>
    <button id="shadow" onClick={selectLocal}>Select callback local</button>
    <button id="collision" onClick={appendSuffix}>Append callback local</button>
    <button id="scoped" onClick={nestedScope}>Nested scope</button>
    <button id="setter-collision" onClick={localSetter}>Local setter name</button>
    <button id="loop-scope" onClick={loopScope}>Loop and catch scope</button>
    <button id="assignment" onClick={assignDefault}>Destructured assignment default</button>
  </main>
}
