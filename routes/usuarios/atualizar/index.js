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

                const usuarioAtualizado = await fastify.prisma.usuario.update({
                    where: { id },
                    data: {
                        nome: nome || undefined,
                        email: email || undefined
                    },
                    select: {
                        id: true,
                        nome: true,
                        email: true
                    }
                })

                // Invalidação de cache
                const cacheKey = `user:${id}`
                await fastify.redis.del(cacheKey)
                span.addEvent('cache_invalidated', { key: cacheKey })

                return usuarioAtualizado

            } catch (err) {
                span.recordException(err)
                span.setStatus({ code: SpanStatusCode.ERROR, message: err.message })

                // Prisma (P2025 = Not Found)
                if (err.code === 'P2025') {
                    throw fastify.httpErrors.notFound('Usuário não encontrado no banco')
                }
                // Prisma (P2002 = Unique Constraint)
                if (err.code === 'P2002') {
                    throw fastify.httpErrors.conflict('Este e-mail já está em uso')
                }

                throw err
            } finally {
                span.end()
            }
        })
    })
}