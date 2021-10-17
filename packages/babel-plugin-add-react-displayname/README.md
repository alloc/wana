# @wana/babel-plugin-add-react-displayname

Set the `displayName` property of your higher-order function components, using a Babel plugin! 🥳

- Plain function components are skipped, since they have good support in React devtools.
- Class components are **not** supported.

Forked from: [opbeat/babel-plugin-add-react-displayname](https://github.com/opbeat/babel-plugin-add-react-displayname)

Works with **Babel 7.0.0+**

## Usage

```sh
npm install @wana/babel-plugin-add-react-displayname
```

And in `.babelrc` or whatever:

```json
{
    "plugins": [
        "@wana/add-react-displayname"
    ]
}
```

### Options

- `callees?: string[]`

  Set the `displayName` of any component wrapped by one of these function names,
  even when the component doesn't return JSX.
