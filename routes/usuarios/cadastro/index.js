'use strict'

const bcrypt = require('bcrypt')
const { trace, SpanStatusCode } = require('@opentelemetry/api')
const tracer = trace.getTracer('usuario-service')

module.exports = async function (fastify, opts) {
    fastify.post('/', {
        schema: {
            body: {
                type: 'object',
                required: ['nome', 'email', 'senha'],
                properties: {
                    nome: { type: 'string', minLength: 3 },
                    email: { type: 'string', format: 'email' },
                    senha: { type: 'string', minLength: 6 }
                }
            }
        }
    }, async (request, reply) => {
        const { nome, email, senha } = request.body

        return tracer.startActiveSpan('usuarios.cadastrar', async (span) => {
            try {
                const passwordHash = await bcrypt.hash(senha, 10)

                const novoUsuario = await fastify.prisma.usuario.create({
                    data: {
                        nome,
                        email,
                        senha: passwordHash
                    },
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        createdAt: true
                    }
                })

                span.setAttribute('usuario.id', novoUsuario.id)

                return reply.code(201).send(novoUsuario)

            } catch (err) {
                span.recordException(err)
                span.setStatus({ code: SpanStatusCode.ERROR, message: err.message })

                // Prisma (P2002 = Unique Constraint)
                if (err.code === 'P2002') {
                    span.addEvent('cadastro_falhou_email_duplicado')
                    throw fastify.httpErrors.conflict('E-mail já cadastrado no sistema')
                }

                throw err
            } finally {
                span.end()
            }
        })
    })
}