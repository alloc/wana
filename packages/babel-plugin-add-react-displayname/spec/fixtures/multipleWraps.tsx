export const Test1 = React.memo(
  React.forwardRef((props, ref) => {
    return <div />
  })
)

const Test2 = React.memo(
  React.forwardRef((props, ref) => {
    return <div />
  })
)
