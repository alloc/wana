import React, { ReactNode } from 'react'

const context = React.createContext({ depth: 0 })
const { Provider } = context

export type AutoContextProps = {
  depth: number
  children: ReactNode
}

/** The provided state is assumed to be constant (except for children). */
export const AutoContext = ({ children, ...props }: AutoContextProps) => (
  <Provider value={React.useRef(props).current}>{children}</Provider>
)

export const useAutoContext = () => React.useContext(context)
