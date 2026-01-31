type LogLevel = "trace" | "debug" | "info" | "log" | "warn" | "error";

const LEVEL_VALUES: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  log: 3,
  warn: 4,
  error: 5
};

type LoggerFunction = {
  (message: string, ...args: unknown[]): void;
  (object: unknown): void;
};

interface Logger {
  trace: LoggerFunction;
  debug: LoggerFunction;
  info: LoggerFunction;
  log: LoggerFunction;
  warn: LoggerFunction;
  error: LoggerFunction;
}

/**
 * Supports: %s (string), %d/%i (integer), %f (float), %o/%O (object pretty), %j (JSON compact)
 */
function format(message: string, args: unknown[]): string {
  if (args.length === 0) {
    return message;
  } else {
    let i = 0;
    return message.replace(/%([sdiffoOj])/g, (match, specifier) => {
      if (i >= args.length) {
        return match;
      } else {
        const arg = args[i++];
        switch (specifier) {
          case "s":
            return String(arg);
          case "d":
          case "i":
            return Number.isInteger(arg) ? String(arg) : String(Math.floor(Number(arg)));
          case "f":
            return String(Number(arg));
          case "o":
          case "O":
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          case "j":
            try {
              return JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          default:
            return match;
        }
      }
    });
  }
}

function stringify(value: unknown): string {
  if (typeof value === "string") {
    return value;
  } else if (value instanceof Error) {
    return value.stack || value.message;
  } else {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}

const createLogFunction = (logLevel: LogLevel, minLevel: number): LoggerFunction => {
  if (LEVEL_VALUES[logLevel] >= minLevel) {
    return (messageOrObj: unknown, ...args: unknown[]) => {
      const formatted = typeof messageOrObj === "string"
        ? format(messageOrObj, args)
        : stringify(messageOrObj);
      switch (logLevel) {
        case "error":
          console.error(formatted);
          break;
        case "warn":
          console.warn(formatted);
          break;
        default:
          console.log(formatted);
          break;
      }
    };
  } else {
    console.info("Log level not supported", logLevel);
    return () => {};
  }
};

function createLogger(minLevel: LogLevel): Logger {
  const minLevelValue = LEVEL_VALUES[minLevel];
  return {
    trace: createLogFunction("trace", minLevelValue),
    debug: createLogFunction("debug", minLevelValue),
    info: createLogFunction("info", minLevelValue),
    log: createLogFunction("log", minLevelValue),
    warn: createLogFunction("warn", minLevelValue),
    error: createLogFunction("error", minLevelValue)
  };
}

export const logger = createLogger("info");
