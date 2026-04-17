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
        const { rows } = await fastify.pg.query(
            'SELECT id, nome, email, senha FROM usuarios WHERE email = $1',
            [email]
        )

        if (rows.length === 0) {
            // Retorne 401 genérico para não dar pista se o email existe ou não
            throw fastify.httpErrors.unauthorized('Usuário ou senha inválidos')
        }

        const usuario = rows[0]

        // Envolvendo a verificação da senha em um span manual para monitorar latência
        const senhaValida = await tracer.startActiveSpan('auth.verify_password', async (innerSpan) => {
            const result = await bcrypt.compare(senha, usuario.senha)
            innerSpan.end()
            return result
        })

        if (!senhaValida) {
            const activeSpan = trace.getActiveSpan()
            activeSpan.setStatus({ code: SpanStatusCode.ERROR, message: 'Senha inválida' })
            throw fastify.httpErrors.unauthorized('Usuário ou senha inválidos')
        }

        // Gera o Token com Payload enxuto (ID e Email)
        const auth_token = fastify.jwt.sign({
            id: usuario.id,
            email: usuario.email
        })

        // Retorna o token conforme você pediu
        return { auth_token }
    })
}