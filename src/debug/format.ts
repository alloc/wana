import { is } from '@alloc/is'

type Indexable<T> = { [key: string]: T }

export function format(
  message: string,
  values: Indexable<any>,
  styles: Indexable<string> = {}
) {
  const args: any[] = []
  const formatted = message.replace(/\$(\w+)/g, (_, key) => {
    const value =
      key in styles && typeof values[key] == 'object'
        ? JSON.stringify(values[key])
        : values[key]

    const style =
      key in styles ? styles[key] : is.string(value) ? 'color: #5162FF' : null

    if (is.string(style)) {
      args.push(style, String(value), '')
      return '%c%s%c'
    }

    args.push(value)
    return '%O'
  })
  return [formatted].concat(args)
}
