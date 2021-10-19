import type { NodePath, PluginPass, types as t } from '@babel/core'
import { declare } from '@babel/helper-plugin-utils'

type Options = {
  callees?: string[]
}

export default declare(babel => {
  babel.assertVersion(7)

  const { types: t } = babel

  const FunctionVisitor: babel.Visitor<PluginPass> = {
    FunctionExpression(path, state) {
      setDisplayNameIfPossible(path, state)
    },
    ArrowFunctionExpression(path, state) {
      setDisplayNameIfPossible(path, state)
    },
  }

  return {
    name: '@wana/babel-plugin-add-react-displayname',
    visitor: {
      VariableDeclaration(path, state) {
        path.traverse(FunctionVisitor, state)
      },
    },
  }

  function setDisplayNameIfPossible(
    path: NodePath<t.FunctionExpression | t.ArrowFunctionExpression>,
    state: PluginPass
  ) {
    const prevStmt = findBlockChild(path)
    if (!prevStmt) return

    const displayName = inferDisplayName(path, state.opts as Options)
    if (!displayName || /^[$_]?[a-z]/.test(displayName)) return

    if (path.isArrowFunctionExpression()) {
      const { params, body, returnType, typeParameters } = path.node
      const bodyBlock = t.isExpression(body)
        ? t.blockStatement([t.returnStatement(body)])
        : body
      const functionExpr = t.functionExpression(
        t.identifier(displayName),
        params,
        bodyBlock,
        false,
        false
      )
      functionExpr.returnType = returnType
      functionExpr.typeParameters = typeParameters
      path.replaceWith(functionExpr)
    } else {
      const newStmt = t.expressionStatement(
        t.assignmentExpression(
          '=',
          t.memberExpression(
            t.identifier(displayName),
            t.identifier('displayName')
          ),
          t.stringLiteral(displayName)
        )
      )
      newStmt.trailingComments = prevStmt.node.trailingComments
      prevStmt.node.trailingComments = null
      prevStmt.insertAfter(newStmt)
    }
  }

  function findLeftValue(expr: NodePath<t.Expression>) {
    let path = expr.parentPath
    while (path) {
      if (path.isBlockParent() || path.isProperty()) {
        return
      }
      if (path.isAssignmentExpression()) {
        return path.node.left
      }
      if (path.isVariableDeclarator()) {
        return path.node.id
      }
      path = path.parentPath!
    }
  }

  function findBlockChild(path: NodePath) {
    while (path.parentPath) {
      if (path.parentPath.isProperty()) {
        return
      }
      if (path.parentPath.isBlockParent()) {
        return path
      }
      path = path.parentPath
    }
  }

  function inferDisplayName(
    funcPath: NodePath<t.FunctionExpression | t.ArrowFunctionExpression>,
    opts: Options
  ) {
    const parentNode = funcPath.parentPath.node
    if (t.isVariableDeclarator(parentNode)) {
      // Ignore plain function components, like "const Foo = () => { ... }"
      return null
    }
    if (t.isCallExpression(parentNode) && parentNode.callee == funcPath.node) {
      // Ignore IIFEs that return JSX, like "(() => { ... })()"
      return null
    }
    if (
      doesReturnJSX(funcPath.node.body) ||
      (opts.callees && opts.callees.some(callee => hasCallee(funcPath, callee)))
    ) {
      const left = findLeftValue(funcPath)
      if (t.isIdentifier(left)) {
        return left.name
      }
    }
    return null
  }

  function hasCallee(path: NodePath, callee: string) {
    path = path.parentPath!
    while (path.isCallExpression()) {
      if (t.isIdentifier(path.node.callee, { name: callee })) {
        return true
      }
      path = path.parentPath
    }
    return false
  }

  function doesReturnJSX(node: t.Expression | t.BlockStatement) {
    if (!node) return false
    if (t.isJSX(node)) {
      return true
    }

    if (t.isBlockStatement(node)) {
      const len = node.body.length
      if (len) {
        const lastNode = node.body[len - 1]
        if (t.isReturnStatement(lastNode)) {
          return lastNode.argument && t.isJSX(lastNode.argument)
        }
      }
    }

    return false
  }
})
