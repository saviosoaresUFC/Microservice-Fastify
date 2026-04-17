'use strict'

const { trace, SpanStatusCode } = require('@opentelemetry/api')
const tracer = trace.getTracer('usuarios-service')

module.exports = async function (fastify, opts) {
    fastify.patch('/:id', {
        onRequest: [fastify.authenticate],
        schema: {
            params: {
                type: 'object',
                properties: { id: { type: 'integer' } }
            },
            body: {
                type: 'object',
                properties: {
                    nome: { type: 'string', minLength: 3 },
                    email: { type: 'string', format: 'email' }
                }
            }
        }
    }, async (request, reply) => {
        const { id } = request.params
        const { nome, email } = request.body

        if (request.user.id !== id) {
            throw fastify.httpErrors.forbidden('Você não tem permissão para alterar este usuário')
        }

        return tracer.startActiveSpan('usuarios.atualizar', async (span) => {
            try {
                span.setAttribute('usuario.id', id)

                // COALESCE permite atualizar apenas um campo se o outro não for enviado
                const query = `
          UPDATE usuarios 
          SET nome = COALESCE($1, nome), 
              email = COALESCE($2, email) 
          WHERE id = $3 
          RETURNING id, nome, email
        `
                const { rows } = await fastify.pg.query(query, [nome, email, id])

                if (rows.length === 0) {
                    throw fastify.httpErrors.notFound('Usuário não encontrado no banco')
                }

                // Invalidação de cache
                const cacheKey = `user:${id}`
                await fastify.redis.del(cacheKey)

                span.addEvent('cache_invalidated', { key: cacheKey })

                return rows[0]

            } catch (err) {
                span.recordException(err)
                span.setStatus({ code: SpanStatusCode.ERROR, message: err.message })
                throw err
            } finally {
                span.end()
            }
        })
    })
}