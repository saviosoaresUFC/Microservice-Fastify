'use strict'

const { trace, SpanStatusCode } = require('@opentelemetry/api')
const bcrypt = require('bcrypt')

const tracer = trace.getTracer('auth-service')

module.exports = async function (fastify, opts) {
    fastify.post('/', {
        schema: {
            body: {
                type: 'object',
                required: ['email', 'senha'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    senha: { type: 'string', minLength: 6 }
                }
            }
        }
    }, async (request, reply) => {
        const { email, senha } = request.body

        // Busca o usuário pelo email
        const usuario = await fastify.prisma.usuario.findUnique({
            where: { email }
        })

        if (!usuario) {
            throw fastify.httpErrors.unauthorized('Usuário ou senha inválidos')
        }

        // Verificação de senha
        const senhaValida = await tracer.startActiveSpan('auth.verify_password', async (innerSpan) => {
            try {
                const result = await bcrypt.compare(senha, usuario.senha)
                return result
            } finally {
                innerSpan.end()
            }
        })

        if (!senhaValida) {
            const activeSpan = trace.getActiveSpan()
            if (activeSpan) {
                activeSpan.setStatus({ code: SpanStatusCode.ERROR, message: 'Senha inválida' })
            }
            throw fastify.httpErrors.unauthorized('Usuário ou senha inválidos')
        }

        // Geração de token
        const auth_token = fastify.jwt.sign({
            id: usuario.id,
            email: usuario.email
        })

        return { auth_token }
    })
}