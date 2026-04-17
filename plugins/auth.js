'use strict'
const fp = require('fastify-plugin')

module.exports = fp(async function (fastify, opts) {
    fastify.register(require('@fastify/jwt'), {
        secret: process.env.JWT_SECRET || 'chave-secreta-projeto-2026'
    })

    fastify.decorate('authenticate', async function (request, reply) {
        try {
            await request.jwtVerify()
        } catch (err) {
            reply.send(err)
        }
    })
}, { name: 'auth-plugin' })