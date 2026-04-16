'use strict'

require('dotenv').config()

const fastify = require('fastify')({
    logger: true
})

const app = require('./app.js')

async function start() {
    try {
        await fastify.register(app)

        await fastify.listen({ port: 3000, host: '0.0.0.0' })

        console.log('Servidor rodando na porta 3000')
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()