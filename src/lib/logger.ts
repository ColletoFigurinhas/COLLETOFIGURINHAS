import pino from 'pino'

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target:  'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
    },
  }),
})

export const log = {
  info:  (msg: string, data?: object) => logger.info(data ?? {}, msg),
  warn:  (msg: string, data?: object) => logger.warn(data ?? {}, msg),
  error: (msg: string, data?: object) => logger.error(data ?? {}, msg),
  debug: (msg: string, data?: object) => logger.debug(data ?? {}, msg),
}
