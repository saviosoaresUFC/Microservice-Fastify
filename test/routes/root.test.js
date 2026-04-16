'use strict'

const { test } = require('node:test')
const assert = require('node:assert')
const { build } = require('../helper')

test('deve retornar erro 404 para usuario inexistente', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/usuarios/999'
  })
  assert.deepStrictEqual(res.statusCode, 404)
})
