'use strict'
const fp = require('fastify-plugin')

module.exports = fp(async function (fastify, opts) {
    const schema = {
        type: 'object',
        required: ['DATABASE_URL'],
        properties: {
            DATABASE_URL: { type: 'string' }
        }
    }

    await fastify.register(require('@fastify/env'), {
        schema,
        dotenv: true
    })
}, { name: 'fastify-env' })