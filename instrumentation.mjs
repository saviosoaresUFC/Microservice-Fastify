import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import {
    PeriodicExportingMetricReader,
    ConsoleMetricExporter,
} from '@opentelemetry/sdk-metrics';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const sdk = new NodeSDK({
    traceExporter: new ConsoleSpanExporter(),
    metricReaders: [new PeriodicExportingMetricReader({
        exporter: new ConsoleMetricExporter(),
    })],
    instrumentations: [
        getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
    ],
});

try {
    sdk.start();
    console.log('OpenTelemetry SDK iniciado com sucesso (ESM)');
} catch (error) {
    console.error('Erro ao iniciar o SDK:', error);
}

// Encerramento
process.on('SIGTERM', () => {
    sdk.shutdown()
        .then(() => console.log('Tracing terminated'))
        .finally(() => process.exit(0));
});