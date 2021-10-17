import type { NodePath, types as t } from '@babel/core'
import addReactDisplayName from '@wana/babel-plugin-add-react-displayname'
import { declare } from '@babel/helper-plugin-utils'

export default declare((babel, _options, dirname) => {
  babel.assertVersion(7)

  const { types: t } = babel

  const displayNamePlugin = addReactDisplayName(
    babel,
    { callees: ['withAuto'] },
    dirname
  )

  const wrapRender = babel.template.statements(wrapRenderTmpl, {
    plugins: ['jsx', 'typescript'],
  })

  return {
    name: '@wana/babel-plugin-with-auto',
    visitor: {
      ...displayNamePlugin.visitor,
      Program(program) {
        const importDecl = getImportDeclaration(program, 'wana')
        if (!importDecl) {
          return
        }

        program.traverse({
          CallExpression(call) {
            const callee = call.get('callee')
            if (!callee.isIdentifier({ name: 'withAuto' })) {
              return
            }

            const [renderFn] = call.get('arguments')
            if (isFunctionExpression(renderFn)) {
              // Turn "withAuto" into "withAuto.dev"
              callee.replaceWith(
                t.memberExpression(
                  t.cloneNode(callee.node),
                  t.identifier('dev')
                )
              )

              replaceReturns(renderFn)
              insertAutoRender(renderFn)
              unwrapHiddenProps(renderFn, ['$auto', '$useCommit'])
            }
          },
        })
      },
    },
  }

  function isFunctionExpression(
    arg: any
  ): arg is NodePath<t.ArrowFunctionExpression | t.FunctionExpression> {
    return (
      arg && (arg.isFunctionExpression() || arg.isArrowFunctionExpression())
    )
  }

  // Replace return statements with $result assignment.
  function replaceReturns(
    renderFn: NodePath<t.ArrowFunctionExpression | t.FunctionExpression>
  ) {
    const bodyPath = renderFn.get('body')
    if (bodyPath.isExpression()) {
      return bodyPath.replaceWith(
        t.blockStatement([
          t.expressionStatement(
            t.assignmentExpression(
              '=',
              t.identifier('$result'),
              t.cloneNode(bodyPath.node)
            )
          ),
        ])
      )
    }
    renderFn.traverse({
      Function(fn) {
        // Skip nested functions.
        fn.skip()
      },
      ReturnStatement(stmt) {
        stmt.insertAfter(t.breakStatement(t.identifier('$render')))
        if (stmt.node.argument)
          stmt.replaceWith(
            t.expressionStatement(
              t.assignmentExpression(
                '=',
                t.identifier('$result'),
                t.cloneNode(stmt.node.argument)
              )
            )
          )
      },
    })
  }

  // Wrap the render function body with auto-rendering logic.
  function insertAutoRender(
    renderFn: NodePath<t.ArrowFunctionExpression | t.FunctionExpression>
  ) {
    const bodyPath = renderFn.get('body')

    const body = t.cloneNode(bodyPath.node)
    const render: t.BlockStatement = t.isExpression(body)
      ? t.blockStatement([t.expressionStatement(body)])
      : body

    bodyPath.replaceWith(t.blockStatement(wrapRender({ render })))
  }

  function unwrapHiddenProps(
    fn: NodePath<t.ArrowFunctionExpression | t.FunctionExpression>,
    hiddenPropNames: string[]
  ) {
    const hiddenProps = hiddenPropNames.map(prop => {
      const key = t.identifier(prop)
      return t.objectProperty(key, key, false, true)
    })
    const paramPaths = fn.get('params')
    const { params } = fn.node
    if (!params.length) {
      params.push(t.objectPattern(hiddenProps))
    } else {
      const [propsParam] = paramPaths
      if (propsParam.isIdentifier()) {
        propsParam.replaceWith(
          t.objectPattern([
            ...hiddenProps,
            t.restElement(t.cloneNode(propsParam.node)),
          ])
        )
      } else {
        propsParam.assertObjectPattern()
        const props = (propsParam.node as t.ObjectPattern).properties
        props.unshift(...hiddenProps)
      }
    }
  }
})

function getImportDeclaration(
  program: NodePath<t.Program>,
  moduleName: string
) {
  return program
    .get('body')
    .find(
      stmt => stmt.isImportDeclaration() && stmt.node.source.value == moduleName
    ) as NodePath<t.ImportDeclaration> | undefined
}

const wrapRenderTmpl = `
let $result, $commit = $useCommit($auto.start())
$render: try %%render%%
finally {
  $auto.stop()
}
return (
  <>
    {$result}
    {$commit()}
  </>
)
`
