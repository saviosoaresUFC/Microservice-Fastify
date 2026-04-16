'use strict'

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
        const cacheKey = `user:${id}`

        // Tenta buscar no Redis (Cache)
        try {
            const cachedUser = await fastify.redis.get(cacheKey)
            if (cachedUser) {
                fastify.log.info({ cache: true }, 'Cache Hit!')
                return JSON.parse(cachedUser)
            }
        } catch (err) {
            // Se o Redis falhar, não quebra a API (Failover)
            fastify.log.error('Redis Error:', err)
        }

        // Se não estiver no cache, busca no Postgres
        const { rows } = await fastify.pg.query(
            'SELECT id, nome, email FROM usuarios WHERE id = $1', [id]
        )

        if (rows.length === 0) {
            return reply.code(404).send({ error: 'Usuário não encontrado' })
        }

        const user = rows[0]

        // Salva no Redis para a próxima vez (expira em 1 hora - 3600s)
        await fastify.redis.set(cacheKey, JSON.stringify(user), 'EX', 3600)

        fastify.log.info({ cache: false }, 'Cache Miss - Database loaded')
        return user
    })
}