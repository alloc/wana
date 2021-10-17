import { withAuto } from 'wana'
// ✂︎ one-line arrow fn (no props)
withAuto(() => <div />)
// ✂︎ one-line arrow fn
withAuto(props => <div {...props} />)
// ✂︎ multi-line arrow fn (no props)
withAuto(() => {
  return <div />
})
// ✂︎ multi-line arrow fn
withAuto(props => {
  return <div {...props} />
})
// ✂︎ named fn expression (no props)
withAuto(function Foo() {
  return <div />
})
// ✂︎ named fn expression
withAuto(function Foo(props) {
  return <div {...props} />
})
// ✂︎ anonymous fn expression (no props)
withAuto(function () {
  return <div />
})
// ✂︎ anonymous fn expression
withAuto(function (props) {
  return <div {...props} />
})
// ✂︎ destructured props parameter
withAuto(({ x }) => {
  return <div {...x} />
})
// ✂︎ return inside if block
withAuto(props => {
  if (props.xxx) {
    return <div {...props} />
  } else {
    return <div {...props} xxy />
  }
})
// ✂︎ return inside if block (no else block)
withAuto(props => {
  if (props.xxx) {
    return <div {...props} />
  }
  const { a, b } = props
  return <div {...props} b={a} a={b} />
})
// ✂︎ return inside nested function
withAuto(() => {
  return (
    <div
      onClick={() => {
        return
      }}
    />
  )
})
// ✂︎ injected displayName
const Foo = withAuto(() => <div />)
