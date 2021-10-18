import { render } from '@testing-library/react'
import { flushMicroTasks } from 'flush-microtasks'
import React from 'react'
import { o, useAuto, withAuto } from 'wana'

describe('useAuto', () => {
  it('runs on every render by default', () => {
    const calls: any[] = []
    const state = o({ count: 0 })
    const Test = () => {
      useAuto(() => {
        calls.push(state.count)
      })
      return null
    }

    const elem = render(<Test />)
    elem.rerender(<Test />)

    expect(calls).toEqual([0, 0])
  })

  it('can be given a deps array', () => {
    const calls: any[] = []
    const state = o({ count: 0 })
    const Test = (props: { deps: any[] }) => {
      useAuto(() => {
        calls.push(state.count)
      }, props.deps)
      return null
    }

    const elem = render(<Test deps={[1]} />)
    elem.rerender(<Test deps={[1]} />) // useAuto should *not* run here
    elem.rerender(<Test deps={[2]} />)

    expect(calls).toEqual([0, 0])
  })

  it('reacts to observable changes', async () => {
    const calls: any[] = []
    const state = o({ count: 0 })
    const Test = () => {
      useAuto(() => {
        calls.push(state.count)
      })
      return null
    }

    render(<Test />)
    expect(calls).toEqual([0])

    state.count++
    state.count++
    await flushMicroTasks()
    expect(calls).toEqual([0, 2])
  })

  it.todo('stops observing on dismount')

  it('can be used inside a "withAuto" component', async () => {
    const calls: any[] = []
    const state = o({ count: 0 })
    const Test = withAuto(() => {
      useAuto(() => {
        calls.push(state.count)
      }, [])
      return <div>{state.count}</div>
    })

    render(<Test />)
    expect(calls).toEqual([0])

    state.count++
    state.count++
    await flushMicroTasks()
    expect(calls).toEqual([0, 2])
  })

  it('can set component state inside "withAuto"', async () => {
    const calls: any[] = []

    const state = o({ count: 0 })
    const Test = withAuto(() => {
      const [count, setCount] = React.useState(state.count)
      useAuto(() => {
        setCount(state.count)
      }, [])
      calls.push(count)
      return null
    })

    render(<Test />)
    expect(calls).toEqual([0])

    state.count++
    await flushMicroTasks()
    expect(calls).toEqual([0, 1])
  })
})
