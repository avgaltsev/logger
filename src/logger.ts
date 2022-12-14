const LOG_LEVEL = parseInt(process.env["LOG_LEVEL"] ?? "0", 10);

enum LogLevels {
	"ERROR" = 0,
	"WARNING" = 1,
	"INFO" = 2,
	"DEBUG" = 3,
}

interface InstanceCount {
	[className: string]: number;
}

type Method = (...args: Array<unknown>) => void;

function isMethod(value: unknown): value is Method {
	if (typeof value === "function") {
		return true;
	}

	return false;
}

type MethodDecorator = (target: unknown, name: string, descriptor: PropertyDescriptor) => PropertyDescriptor | void;

export function log(level: number, ...messages: Array<unknown>): void {
	if (level <= LOG_LEVEL) {
		const primitiveMessages = messages.map((message) => {
			if (
				message === null ||
				message === undefined ||
				typeof message === "number" ||
				typeof message === "boolean"
			) {
				return message;
			}

			if (typeof message === "string") {
				return message.replace(/\n/g, "\\n");
			}

			try {
				return JSON.stringify(message);
			} catch (error) {
				return message.toString().replace(/\n/g, "\\n");
			}
		});

		console.log(new Date(), ...primitiveMessages);
	}
}

export class Logger {
	private static instanceCount: InstanceCount = {};

	private className: string;
	private instance: number;

	public constructor() {
		this.className = Object.getPrototypeOf(this).constructor?.name ?? "Unknown";
		this.instance = (Logger.instanceCount[this.className] ?? 0) + 1;

		Logger.instanceCount[this.className] = this.instance;
	}

	public log(level: number, ...messages: Array<unknown>): void {
		log(level, LogLevels[level] ?? "DEBUG", `${this.className}[${this.instance}]:`, ...messages);
	}

	public logError(...messages: Array<unknown>): void {
		this.log(LogLevels.ERROR, ...messages);
	}

	public logWarning(...messages: Array<unknown>): void {
		this.log(LogLevels.WARNING, ...messages);
	}

	public logInfo(...messages: Array<unknown>): void {
		this.log(LogLevels.INFO, ...messages);
	}

	public logDebug(...messages: Array<unknown>): void {
		this.log(LogLevels.DEBUG, ...messages);
	}
}

export function logMethodCallSignature(level = LogLevels.DEBUG): MethodDecorator {
	return function (target: unknown, name: string, descriptor: PropertyDescriptor): void {
		const originalMethod = descriptor.value;

		if (!isMethod(originalMethod)) {
			return;
		}

		if (!(target instanceof Logger)) {
			return;
		}

		descriptor.value = function (...args: Array<unknown>) {
			Logger.prototype.log.call(this, level, `Method ${name} called with ${args.length} arguments:`, ...args);

			return originalMethod.call(this, ...args);
		};
	};
}
