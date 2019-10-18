import React, { ReactNode } from 'react'

const context = React.createContext({ depth: 0 })
const { Provider } = context

/** The provided state is assumed to be constant (except for children). */
export const AutoContext = (props: { depth: number; children: ReactNode }) => {
  const state = React.useRef({ depth: props.depth + 1 }).current
  return <Provider value={state}>{props.children}</Provider>
}

export const useAutoContext = () => React.useContext(context)
