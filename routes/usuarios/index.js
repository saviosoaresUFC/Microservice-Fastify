'use strict'

const { trace, SpanStatusCode } = require('@opentelemetry/api')
const tracer = trace.getTracer('fastify-learning', '1.0.0')

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
            description: 'Busca um usuário no banco via Prisma e faz cache no Redis',
            params: {
                type: 'object',
                properties: { id: { type: 'integer' } }
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

                // Tenta o Cache no Redis
                const cacheKey = `user:${id}`
                const cachedUser = await fastify.redis.get(cacheKey)

                if (cachedUser) {
                    span.addEvent('cache_hit', { key: cacheKey })
                    return JSON.parse(cachedUser)
                }

                span.addEvent('cache_miss')

                const usuario = await fastify.prisma.usuario.findUnique({
                    where: { id: Number(id) },
                    select: {
                        id: true,
                        nome: true,
                        email: true
                    }
                })

                if (!usuario) {
                    span.setStatus({ code: SpanStatusCode.ERROR, message: 'Usuário inexistente' })
                    return reply.code(404).send({ error: 'Usuário não encontrado' })
                }

                // Salva no Redis e retorna
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