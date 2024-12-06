import { createLogger, format, transports, Logger } from 'winston';

const logger: Logger = createLogger({
  level: 'info',
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf(({ timestamp, level, message, ...meta }) => {

      const formattedMeta = meta[Symbol.for('splat')]
        ? (meta[Symbol.for('splat')] as unknown[])
            .map((arg) =>
              typeof arg === 'object'
                ? JSON.stringify(arg, null, 2)
                : String(arg)
            )
            .join(' ')
        : '';

      return `${timestamp} [${level}]: ${message} ${formattedMeta}`;
    })
  ),
  transports: [new transports.Console()],
});


const logWrapper = (
  level: 'info' | 'error' | 'warn' | 'debug',
  ...args: unknown[]
): void => {
  if (args.length === 0) {
    throw new Error('Logger requires at least one argument.');
  }

  const [message, ...rest] = args;

  if (typeof message !== 'string') {
    throw new Error('The first argument to the logger must be a string.');
  }

  logger.log(level, message, ...rest);
};

export default {
  info: (...args: unknown[]) => logWrapper('info', ...args),
  error: (...args: unknown[]) => logWrapper('error', ...args),
  warn: (...args: unknown[]) => logWrapper('warn', ...args),
  debug: (...args: unknown[]) => logWrapper('debug', ...args),
};
