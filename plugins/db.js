'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (fastify, opts) {
    if (!fastify.config) {
        throw new Error('Plugin de configuração não foi carregado antes do Banco de Dados!')
    }

    console.log(fastify.config)

    await fastify.register(require('@fastify/postgres'), {
        connectionString: fastify.config.DATABASE_URL
    })

    fastify.addHook('onReady', async () => {
        try {
            const client = await fastify.pg.connect()
            fastify.log.info('Postgres conectado com sucesso!')
            client.release()
        } catch (err) {
            fastify.log.error('Falha na conexao com o banco:', err.message)
            process.exit(1)
        }
    })
}, {
    name: 'postgres-db',
    dependencies: ['fastify-env']
})