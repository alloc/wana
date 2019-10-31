import { Auto } from '../auto'

/** Use an `Auto` object to track any observed properties in `create`  */
export function useAutoValue<In extends ReadonlyArray<any>, Out>(
  auto: Auto,
  create: (...args: In) => Out,
  ...args: In
) {
  let result: Out | undefined
  try {
    const observer = auto.start(create)
    result = create(...args)
    auto.finish(observer)
  } catch (error) {
    auto.catch(error)
  }
  return result
}
