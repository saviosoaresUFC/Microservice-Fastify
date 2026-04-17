'use strict'

const bcrypt = require('bcrypt')
const { trace } = require('@opentelemetry/api')
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
                // Verifica se o e-mail já existe
                const userExists = await fastify.pg.query(
                    'SELECT id FROM usuarios WHERE email = $1', [email]
                )

                if (userExists.rows.length > 0) {
                    span.addEvent('cadastro_falhou_email_duplicado')
                    throw fastify.httpErrors.conflict('E-mail já cadastrado no sistema')
                }

                // Hash da senha
                const passwordHash = await bcrypt.hash(senha, 10)

                // Insere o usuário no Banco
                const { rows } = await fastify.pg.query(
                    'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email',
                    [nome, email, passwordHash]
                )

                span.setAttribute('usuario.id', rows[0].id)
                reply.code(201)
                return rows[0]
            } catch (err) {
                span.recordException(err)
                throw err
            } finally {
                span.end()
            }
        })
    })
}