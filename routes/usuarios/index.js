'use strict'

const { trace } = require('@opentelemetry/api');

const tracer = trace.getTracer('fastify-learning', '1.0.0');

module.exports = async function (fastify, opts) {
    const userSchema = {
        type: 'object',
        properties: {
            id: { type: 'integer' },
            nome: { type: 'string' },
            email: { type: 'string' }
        }
    }

    fastify.get('/:id', {
        onRequest: [fastify.authenticate],
        schema: {
            description: 'Busca um usuário no banco e faz cache no Redis',
            params: {
                type: 'object',
                properties: { id: { type: 'string' } }
            },
            response: {
                200: userSchema
            }
        }
    }, async function (request, reply) {
        const { id } = request.params

        return tracer.startActiveSpan('usuarios.buscar_detalhes', async (span) => {
            try {
                span.setAttribute('usuario.id_buscado', id)
                span.setAttribute('http.user_agent', request.headers['user-agent'])

                // Cache com Redis
                const cacheKey = `user:${id}`
                const cachedUser = await fastify.redis.get(cacheKey)

                if (cachedUser) {
                    span.addEvent('cache_hit', { key: cacheKey })
                    return JSON.parse(cachedUser)
                }

                span.addEvent('cache_miss')

                // Consulta no banco de dados
                const { rows } = await fastify.pg.query(
                    'SELECT id, nome, email FROM usuarios WHERE id = $1', [id]
                )

                if (rows.length === 0) {
                    span.setStatus({ code: SpanStatusCode.ERROR, message: 'Usuário inexistente' })
                    return reply.code(404).send({ error: 'Usuário não encontrado' })
                }

                const usuario = rows[0]

                // Salva no cache para a próxima vez
                await fastify.redis.set(cacheKey, JSON.stringify(usuario), 'EX', 3600)

                return usuario

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