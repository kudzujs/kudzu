export function applyCommands(state, commands, commit, log = console.log) {
  const changed=new Set
  for(const [operation,id,value] of commands){
    const current=state.get(id)
    if(operation==="log")log(value,current)
    else {
      state.set(id,operation==="add"?current+value:value)
      changed.add(id)
    }
  }
  for(const id of changed)commit(id,state.get(id))
}

export const browserState=new Map

export function commitDom(id, value) {
  for(const node of document.querySelectorAll(`[data-k-text="${id}"]`))node.textContent = value
}

if(typeof document!=="undefined"){
  const initialState = document.body.dataset.kState
  if (initialState) for (const [id, value] of JSON.parse(initialState)) browserState.set(id, value)
  for(const node of document.querySelectorAll("[data-k-text]"))browserState.set(node.dataset.kText,JSON.parse(node.dataset.kValue))

  const eventNames = ["click", "input", "change"]
  for(const eventName of eventNames)document.addEventListener(eventName,event=>{
      const target=event.target.closest(`[data-k-on-${eventName}]`)
      if(target)applyCommands(browserState,JSON.parse(target.getAttribute(`data-k-on-${eventName}`)),commitDom)
    })
}
