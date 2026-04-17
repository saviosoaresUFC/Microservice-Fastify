const { metrics } = require('@opentelemetry/api');
const meter = metrics.getMeter('arena-hub-metrics');

// Contador de logins (Counter)
const loginCounter = meter.createCounter('auth.login_attempts', {
    description: 'Conta total de tentativas de login'
});

// Histograma de tempo de processamento de fotos (Histogram)
const photoProcessingTime = meter.createHistogram('media.processing_duration', {
    unit: 'ms'
});

module.exports = { loginCounter, photoProcessingTime };