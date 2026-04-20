const { metrics } = require('@opentelemetry/api');
const meter = metrics.getMeter('fastify-learning-metrics');

const loginCounter = meter.createCounter('auth.login_attempts', {
    description: 'Conta total de tentativas de login'
});

const photoProcessingTime = meter.createHistogram('media.processing_duration', {
    unit: 'ms'
});

module.exports = { loginCounter, photoProcessingTime };