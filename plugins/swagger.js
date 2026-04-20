'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (fastify, opts) {
    await fastify.register(require('@fastify/swagger'), {
        openapi: {
            info: {
                title: 'Fastify Learning',
                description: 'Documentação da API de aprendizado',
                version: '0.1.0'
            }
        }
    })

    await fastify.register(require('@fastify/swagger-ui'), {
        routePrefix: '/docs',
        uiConfig: { docExpansion: 'full', deepLinking: false }
    })
})