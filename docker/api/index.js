// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const base64abc = [
	"A",
	"B",
	"C",
	"D",
	"E",
	"F",
	"G",
	"H",
	"I",
	"J",
	"K",
	"L",
	"M",
	"N",
	"O",
	"P",
	"Q",
	"R",
	"S",
	"T",
	"U",
	"V",
	"W",
	"X",
	"Y",
	"Z",
	"a",
	"b",
	"c",
	"d",
	"e",
	"f",
	"g",
	"h",
	"i",
	"j",
	"k",
	"l",
	"m",
	"n",
	"o",
	"p",
	"q",
	"r",
	"s",
	"t",
	"u",
	"v",
	"w",
	"x",
	"y",
	"z",
	"0",
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"+",
	"/",
];
function encode(data) {
	const uint8 =
		typeof data === "string"
			? new TextEncoder().encode(data)
			: data instanceof Uint8Array
			? data
			: new Uint8Array(data);
	let result = "",
		i;
	const l = uint8.length;
	for (i = 2; i < l; i += 3) {
		result += base64abc[uint8[i - 2] >> 2];
		result += base64abc[((uint8[i - 2] & 0x03) << 4) | (uint8[i - 1] >> 4)];
		result += base64abc[((uint8[i - 1] & 0x0f) << 2) | (uint8[i] >> 6)];
		result += base64abc[uint8[i] & 0x3f];
	}
	if (i === l + 1) {
		result += base64abc[uint8[i - 2] >> 2];
		result += base64abc[(uint8[i - 2] & 0x03) << 4];
		result += "==";
	}
	if (i === l) {
		result += base64abc[uint8[i - 2] >> 2];
		result += base64abc[((uint8[i - 2] & 0x03) << 4) | (uint8[i - 1] >> 4)];
		result += base64abc[(uint8[i - 1] & 0x0f) << 2];
		result += "=";
	}
	return result;
}
function decode(b64) {
	const binString = atob(b64);
	const size = binString.length;
	const bytes = new Uint8Array(size);
	for (let i = 0; i < size; i++) {
		bytes[i] = binString.charCodeAt(i);
	}
	return bytes;
}
const mod = {
	encode: encode,
	decode: decode,
};
const hexTable = new TextEncoder().encode("0123456789abcdef");
function errInvalidByte(__byte) {
	return new TypeError(`Invalid byte '${String.fromCharCode(__byte)}'`);
}
function errLength() {
	return new RangeError("Odd length hex string");
}
function fromHexChar(__byte) {
	if (48 <= __byte && __byte <= 57) return __byte - 48;
	if (97 <= __byte && __byte <= 102) return __byte - 97 + 10;
	if (65 <= __byte && __byte <= 70) return __byte - 65 + 10;
	throw errInvalidByte(__byte);
}
function encode1(src) {
	const dst = new Uint8Array(src.length * 2);
	for (let i = 0; i < dst.length; i++) {
		const v = src[i];
		dst[i * 2] = hexTable[v >> 4];
		dst[i * 2 + 1] = hexTable[v & 0x0f];
	}
	return dst;
}
function decode1(src) {
	const dst = new Uint8Array(src.length / 2);
	for (let i = 0; i < dst.length; i++) {
		const a = fromHexChar(src[i * 2]);
		const b = fromHexChar(src[i * 2 + 1]);
		dst[i] = (a << 4) | b;
	}
	if (src.length % 2 == 1) {
		fromHexChar(src[dst.length * 2]);
		throw errLength();
	}
	return dst;
}
const mod1 = {
	encode: encode1,
	decode: decode1,
};
class Tokenizer {
	rules;
	constructor(rules = []) {
		this.rules = rules;
	}
	addRule(test, fn) {
		this.rules.push({
			test,
			fn,
		});
		return this;
	}
	tokenize(string, receiver = (token) => token) {
		function* generator(rules) {
			let index = 0;
			for (const rule of rules) {
				const result = rule.test(string);
				if (result) {
					const { value, length } = result;
					index += length;
					string = string.slice(length);
					const token = {
						...rule.fn(value),
						index,
					};
					yield receiver(token);
					yield* generator(rules);
				}
			}
		}
		const tokenGenerator = generator(this.rules);
		const tokens = [];
		for (const token of tokenGenerator) {
			tokens.push(token);
		}
		if (string.length) {
			throw new Error(
				`parser error: string not fully parsed! ${string.slice(0, 25)}`,
			);
		}
		return tokens;
	}
}
function digits(value, count = 2) {
	return String(value).padStart(count, "0");
}
function createLiteralTestFunction(value) {
	return (string) => {
		return string.startsWith(value)
			? {
					value,
					length: value.length,
			  }
			: undefined;
	};
}
function createMatchTestFunction(match) {
	return (string) => {
		const result = match.exec(string);
		if (result)
			return {
				value: result,
				length: result[0].length,
			};
	};
}
const defaultRules = [
	{
		test: createLiteralTestFunction("yyyy"),
		fn: () => ({
			type: "year",
			value: "numeric",
		}),
	},
	{
		test: createLiteralTestFunction("yy"),
		fn: () => ({
			type: "year",
			value: "2-digit",
		}),
	},
	{
		test: createLiteralTestFunction("MM"),
		fn: () => ({
			type: "month",
			value: "2-digit",
		}),
	},
	{
		test: createLiteralTestFunction("M"),
		fn: () => ({
			type: "month",
			value: "numeric",
		}),
	},
	{
		test: createLiteralTestFunction("dd"),
		fn: () => ({
			type: "day",
			value: "2-digit",
		}),
	},
	{
		test: createLiteralTestFunction("d"),
		fn: () => ({
			type: "day",
			value: "numeric",
		}),
	},
	{
		test: createLiteralTestFunction("HH"),
		fn: () => ({
			type: "hour",
			value: "2-digit",
		}),
	},
	{
		test: createLiteralTestFunction("H"),
		fn: () => ({
			type: "hour",
			value: "numeric",
		}),
	},
	{
		test: createLiteralTestFunction("hh"),
		fn: () => ({
			type: "hour",
			value: "2-digit",
			hour12: true,
		}),
	},
	{
		test: createLiteralTestFunction("h"),
		fn: () => ({
			type: "hour",
			value: "numeric",
			hour12: true,
		}),
	},
	{
		test: createLiteralTestFunction("mm"),
		fn: () => ({
			type: "minute",
			value: "2-digit",
		}),
	},
	{
		test: createLiteralTestFunction("m"),
		fn: () => ({
			type: "minute",
			value: "numeric",
		}),
	},
	{
		test: createLiteralTestFunction("ss"),
		fn: () => ({
			type: "second",
			value: "2-digit",
		}),
	},
	{
		test: createLiteralTestFunction("s"),
		fn: () => ({
			type: "second",
			value: "numeric",
		}),
	},
	{
		test: createLiteralTestFunction("SSS"),
		fn: () => ({
			type: "fractionalSecond",
			value: 3,
		}),
	},
	{
		test: createLiteralTestFunction("SS"),
		fn: () => ({
			type: "fractionalSecond",
			value: 2,
		}),
	},
	{
		test: createLiteralTestFunction("S"),
		fn: () => ({
			type: "fractionalSecond",
			value: 1,
		}),
	},
	{
		test: createLiteralTestFunction("a"),
		fn: (value) => ({
			type: "dayPeriod",
			value: value,
		}),
	},
	{
		test: createMatchTestFunction(/^(')(?<value>\\.|[^\']*)\1/),
		fn: (match) => ({
			type: "literal",
			value: match.groups.value,
		}),
	},
	{
		test: createMatchTestFunction(/^.+?\s*/),
		fn: (match) => ({
			type: "literal",
			value: match[0],
		}),
	},
];
class DateTimeFormatter {
	#format;
	constructor(formatString, rules = defaultRules) {
		const tokenizer = new Tokenizer(rules);
		this.#format = tokenizer.tokenize(formatString, ({
			type,
			value,
			hour12,
		}) => {
			const result = {
				type,
				value,
			};
			if (hour12) result.hour12 = hour12;
			return result;
		});
	}
	format(date, options = {}) {
		let string = "";
		const utc = options.timeZone === "UTC";
		for (const token of this.#format) {
			const type = token.type;
			switch (type) {
				case "year": {
					const value = utc ? date.getUTCFullYear() : date.getFullYear();
					switch (token.value) {
						case "numeric": {
							string += value;
							break;
						}
						case "2-digit": {
							string += digits(value, 2).slice(-2);
							break;
						}
						default:
							throw Error(
								`FormatterError: value "${token.value}" is not supported`,
							);
					}
					break;
				}
				case "month": {
					const value1 = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
					switch (token.value) {
						case "numeric": {
							string += value1;
							break;
						}
						case "2-digit": {
							string += digits(value1, 2);
							break;
						}
						default:
							throw Error(
								`FormatterError: value "${token.value}" is not supported`,
							);
					}
					break;
				}
				case "day": {
					const value2 = utc ? date.getUTCDate() : date.getDate();
					switch (token.value) {
						case "numeric": {
							string += value2;
							break;
						}
						case "2-digit": {
							string += digits(value2, 2);
							break;
						}
						default:
							throw Error(
								`FormatterError: value "${token.value}" is not supported`,
							);
					}
					break;
				}
				case "hour": {
					let value3 = utc ? date.getUTCHours() : date.getHours();
					value3 -= token.hour12 && date.getHours() > 12 ? 12 : 0;
					switch (token.value) {
						case "numeric": {
							string += value3;
							break;
						}
						case "2-digit": {
							string += digits(value3, 2);
							break;
						}
						default:
							throw Error(
								`FormatterError: value "${token.value}" is not supported`,
							);
					}
					break;
				}
				case "minute": {
					const value4 = utc ? date.getUTCMinutes() : date.getMinutes();
					switch (token.value) {
						case "numeric": {
							string += value4;
							break;
						}
						case "2-digit": {
							string += digits(value4, 2);
							break;
						}
						default:
							throw Error(
								`FormatterError: value "${token.value}" is not supported`,
							);
					}
					break;
				}
				case "second": {
					const value5 = utc ? date.getUTCSeconds() : date.getSeconds();
					switch (token.value) {
						case "numeric": {
							string += value5;
							break;
						}
						case "2-digit": {
							string += digits(value5, 2);
							break;
						}
						default:
							throw Error(
								`FormatterError: value "${token.value}" is not supported`,
							);
					}
					break;
				}
				case "fractionalSecond": {
					const value6 = utc
						? date.getUTCMilliseconds()
						: date.getMilliseconds();
					string += digits(value6, Number(token.value));
					break;
				}
				case "timeZoneName": {
					break;
				}
				case "dayPeriod": {
					string += token.value ? (date.getHours() >= 12 ? "PM" : "AM") : "";
					break;
				}
				case "literal": {
					string += token.value;
					break;
				}
				default:
					throw Error(`FormatterError: { ${token.type} ${token.value} }`);
			}
		}
		return string;
	}
	parseToParts(string) {
		const parts = [];
		for (const token of this.#format) {
			const type = token.type;
			let value = "";
			switch (token.type) {
				case "year": {
					switch (token.value) {
						case "numeric": {
							value = /^\d{1,4}/.exec(string)?.[0];
							break;
						}
						case "2-digit": {
							value = /^\d{1,2}/.exec(string)?.[0];
							break;
						}
					}
					break;
				}
				case "month": {
					switch (token.value) {
						case "numeric": {
							value = /^\d{1,2}/.exec(string)?.[0];
							break;
						}
						case "2-digit": {
							value = /^\d{2}/.exec(string)?.[0];
							break;
						}
						case "narrow": {
							value = /^[a-zA-Z]+/.exec(string)?.[0];
							break;
						}
						case "short": {
							value = /^[a-zA-Z]+/.exec(string)?.[0];
							break;
						}
						case "long": {
							value = /^[a-zA-Z]+/.exec(string)?.[0];
							break;
						}
						default:
							throw Error(
								`ParserError: value "${token.value}" is not supported`,
							);
					}
					break;
				}
				case "day": {
					switch (token.value) {
						case "numeric": {
							value = /^\d{1,2}/.exec(string)?.[0];
							break;
						}
						case "2-digit": {
							value = /^\d{2}/.exec(string)?.[0];
							break;
						}
						default:
							throw Error(
								`ParserError: value "${token.value}" is not supported`,
							);
					}
					break;
				}
				case "hour": {
					switch (token.value) {
						case "numeric": {
							value = /^\d{1,2}/.exec(string)?.[0];
							if (token.hour12 && parseInt(value) > 12) {
								console.error(
									`Trying to parse hour greater than 12. Use 'H' instead of 'h'.`,
								);
							}
							break;
						}
						case "2-digit": {
							value = /^\d{2}/.exec(string)?.[0];
							if (token.hour12 && parseInt(value) > 12) {
								console.error(
									`Trying to parse hour greater than 12. Use 'HH' instead of 'hh'.`,
								);
							}
							break;
						}
						default:
							throw Error(
								`ParserError: value "${token.value}" is not supported`,
							);
					}
					break;
				}
				case "minute": {
					switch (token.value) {
						case "numeric": {
							value = /^\d{1,2}/.exec(string)?.[0];
							break;
						}
						case "2-digit": {
							value = /^\d{2}/.exec(string)?.[0];
							break;
						}
						default:
							throw Error(
								`ParserError: value "${token.value}" is not supported`,
							);
					}
					break;
				}
				case "second": {
					switch (token.value) {
						case "numeric": {
							value = /^\d{1,2}/.exec(string)?.[0];
							break;
						}
						case "2-digit": {
							value = /^\d{2}/.exec(string)?.[0];
							break;
						}
						default:
							throw Error(
								`ParserError: value "${token.value}" is not supported`,
							);
					}
					break;
				}
				case "fractionalSecond": {
					value = new RegExp(`^\\d{${token.value}}`).exec(string)?.[0];
					break;
				}
				case "timeZoneName": {
					value = token.value;
					break;
				}
				case "dayPeriod": {
					value = /^(A|P)M/.exec(string)?.[0];
					break;
				}
				case "literal": {
					if (!string.startsWith(token.value)) {
						throw Error(
							`Literal "${token.value}" not found "${string.slice(0, 25)}"`,
						);
					}
					value = token.value;
					break;
				}
				default:
					throw Error(`${token.type} ${token.value}`);
			}
			if (!value) {
				throw Error(
					`value not valid for token { ${type} ${value} } ${string.slice(
						0,
						25,
					)}`,
				);
			}
			parts.push({
				type,
				value,
			});
			string = string.slice(value.length);
		}
		if (string.length) {
			throw Error(
				`datetime string was not fully parsed! ${string.slice(0, 25)}`,
			);
		}
		return parts;
	}
	sortDateTimeFormatPart(parts) {
		let result = [];
		const typeArray = [
			"year",
			"month",
			"day",
			"hour",
			"minute",
			"second",
			"fractionalSecond",
		];
		for (const type of typeArray) {
			const current = parts.findIndex((el) => el.type === type);
			if (current !== -1) {
				result = result.concat(parts.splice(current, 1));
			}
		}
		result = result.concat(parts);
		return result;
	}
	partsToDate(parts) {
		const date = new Date();
		const utc = parts.find(
			(part) => part.type === "timeZoneName" && part.value === "UTC",
		);
		const dayPart = parts.find((part) => part.type === "day");
		utc ? date.setUTCHours(0, 0, 0, 0) : date.setHours(0, 0, 0, 0);
		for (const part of parts) {
			switch (part.type) {
				case "year": {
					const value = Number(part.value.padStart(4, "20"));
					utc ? date.setUTCFullYear(value) : date.setFullYear(value);
					break;
				}
				case "month": {
					const value1 = Number(part.value) - 1;
					if (dayPart) {
						utc
							? date.setUTCMonth(value1, Number(dayPart.value))
							: date.setMonth(value1, Number(dayPart.value));
					} else {
						utc ? date.setUTCMonth(value1) : date.setMonth(value1);
					}
					break;
				}
				case "day": {
					const value2 = Number(part.value);
					utc ? date.setUTCDate(value2) : date.setDate(value2);
					break;
				}
				case "hour": {
					let value3 = Number(part.value);
					const dayPeriod = parts.find((part) => part.type === "dayPeriod");
					if (dayPeriod?.value === "PM") value3 += 12;
					utc ? date.setUTCHours(value3) : date.setHours(value3);
					break;
				}
				case "minute": {
					const value4 = Number(part.value);
					utc ? date.setUTCMinutes(value4) : date.setMinutes(value4);
					break;
				}
				case "second": {
					const value5 = Number(part.value);
					utc ? date.setUTCSeconds(value5) : date.setSeconds(value5);
					break;
				}
				case "fractionalSecond": {
					const value6 = Number(part.value);
					utc ? date.setUTCMilliseconds(value6) : date.setMilliseconds(value6);
					break;
				}
			}
		}
		return date;
	}
	parse(string) {
		const parts = this.parseToParts(string);
		const sortParts = this.sortDateTimeFormatPart(parts);
		return this.partsToDate(sortParts);
	}
}
const SECOND = 1e3;
const MINUTE = 1e3 * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
var Day;
(function (Day) {
	Day[(Day["Sun"] = 0)] = "Sun";
	Day[(Day["Mon"] = 1)] = "Mon";
	Day[(Day["Tue"] = 2)] = "Tue";
	Day[(Day["Wed"] = 3)] = "Wed";
	Day[(Day["Thu"] = 4)] = "Thu";
	Day[(Day["Fri"] = 5)] = "Fri";
	Day[(Day["Sat"] = 6)] = "Sat";
})(Day || (Day = {}));
function parse(dateString, formatString) {
	const formatter = new DateTimeFormatter(formatString);
	const parts = formatter.parseToParts(dateString);
	const sortParts = formatter.sortDateTimeFormatPart(parts);
	return formatter.partsToDate(sortParts);
}
function format(date, formatString) {
	const formatter = new DateTimeFormatter(formatString);
	return formatter.format(date);
}
function dayOfYear(date) {
	const yearStart = new Date(date);
	yearStart.setUTCFullYear(date.getUTCFullYear(), 0, 0);
	const diff = date.getTime() - yearStart.getTime();
	return Math.floor(diff / DAY);
}
function weekOfYear(date) {
	const workingDate = new Date(
		Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
	);
	const day = workingDate.getUTCDay();
	const nearestThursday =
		workingDate.getUTCDate() + Day.Thu - (day === Day.Sun ? 7 : day);
	workingDate.setUTCDate(nearestThursday);
	const yearStart = new Date(Date.UTC(workingDate.getUTCFullYear(), 0, 1));
	return Math.ceil((workingDate.getTime() - yearStart.getTime() + DAY) / WEEK);
}
function toIMF(date) {
	function dtPad(v, lPad = 2) {
		return v.padStart(lPad, "0");
	}
	const d = dtPad(date.getUTCDate().toString());
	const h = dtPad(date.getUTCHours().toString());
	const min = dtPad(date.getUTCMinutes().toString());
	const s = dtPad(date.getUTCSeconds().toString());
	const y = date.getUTCFullYear();
	const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];
	return `${days[date.getUTCDay()]}, ${d} ${
		months[date.getUTCMonth()]
	} ${y} ${h}:${min}:${s} GMT`;
}
function isLeap(year) {
	const yearNumber = year instanceof Date ? year.getFullYear() : year;
	return (
		(yearNumber % 4 === 0 && yearNumber % 100 !== 0) || yearNumber % 400 === 0
	);
}
function difference(from, to, options) {
	const uniqueUnits = options?.units
		? [...new Set(options?.units)]
		: [
				"milliseconds",
				"seconds",
				"minutes",
				"hours",
				"days",
				"weeks",
				"months",
				"quarters",
				"years",
		  ];
	const bigger = Math.max(from.getTime(), to.getTime());
	const smaller = Math.min(from.getTime(), to.getTime());
	const differenceInMs = bigger - smaller;
	const differences = {};
	for (const uniqueUnit of uniqueUnits) {
		switch (uniqueUnit) {
			case "milliseconds":
				differences.milliseconds = differenceInMs;
				break;
			case "seconds":
				differences.seconds = Math.floor(differenceInMs / SECOND);
				break;
			case "minutes":
				differences.minutes = Math.floor(differenceInMs / MINUTE);
				break;
			case "hours":
				differences.hours = Math.floor(differenceInMs / HOUR);
				break;
			case "days":
				differences.days = Math.floor(differenceInMs / DAY);
				break;
			case "weeks":
				differences.weeks = Math.floor(differenceInMs / WEEK);
				break;
			case "months":
				differences.months = calculateMonthsDifference(bigger, smaller);
				break;
			case "quarters":
				differences.quarters = Math.floor(
					(typeof differences.months !== "undefined" &&
						differences.months / 4) ||
						calculateMonthsDifference(bigger, smaller) / 4,
				);
				break;
			case "years":
				differences.years = Math.floor(
					(typeof differences.months !== "undefined" &&
						differences.months / 12) ||
						calculateMonthsDifference(bigger, smaller) / 12,
				);
				break;
		}
	}
	return differences;
}
function calculateMonthsDifference(bigger, smaller) {
	const biggerDate = new Date(bigger);
	const smallerDate = new Date(smaller);
	const yearsDiff = biggerDate.getFullYear() - smallerDate.getFullYear();
	const monthsDiff = biggerDate.getMonth() - smallerDate.getMonth();
	const calendarDifferences = Math.abs(yearsDiff * 12 + monthsDiff);
	const compareResult = biggerDate > smallerDate ? 1 : -1;
	biggerDate.setMonth(
		biggerDate.getMonth() - compareResult * calendarDifferences,
	);
	const isLastMonthNotFull =
		biggerDate > smallerDate ? 1 : -1 === -compareResult ? 1 : 0;
	const months = compareResult * (calendarDifferences - isLastMonthNotFull);
	return months === 0 ? 0 : months;
}
const mod2 = (function () {
	return {
		SECOND: 1e3,
		MINUTE: MINUTE,
		HOUR: HOUR,
		DAY: DAY,
		WEEK: WEEK,
		parse: parse,
		format: format,
		dayOfYear: dayOfYear,
		weekOfYear: weekOfYear,
		toIMF: toIMF,
		isLeap: isLeap,
		difference: difference,
	};
})();
class DenoStdInternalError extends Error {
	constructor(message) {
		super(message);
		this.name = "DenoStdInternalError";
	}
}
function assert(expr, msg = "") {
	if (!expr) {
		throw new DenoStdInternalError(msg);
	}
}
function copy(src, dst, off = 0) {
	off = Math.max(0, Math.min(off, dst.byteLength));
	const dstBytesAvailable = dst.byteLength - off;
	if (src.byteLength > dstBytesAvailable) {
		src = src.subarray(0, dstBytesAvailable);
	}
	dst.set(src, off);
	return src.byteLength;
}
const MIN_BUF_SIZE = 16;
const CR = "\r".charCodeAt(0);
const LF = "\n".charCodeAt(0);
class BufferFullError extends Error {
	name;
	constructor(partial) {
		super("Buffer full");
		this.partial = partial;
		this.name = "BufferFullError";
	}
	partial;
}
class PartialReadError extends Error {
	name = "PartialReadError";
	partial;
	constructor() {
		super("Encountered UnexpectedEof, data only partially read");
	}
}
class BufReader {
	#buf;
	#rd;
	#r = 0;
	#w = 0;
	#eof = false;
	static create(r, size = 4096) {
		return r instanceof BufReader ? r : new BufReader(r, size);
	}
	constructor(rd, size = 4096) {
		if (size < 16) {
			size = MIN_BUF_SIZE;
		}
		this.#reset(new Uint8Array(size), rd);
	}
	size() {
		return this.#buf.byteLength;
	}
	buffered() {
		return this.#w - this.#r;
	}
	#fill = async () => {
		if (this.#r > 0) {
			this.#buf.copyWithin(0, this.#r, this.#w);
			this.#w -= this.#r;
			this.#r = 0;
		}
		if (this.#w >= this.#buf.byteLength) {
			throw Error("bufio: tried to fill full buffer");
		}
		for (let i = 100; i > 0; i--) {
			const rr = await this.#rd.read(this.#buf.subarray(this.#w));
			if (rr === null) {
				this.#eof = true;
				return;
			}
			assert(rr >= 0, "negative read");
			this.#w += rr;
			if (rr > 0) {
				return;
			}
		}
		throw new Error(`No progress after ${100} read() calls`);
	};
	reset(r) {
		this.#reset(this.#buf, r);
	}
	#reset = (buf, rd) => {
		this.#buf = buf;
		this.#rd = rd;
		this.#eof = false;
	};
	async read(p) {
		let rr = p.byteLength;
		if (p.byteLength === 0) return rr;
		if (this.#r === this.#w) {
			if (p.byteLength >= this.#buf.byteLength) {
				const rr1 = await this.#rd.read(p);
				const nread = rr1 ?? 0;
				assert(nread >= 0, "negative read");
				return rr1;
			}
			this.#r = 0;
			this.#w = 0;
			rr = await this.#rd.read(this.#buf);
			if (rr === 0 || rr === null) return rr;
			assert(rr >= 0, "negative read");
			this.#w += rr;
		}
		const copied = copy(this.#buf.subarray(this.#r, this.#w), p, 0);
		this.#r += copied;
		return copied;
	}
	async readFull(p) {
		let bytesRead = 0;
		while (bytesRead < p.length) {
			try {
				const rr = await this.read(p.subarray(bytesRead));
				if (rr === null) {
					if (bytesRead === 0) {
						return null;
					} else {
						throw new PartialReadError();
					}
				}
				bytesRead += rr;
			} catch (err) {
				if (err instanceof PartialReadError) {
					err.partial = p.subarray(0, bytesRead);
				} else if (err instanceof Error) {
					const e = new PartialReadError();
					e.partial = p.subarray(0, bytesRead);
					e.stack = err.stack;
					e.message = err.message;
					e.cause = err.cause;
					throw err;
				}
				throw err;
			}
		}
		return p;
	}
	async readByte() {
		while (this.#r === this.#w) {
			if (this.#eof) return null;
			await this.#fill();
		}
		const c = this.#buf[this.#r];
		this.#r++;
		return c;
	}
	async readString(delim) {
		if (delim.length !== 1) {
			throw new Error("Delimiter should be a single character");
		}
		const buffer = await this.readSlice(delim.charCodeAt(0));
		if (buffer === null) return null;
		return new TextDecoder().decode(buffer);
	}
	async readLine() {
		let line = null;
		try {
			line = await this.readSlice(LF);
		} catch (err) {
			if (err instanceof Deno.errors.BadResource) {
				throw err;
			}
			let partial;
			if (err instanceof PartialReadError) {
				partial = err.partial;
				assert(
					partial instanceof Uint8Array,
					"bufio: caught error from `readSlice()` without `partial` property",
				);
			}
			if (!(err instanceof BufferFullError)) {
				throw err;
			}
			partial = err.partial;
			if (
				!this.#eof &&
				partial &&
				partial.byteLength > 0 &&
				partial[partial.byteLength - 1] === CR
			) {
				assert(this.#r > 0, "bufio: tried to rewind past start of buffer");
				this.#r--;
				partial = partial.subarray(0, partial.byteLength - 1);
			}
			if (partial) {
				return {
					line: partial,
					more: !this.#eof,
				};
			}
		}
		if (line === null) {
			return null;
		}
		if (line.byteLength === 0) {
			return {
				line,
				more: false,
			};
		}
		if (line[line.byteLength - 1] == LF) {
			let drop = 1;
			if (line.byteLength > 1 && line[line.byteLength - 2] === CR) {
				drop = 2;
			}
			line = line.subarray(0, line.byteLength - drop);
		}
		return {
			line,
			more: false,
		};
	}
	async readSlice(delim) {
		let s = 0;
		let slice;
		while (true) {
			let i = this.#buf.subarray(this.#r + s, this.#w).indexOf(delim);
			if (i >= 0) {
				i += s;
				slice = this.#buf.subarray(this.#r, this.#r + i + 1);
				this.#r += i + 1;
				break;
			}
			if (this.#eof) {
				if (this.#r === this.#w) {
					return null;
				}
				slice = this.#buf.subarray(this.#r, this.#w);
				this.#r = this.#w;
				break;
			}
			if (this.buffered() >= this.#buf.byteLength) {
				this.#r = this.#w;
				const oldbuf = this.#buf;
				const newbuf = this.#buf.slice(0);
				this.#buf = newbuf;
				throw new BufferFullError(oldbuf);
			}
			s = this.#w - this.#r;
			try {
				await this.#fill();
			} catch (err) {
				if (err instanceof PartialReadError) {
					err.partial = slice;
				} else if (err instanceof Error) {
					const e = new PartialReadError();
					e.partial = slice;
					e.stack = err.stack;
					e.message = err.message;
					e.cause = err.cause;
					throw err;
				}
				throw err;
			}
		}
		return slice;
	}
	async peek(n) {
		if (n < 0) {
			throw Error("negative count");
		}
		let avail = this.#w - this.#r;
		while (avail < n && avail < this.#buf.byteLength && !this.#eof) {
			try {
				await this.#fill();
			} catch (err) {
				if (err instanceof PartialReadError) {
					err.partial = this.#buf.subarray(this.#r, this.#w);
				} else if (err instanceof Error) {
					const e = new PartialReadError();
					e.partial = this.#buf.subarray(this.#r, this.#w);
					e.stack = err.stack;
					e.message = err.message;
					e.cause = err.cause;
					throw err;
				}
				throw err;
			}
			avail = this.#w - this.#r;
		}
		if (avail === 0 && this.#eof) {
			return null;
		} else if (avail < n && this.#eof) {
			return this.#buf.subarray(this.#r, this.#r + avail);
		} else if (avail < n) {
			throw new BufferFullError(this.#buf.subarray(this.#r, this.#w));
		}
		return this.#buf.subarray(this.#r, this.#r + n);
	}
}
class AbstractBufBase {
	buf;
	usedBufferBytes = 0;
	err = null;
	constructor(buf) {
		this.buf = buf;
	}
	size() {
		return this.buf.byteLength;
	}
	available() {
		return this.buf.byteLength - this.usedBufferBytes;
	}
	buffered() {
		return this.usedBufferBytes;
	}
}
class BufWriter extends AbstractBufBase {
	#writer;
	static create(writer, size = 4096) {
		return writer instanceof BufWriter ? writer : new BufWriter(writer, size);
	}
	constructor(writer, size = 4096) {
		super(new Uint8Array(size <= 0 ? 4096 : size));
		this.#writer = writer;
	}
	reset(w) {
		this.err = null;
		this.usedBufferBytes = 0;
		this.#writer = w;
	}
	async flush() {
		if (this.err !== null) throw this.err;
		if (this.usedBufferBytes === 0) return;
		try {
			const p = this.buf.subarray(0, this.usedBufferBytes);
			let nwritten = 0;
			while (nwritten < p.length) {
				nwritten += await this.#writer.write(p.subarray(nwritten));
			}
		} catch (e) {
			if (e instanceof Error) {
				this.err = e;
			}
			throw e;
		}
		this.buf = new Uint8Array(this.buf.length);
		this.usedBufferBytes = 0;
	}
	async write(data) {
		if (this.err !== null) throw this.err;
		if (data.length === 0) return 0;
		let totalBytesWritten = 0;
		let numBytesWritten = 0;
		while (data.byteLength > this.available()) {
			if (this.buffered() === 0) {
				try {
					numBytesWritten = await this.#writer.write(data);
				} catch (e) {
					if (e instanceof Error) {
						this.err = e;
					}
					throw e;
				}
			} else {
				numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
				this.usedBufferBytes += numBytesWritten;
				await this.flush();
			}
			totalBytesWritten += numBytesWritten;
			data = data.subarray(numBytesWritten);
		}
		numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
		this.usedBufferBytes += numBytesWritten;
		totalBytesWritten += numBytesWritten;
		return totalBytesWritten;
	}
}
const data = decode(
	"\
AGFzbQEAAAABo4GAgAAYYAAAYAABf2ABfwBgAX8Bf2ABfwF+YAJ/fwBgAn9/AX9gA39/fwBgA39/fw\
F/YAR/f39/AGAEf39/fwF/YAV/f39/fwBgBX9/f39/AX9gBn9/f39/fwBgBn9/f39/fwF/YAV/f39+\
fwBgB39/f35/f38Bf2ADf39+AGAFf399f38AYAV/f3x/fwBgAn9+AGAEf31/fwBgBH98f38AYAJ+fw\
F/AtKFgIAADRhfX3diaW5kZ2VuX3BsYWNlaG9sZGVyX18aX193YmdfbmV3X2E0YjYxYTBmNTQ4MjRj\
ZmQABhhfX3diaW5kZ2VuX3BsYWNlaG9sZGVyX18aX193YmluZGdlbl9vYmplY3RfZHJvcF9yZWYAAh\
hfX3diaW5kZ2VuX3BsYWNlaG9sZGVyX18hX193YmdfYnl0ZUxlbmd0aF8zZTI1MGI0MWE4OTE1NzU3\
AAMYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fIV9fd2JnX2J5dGVPZmZzZXRfNDIwNGVjYjI0YTZlNW\
RmOQADGF9fd2JpbmRnZW5fcGxhY2Vob2xkZXJfXx1fX3diZ19idWZmZXJfZmFjZjAzOThhMjgxYzg1\
YgADGF9fd2JpbmRnZW5fcGxhY2Vob2xkZXJfXzFfX3diZ19uZXd3aXRoYnl0ZW9mZnNldGFuZGxlbm\
d0aF80YjliOGM0ZTNmNWFkYmZmAAgYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fHV9fd2JnX2xlbmd0\
aF8xZWI4ZmM2MDhhMGQ0Y2RiAAMYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fEV9fd2JpbmRnZW5fbW\
Vtb3J5AAEYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fHV9fd2JnX2J1ZmZlcl8zOTdlYWE0ZDcyZWU5\
NGRkAAMYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fGl9fd2JnX25ld19hN2NlNDQ3ZjE1ZmY0OTZmAA\
MYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fGl9fd2JnX3NldF85NjlhZDBhNjBlNTFkMzIwAAcYX193\
YmluZGdlbl9wbGFjZWhvbGRlcl9fEF9fd2JpbmRnZW5fdGhyb3cABRhfX3diaW5kZ2VuX3BsYWNlaG\
9sZGVyX18SX193YmluZGdlbl9yZXRocm93AAID7YCAgABsCQcJBwcRBQcHBQMHBw8DBwUQAgUFAgcF\
AggGBwcUDAgOBwcHBwYHBwgXDQUFCAkIDQkFCQYJBgYFBQUFBQUHBwcHBwAFAggKBwUDAgUODAsMCw\
sSEwkFCAgDBgYCBQAABgMGAAAFBQIEAAUCBIWAgIAAAXABFRUFg4CAgAABABEGiYCAgAABfwFBgIDA\
AAsHtoKAgAAOBm1lbW9yeQIABmRpZ2VzdAA3GF9fd2JnX2RpZ2VzdGNvbnRleHRfZnJlZQBSEWRpZ2\
VzdGNvbnRleHRfbmV3AEEUZGlnZXN0Y29udGV4dF91cGRhdGUAVhRkaWdlc3Rjb250ZXh0X2RpZ2Vz\
dAA+HGRpZ2VzdGNvbnRleHRfZGlnZXN0QW5kUmVzZXQAQBtkaWdlc3Rjb250ZXh0X2RpZ2VzdEFuZE\
Ryb3AAOxNkaWdlc3Rjb250ZXh0X3Jlc2V0ACITZGlnZXN0Y29udGV4dF9jbG9uZQAbH19fd2JpbmRn\
ZW5fYWRkX3RvX3N0YWNrX3BvaW50ZXIAbhFfX3diaW5kZ2VuX21hbGxvYwBXEl9fd2JpbmRnZW5fcm\
VhbGxvYwBkD19fd2JpbmRnZW5fZnJlZQBqCZqAgIAAAQBBAQsUZ2hvd21bPVxdWmViXl9gYXhDRHUK\
g8yIgABsoH4CEn8CfiMAQbAlayIEJAACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAk\
ACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgASgCAA4YAAECAwQcGxoZGBcWFRQTEhEQDw4N\
DAsKAAsgASgCBCEBQdABEBciBUUNBCAEQZASakE4aiABQThqKQMANwMAIARBkBJqQTBqIAFBMGopAw\
A3AwAgBEGQEmpBKGogAUEoaikDADcDACAEQZASakEgaiABQSBqKQMANwMAIARBkBJqQRhqIAFBGGop\
AwA3AwAgBEGQEmpBEGogAUEQaikDADcDACAEQZASakEIaiABQQhqKQMANwMAIAQgASkDADcDkBIgAS\
kDQCEWIARBkBJqQcgAaiABQcgAahBFIAQgFjcD0BIgBSAEQZASakHQARA6GkEAIQZBACEBDB8LIAEo\
AgQhAUHQARAXIgVFDQQgBEGQEmpBOGogAUE4aikDADcDACAEQZASakEwaiABQTBqKQMANwMAIARBkB\
JqQShqIAFBKGopAwA3AwAgBEGQEmpBIGogAUEgaikDADcDACAEQZASakEYaiABQRhqKQMANwMAIARB\
kBJqQRBqIAFBEGopAwA3AwAgBEGQEmpBCGogAUEIaikDADcDACAEIAEpAwA3A5ASIAEpA0AhFiAEQZ\
ASakHIAGogAUHIAGoQRSAEIBY3A9ASIAUgBEGQEmpB0AEQOhpBASEBDBsLIAEoAgQhAUHQARAXIgVF\
DQQgBEGQEmpBOGogAUE4aikDADcDACAEQZASakEwaiABQTBqKQMANwMAIARBkBJqQShqIAFBKGopAw\
A3AwAgBEGQEmpBIGogAUEgaikDADcDACAEQZASakEYaiABQRhqKQMANwMAIARBkBJqQRBqIAFBEGop\
AwA3AwAgBEGQEmpBCGogAUEIaikDADcDACAEIAEpAwA3A5ASIAEpA0AhFiAEQZASakHIAGogAUHIAG\
oQRSAEIBY3A9ASIAUgBEGQEmpB0AEQOhpBAiEBDBoLIAEoAgQhAUHwABAXIgVFDQQgBEGQEmpBIGog\
AUEgaikDADcDACAEQZASakEYaiABQRhqKQMANwMAIARBkBJqQRBqIAFBEGopAwA3AwAgBCABKQMINw\
OYEiABKQMAIRYgBEGQEmpBKGogAUEoahA5IAQgFjcDkBIgBSAEQZASakHwABA6GkEDIQEMGQsgASgC\
BCEBQfgOEBciBUUNBCAEQZASakGIAWogAUGIAWopAwA3AwAgBEGQEmpBgAFqIAFBgAFqKQMANwMAIA\
RBkBJqQfgAaiABQfgAaikDADcDACAEQZASakEQaiABQRBqKQMANwMAIARBkBJqQRhqIAFBGGopAwA3\
AwAgBEGQEmpBIGogAUEgaikDADcDACAEQZASakEwaiABQTBqKQMANwMAIARBkBJqQThqIAFBOGopAw\
A3AwAgBEGQEmpBwABqIAFBwABqKQMANwMAIARBkBJqQcgAaiABQcgAaikDADcDACAEQZASakHQAGog\
AUHQAGopAwA3AwAgBEGQEmpB2ABqIAFB2ABqKQMANwMAIARBkBJqQeAAaiABQeAAaikDADcDACAEIA\
EpA3A3A4ATIAQgASkDCDcDmBIgBCABKQMoNwO4EiABKQMAIRYgAS0AaiEHIAEtAGkhCCABLQBoIQkC\
QCABKAKQAUEFdCIKDQBBACEKDBsLIARBGGoiCyABQZQBaiIGQRhqKQAANwMAIARBEGoiDCAGQRBqKQ\
AANwMAIARBCGoiDSAGQQhqKQAANwMAIAQgBikAADcDACABQdQBaiEGQQAgCkFgakEFdmshDiAEQcQT\
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\
GkEGIQEMAgtB2AJBCEEAKAL41EAiBEEEIAQbEQUAAAsgASgCBCEBQeACEBciBUUNASAEQZASaiABQc\
gBEDoaIARBkBJqQcgBaiABQcgBahBKIAUgBEGQEmpB4AIQOhpBBSEBC0EAIQYMAgtB4AJBCEEAKAL4\
1EAiBEEEIAQbEQUAAAsgBCAKNgKgEyAEIAc6APoSIAQgCDoA+RIgBCAJOgD4EiAEIBY3A5ASIAUgBE\
GQEmpB+A4QOhpBBCEBQQEhBgsCQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJA\
AkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCACDgIBABELQSAhAi\
ABDhgBDwIPEAMPBAUGBgcHCA8JCgsPDA0QEA4BCyABQQJ0QZTUwABqKAIAIQMMDwtBwAAhAgwNC0Ew\
IQIMDAtBHCECDAsLQTAhAgwKC0HAACECDAkLQRAhAgwIC0EUIQIMBwtBHCECDAYLQTAhAgwFC0HAAC\
ECDAQLQRwhAgwDC0EwIQIMAgtBwAAhAgwBC0EYIQILIAIgA0YNACAAQa2BwAA2AgQgAEEBNgIAIABB\
CGpBOTYCAAJAIAZFDQAgBSgCkAFFDQAgBUEANgKQAQsgBRAfDAELAkACQAJAAkACQAJAAkACQAJAAk\
ACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAQ4YAAECAwQFBgcICQoLDA0ODxAR\
EhMUFRYaAAsgBCAFQdABEDoiAUH4DmpBDGpCADcCACABQfgOakEUakIANwIAIAFB+A5qQRxqQgA3Ag\
AgAUH4DmpBJGpCADcCACABQfgOakEsakIANwIAIAFB+A5qQTRqQgA3AgAgAUH4DmpBPGpCADcCACAB\
QgA3AvwOIAFBwAA2AvgOIAFBkBJqIAFB+A5qQcQAEDoaIAFBuCJqQThqIgogAUGQEmpBPGopAgA3Aw\
AgAUG4ImpBMGoiAyABQZASakE0aikCADcDACABQbgiakEoaiIPIAFBkBJqQSxqKQIANwMAIAFBuCJq\
QSBqIgsgAUGQEmpBJGopAgA3AwAgAUG4ImpBGGoiDCABQZASakEcaikCADcDACABQbgiakEQaiINIA\
FBkBJqQRRqKQIANwMAIAFBuCJqQQhqIhAgAUGQEmpBDGopAgA3AwAgASABKQKUEjcDuCIgAUGQEmog\
AUHQARA6GiABIAEpA9ASIAFB2BNqLQAAIgatfDcD0BIgAUHYEmohAgJAIAZBgAFGDQAgAiAGakEAQY\
ABIAZrEDwaCyABQQA6ANgTIAFBkBJqIAJCfxASIAFB+A5qQQhqIgYgAUGQEmpBCGopAwA3AwAgAUH4\
DmpBEGoiAiABQZASakEQaikDADcDACABQfgOakEYaiIOIAFBkBJqQRhqKQMANwMAIAFB+A5qQSBqIg\
cgASkDsBI3AwAgAUH4DmpBKGoiCCABQZASakEoaikDADcDACABQfgOakEwaiIJIAFBkBJqQTBqKQMA\
NwMAIAFB+A5qQThqIhEgAUGQEmpBOGopAwA3AwAgASABKQOQEjcD+A4gECAGKQMANwMAIA0gAikDAD\
cDACAMIA4pAwA3AwAgCyAHKQMANwMAIA8gCCkDADcDACADIAkpAwA3AwAgCiARKQMANwMAIAEgASkD\
+A43A7giQcAAEBciBkUNHCAGIAEpA7giNwAAIAZBOGogAUG4ImpBOGopAwA3AAAgBkEwaiABQbgiak\
EwaikDADcAACAGQShqIAFBuCJqQShqKQMANwAAIAZBIGogAUG4ImpBIGopAwA3AAAgBkEYaiABQbgi\
akEYaikDADcAACAGQRBqIAFBuCJqQRBqKQMANwAAIAZBCGogAUG4ImpBCGopAwA3AABBwAAhAwwaCy\
AEIAVB0AEQOiIBQfgOakEcakIANwIAIAFB+A5qQRRqQgA3AgAgAUH4DmpBDGpCADcCACABQgA3AvwO\
IAFBIDYC+A4gAUGQEmpBGGoiCyABQfgOakEYaiICKQMANwMAIAFBkBJqQRBqIgwgAUH4DmpBEGoiCi\
kDADcDACABQZASakEIaiINIAFB+A5qQQhqIgMpAwA3AwAgAUGQEmpBIGogAUH4DmpBIGoiECgCADYC\
ACABIAEpA/gONwOQEiABQbgiakEQaiIOIAFBkBJqQRRqKQIANwMAIAFBuCJqQQhqIgcgAUGQEmpBDG\
opAgA3AwAgAUG4ImpBGGoiCCABQZASakEcaikCADcDACABIAEpApQSNwO4IiABQZASaiABQdABEDoa\
IAEgASkD0BIgAUHYE2otAAAiBq18NwPQEiABQdgSaiEPAkAgBkGAAUYNACAPIAZqQQBBgAEgBmsQPB\
oLIAFBADoA2BMgAUGQEmogD0J/EBIgAyANKQMANwMAIAogDCkDADcDACACIAspAwA3AwAgECABKQOw\
EjcDACABQfgOakEoaiABQZASakEoaikDADcDACABQfgOakEwaiABQZASakEwaikDADcDACABQfgOak\
E4aiABQZASakE4aikDADcDACABIAEpA5ASNwP4DiAHIAMpAwA3AwAgDiAKKQMANwMAIAggAikDADcD\
ACABIAEpA/gONwO4IkEgEBciBkUNHCAGIAEpA7giNwAAIAZBGGogAUG4ImpBGGopAwA3AAAgBkEQai\
ABQbgiakEQaikDADcAACAGQQhqIAFBuCJqQQhqKQMANwAAQSAhAwwZCyAEIAVB0AEQOiIBQfgOakEs\
akIANwIAIAFB+A5qQSRqQgA3AgAgAUH4DmpBHGpCADcCACABQfgOakEUakIANwIAIAFB+A5qQQxqQg\
A3AgAgAUIANwL8DiABQTA2AvgOIAFBkBJqQShqIg0gAUH4DmpBKGoiAikDADcDACABQZASakEgaiAB\
QfgOakEgaiIKKQMANwMAIAFBkBJqQRhqIhAgAUH4DmpBGGoiAykDADcDACABQZASakEQaiIOIAFB+A\
5qQRBqIg8pAwA3AwAgAUGQEmpBCGoiByABQfgOakEIaiILKQMANwMAIAFBkBJqQTBqIgggAUH4DmpB\
MGoiCSgCADYCACABIAEpA/gONwOQEiABQbgiakEgaiIRIAFBkBJqQSRqKQIANwMAIAFBuCJqQRhqIh\
IgAUGQEmpBHGopAgA3AwAgAUG4ImpBEGoiEyABQZASakEUaikCADcDACABQbgiakEIaiIUIAFBkBJq\
QQxqKQIANwMAIAFBuCJqQShqIhUgAUGQEmpBLGopAgA3AwAgASABKQKUEjcDuCIgAUGQEmogAUHQAR\
A6GiABIAEpA9ASIAFB2BNqLQAAIgatfDcD0BIgAUHYEmohDAJAIAZBgAFGDQAgDCAGakEAQYABIAZr\
EDwaCyABQQA6ANgTIAFBkBJqIAxCfxASIAsgBykDADcDACAPIA4pAwA3AwAgAyAQKQMANwMAIAogAS\
kDsBI3AwAgAiANKQMANwMAIAkgCCkDADcDACABQfgOakE4aiABQZASakE4aikDADcDACABIAEpA5AS\
NwP4DiAUIAspAwA3AwAgEyAPKQMANwMAIBIgAykDADcDACARIAopAwA3AwAgFSACKQMANwMAIAEgAS\
kD+A43A7giQTAQFyIGRQ0cIAYgASkDuCI3AAAgBkEoaiABQbgiakEoaikDADcAACAGQSBqIAFBuCJq\
QSBqKQMANwAAIAZBGGogAUG4ImpBGGopAwA3AAAgBkEQaiABQbgiakEQaikDADcAACAGQQhqIAFBuC\
JqQQhqKQMANwAAQTAhAwwYCyAEIAVB8AAQOiIBQfgOakEcakIANwIAIAFB+A5qQRRqQgA3AgAgAUH4\
DmpBDGpCADcCACABQgA3AvwOIAFBIDYC+A4gAUGQEmpBGGoiCiABQfgOakEYaikDADcDACABQZASak\
EQaiIDIAFB+A5qQRBqKQMANwMAIAFBkBJqQQhqIAFB+A5qQQhqIg8pAwA3AwAgAUGQEmpBIGoiCyAB\
QfgOakEgaigCADYCACABIAEpA/gONwOQEiABQegjakEQaiIMIAFBkBJqQRRqKQIANwMAIAFB6CNqQQ\
hqIg0gAUGQEmpBDGopAgA3AwAgAUHoI2pBGGoiECABQZASakEcaikCADcDACABIAEpApQSNwPoIyAB\
QZASaiABQfAAEDoaIAEgASkDkBIgAUH4EmotAAAiBq18NwOQEiABQbgSaiECAkAgBkHAAEYNACACIA\
ZqQQBBwAAgBmsQPBoLIAFBADoA+BIgAUGQEmogAkF/EBQgDyADKQMAIhY3AwAgDSAWNwMAIAwgCikD\
ADcDACAQIAspAwA3AwAgASABKQOYEiIWNwP4DiABIBY3A+gjQSAQFyIGRQ0cIAYgASkD6CM3AAAgBk\
EYaiABQegjakEYaikDADcAACAGQRBqIAFB6CNqQRBqKQMANwAAIAZBCGogAUHoI2pBCGopAwA3AABB\
ICEDDBcLIAQgBUH4DhA6IQEgA0EASA0SAkACQCADDQBBASEGDAELIAMQFyIGRQ0dIAZBfGotAABBA3\
FFDQAgBkEAIAMQPBoLIAFBkBJqIAFB+A4QOhogAUH4DmogAUGQEmoQJCABQfgOaiAGIAMQGQwWCyAE\
IAVB4AIQOiIKQZASaiAKQeACEDoaIApBkBJqIApB6BRqLQAAIgFqQcgBaiECAkAgAUGQAUYNACACQQ\
BBkAEgAWsQPBoLQQAhBiAKQQA6AOgUIAJBAToAACAKQecUaiIBIAEtAABBgAFyOgAAA0AgCkGQEmog\
BmoiASABLQAAIAFByAFqLQAAczoAACABQQFqIgIgAi0AACABQckBai0AAHM6AAAgAUECaiICIAItAA\
AgAUHKAWotAABzOgAAIAFBA2oiAiACLQAAIAFBywFqLQAAczoAACAGQQRqIgZBkAFHDQALIApBkBJq\
ECUgCkH4DmpBGGoiASAKQZASakEYaigCADYCACAKQfgOakEQaiICIApBkBJqQRBqKQMANwMAIApB+A\
5qQQhqIg8gCkGQEmpBCGopAwA3AwAgCiAKKQOQEjcD+A5BHCEDQRwQFyIGRQ0cIAYgCikD+A43AAAg\
BkEYaiABKAIANgAAIAZBEGogAikDADcAACAGQQhqIA8pAwA3AAAMFQsgBCAFQdgCEDoiCkGQEmogCk\
HYAhA6GiAKQZASaiAKQeAUai0AACIBakHIAWohAgJAIAFBiAFGDQAgAkEAQYgBIAFrEDwaC0EAIQYg\
CkEAOgDgFCACQQE6AAAgCkHfFGoiASABLQAAQYABcjoAAANAIApBkBJqIAZqIgEgAS0AACABQcgBai\
0AAHM6AAAgAUEBaiICIAItAAAgAUHJAWotAABzOgAAIAFBAmoiAiACLQAAIAFBygFqLQAAczoAACAB\
QQNqIgIgAi0AACABQcsBai0AAHM6AAAgBkEEaiIGQYgBRw0ACyAKQZASahAlIApB+A5qQRhqIgEgCk\
GQEmpBGGopAwA3AwAgCkH4DmpBEGoiAiAKQZASakEQaikDADcDACAKQfgOakEIaiIPIApBkBJqQQhq\
KQMANwMAIAogCikDkBI3A/gOQSAhA0EgEBciBkUNHCAGIAopA/gONwAAIAZBGGogASkDADcAACAGQR\
BqIAIpAwA3AAAgBkEIaiAPKQMANwAADBQLIAQgBUG4AhA6IgpBkBJqIApBuAIQOhogCkGQEmogCkHA\
FGotAAAiAWpByAFqIQICQCABQegARg0AIAJBAEHoACABaxA8GgtBACEGIApBADoAwBQgAkEBOgAAIA\
pBvxRqIgEgAS0AAEGAAXI6AAADQCAKQZASaiAGaiIBIAEtAAAgAUHIAWotAABzOgAAIAFBAWoiAiAC\
LQAAIAFByQFqLQAAczoAACABQQJqIgIgAi0AACABQcoBai0AAHM6AAAgAUEDaiICIAItAAAgAUHLAW\
otAABzOgAAIAZBBGoiBkHoAEcNAAsgCkGQEmoQJSAKQfgOakEoaiIBIApBkBJqQShqKQMANwMAIApB\
+A5qQSBqIgIgCkGQEmpBIGopAwA3AwAgCkH4DmpBGGoiDyAKQZASakEYaikDADcDACAKQfgOakEQai\
ILIApBkBJqQRBqKQMANwMAIApB+A5qQQhqIgwgCkGQEmpBCGopAwA3AwAgCiAKKQOQEjcD+A5BMCED\
QTAQFyIGRQ0cIAYgCikD+A43AAAgBkEoaiABKQMANwAAIAZBIGogAikDADcAACAGQRhqIA8pAwA3AA\
AgBkEQaiALKQMANwAAIAZBCGogDCkDADcAAAwTCyAEIAVBmAIQOiIKQZASaiAKQZgCEDoaIApBkBJq\
IApBoBRqLQAAIgFqQcgBaiECAkAgAUHIAEYNACACQQBByAAgAWsQPBoLQQAhBiAKQQA6AKAUIAJBAT\
oAACAKQZ8UaiIBIAEtAABBgAFyOgAAA0AgCkGQEmogBmoiASABLQAAIAFByAFqLQAAczoAACABQQFq\
IgIgAi0AACABQckBai0AAHM6AAAgAUECaiICIAItAAAgAUHKAWotAABzOgAAIAFBA2oiAiACLQAAIA\
FBywFqLQAAczoAACAGQQRqIgZByABHDQALIApBkBJqECUgCkH4DmpBOGoiASAKQZASakE4aikDADcD\
ACAKQfgOakEwaiICIApBkBJqQTBqKQMANwMAIApB+A5qQShqIg8gCkGQEmpBKGopAwA3AwAgCkH4Dm\
pBIGoiCyAKQZASakEgaikDADcDACAKQfgOakEYaiIMIApBkBJqQRhqKQMANwMAIApB+A5qQRBqIg0g\
CkGQEmpBEGopAwA3AwAgCkH4DmpBCGoiECAKQZASakEIaikDADcDACAKIAopA5ASNwP4DkHAACEDQc\
AAEBciBkUNHCAGIAopA/gONwAAIAZBOGogASkDADcAACAGQTBqIAIpAwA3AAAgBkEoaiAPKQMANwAA\
IAZBIGogCykDADcAACAGQRhqIAwpAwA3AAAgBkEQaiANKQMANwAAIAZBCGogECkDADcAAAwSCyAEIA\
VB4AAQOiIBQfgOakEMakIANwIAIAFCADcC/A5BECEDIAFBEDYC+A4gAUGQEmpBEGogAUH4DmpBEGoo\
AgA2AgAgAUGQEmpBCGogAUH4DmpBCGopAwA3AwAgAUHoI2pBCGoiAiABQZASakEMaikCADcDACABIA\
EpA/gONwOQEiABIAEpApQSNwPoIyABQZASaiABQeAAEDoaIAFBkBJqIAFBqBJqIAFB6CNqEDBBEBAX\
IgZFDRwgBiABKQPoIzcAACAGQQhqIAIpAwA3AAAMEQsgBCAFQeAAEDoiAUH4DmpBDGpCADcCACABQg\
A3AvwOQRAhAyABQRA2AvgOIAFBkBJqQRBqIAFB+A5qQRBqKAIANgIAIAFBkBJqQQhqIAFB+A5qQQhq\
KQMANwMAIAFB6CNqQQhqIgIgAUGQEmpBDGopAgA3AwAgASABKQP4DjcDkBIgASABKQKUEjcD6CMgAU\
GQEmogAUHgABA6GiABQZASaiABQagSaiABQegjahAvQRAQFyIGRQ0cIAYgASkD6CM3AAAgBkEIaiAC\
KQMANwAADBALQRQhAyAEIAVB6AAQOiIBQfgOakEUakEANgIAIAFB+A5qQQxqQgA3AgAgAUEANgL4Di\
ABQgA3AvwOIAFBFDYC+A4gAUGQEmpBEGogAUH4DmpBEGopAwA3AwAgAUGQEmpBCGogAUH4DmpBCGop\
AwA3AwAgAUHoI2pBCGoiAiABQZASakEMaikCADcDACABQegjakEQaiIKIAFBkBJqQRRqKAIANgIAIA\
EgASkD+A43A5ASIAEgASkClBI3A+gjIAFBkBJqIAFB6AAQOhogAUGQEmogAUGwEmogAUHoI2oQLkEU\
EBciBkUNHCAGIAEpA+gjNwAAIAZBEGogCigCADYAACAGQQhqIAIpAwA3AAAMDwtBFCEDIAQgBUHoAB\
A6IgFB+A5qQRRqQQA2AgAgAUH4DmpBDGpCADcCACABQQA2AvgOIAFCADcC/A4gAUEUNgL4DiABQZAS\
akEQaiABQfgOakEQaikDADcDACABQZASakEIaiABQfgOakEIaikDADcDACABQegjakEIaiICIAFBkB\
JqQQxqKQIANwMAIAFB6CNqQRBqIgogAUGQEmpBFGooAgA2AgAgASABKQP4DjcDkBIgASABKQKUEjcD\
6CMgAUGQEmogAUHoABA6GiABQZASaiABQbASaiABQegjahApQRQQFyIGRQ0cIAYgASkD6CM3AAAgBk\
EQaiAKKAIANgAAIAZBCGogAikDADcAAAwOCyAEIAVB4AIQOiIKQZASaiAKQeACEDoaIApBkBJqIApB\
6BRqLQAAIgFqQcgBaiECAkAgAUGQAUYNACACQQBBkAEgAWsQPBoLQQAhBiAKQQA6AOgUIAJBBjoAAC\
AKQecUaiIBIAEtAABBgAFyOgAAA0AgCkGQEmogBmoiASABLQAAIAFByAFqLQAAczoAACABQQFqIgIg\
Ai0AACABQckBai0AAHM6AAAgAUECaiICIAItAAAgAUHKAWotAABzOgAAIAFBA2oiAiACLQAAIAFByw\
FqLQAAczoAACAGQQRqIgZBkAFHDQALIApBkBJqECUgCkH4DmpBGGoiASAKQZASakEYaigCADYCACAK\
QfgOakEQaiICIApBkBJqQRBqKQMANwMAIApB+A5qQQhqIg8gCkGQEmpBCGopAwA3AwAgCiAKKQOQEj\
cD+A5BHCEDQRwQFyIGRQ0cIAYgCikD+A43AAAgBkEYaiABKAIANgAAIAZBEGogAikDADcAACAGQQhq\
IA8pAwA3AAAMDQsgBCAFQdgCEDoiCkGQEmogCkHYAhA6GiAKQZASaiAKQeAUai0AACIBakHIAWohAg\
JAIAFBiAFGDQAgAkEAQYgBIAFrEDwaC0EAIQYgCkEAOgDgFCACQQY6AAAgCkHfFGoiASABLQAAQYAB\
cjoAAANAIApBkBJqIAZqIgEgAS0AACABQcgBai0AAHM6AAAgAUEBaiICIAItAAAgAUHJAWotAABzOg\
AAIAFBAmoiAiACLQAAIAFBygFqLQAAczoAACABQQNqIgIgAi0AACABQcsBai0AAHM6AAAgBkEEaiIG\
QYgBRw0ACyAKQZASahAlIApB+A5qQRhqIgEgCkGQEmpBGGopAwA3AwAgCkH4DmpBEGoiAiAKQZASak\
EQaikDADcDACAKQfgOakEIaiIPIApBkBJqQQhqKQMANwMAIAogCikDkBI3A/gOQSAhA0EgEBciBkUN\
HCAGIAopA/gONwAAIAZBGGogASkDADcAACAGQRBqIAIpAwA3AAAgBkEIaiAPKQMANwAADAwLIAQgBU\
G4AhA6IgpBkBJqIApBuAIQOhogCkGQEmogCkHAFGotAAAiAWpByAFqIQICQCABQegARg0AIAJBAEHo\
ACABaxA8GgtBACEGIApBADoAwBQgAkEGOgAAIApBvxRqIgEgAS0AAEGAAXI6AAADQCAKQZASaiAGai\
IBIAEtAAAgAUHIAWotAABzOgAAIAFBAWoiAiACLQAAIAFByQFqLQAAczoAACABQQJqIgIgAi0AACAB\
QcoBai0AAHM6AAAgAUEDaiICIAItAAAgAUHLAWotAABzOgAAIAZBBGoiBkHoAEcNAAsgCkGQEmoQJS\
AKQfgOakEoaiIBIApBkBJqQShqKQMANwMAIApB+A5qQSBqIgIgCkGQEmpBIGopAwA3AwAgCkH4DmpB\
GGoiDyAKQZASakEYaikDADcDACAKQfgOakEQaiILIApBkBJqQRBqKQMANwMAIApB+A5qQQhqIgwgCk\
GQEmpBCGopAwA3AwAgCiAKKQOQEjcD+A5BMCEDQTAQFyIGRQ0cIAYgCikD+A43AAAgBkEoaiABKQMA\
NwAAIAZBIGogAikDADcAACAGQRhqIA8pAwA3AAAgBkEQaiALKQMANwAAIAZBCGogDCkDADcAAAwLCy\
AEIAVBmAIQOiIKQZASaiAKQZgCEDoaIApBkBJqIApBoBRqLQAAIgFqQcgBaiECAkAgAUHIAEYNACAC\
QQBByAAgAWsQPBoLQQAhBiAKQQA6AKAUIAJBBjoAACAKQZ8UaiIBIAEtAABBgAFyOgAAA0AgCkGQEm\
ogBmoiASABLQAAIAFByAFqLQAAczoAACABQQFqIgIgAi0AACABQckBai0AAHM6AAAgAUECaiICIAIt\
AAAgAUHKAWotAABzOgAAIAFBA2oiAiACLQAAIAFBywFqLQAAczoAACAGQQRqIgZByABHDQALIApBkB\
JqECUgCkH4DmpBOGoiASAKQZASakE4aikDADcDACAKQfgOakEwaiICIApBkBJqQTBqKQMANwMAIApB\
+A5qQShqIg8gCkGQEmpBKGopAwA3AwAgCkH4DmpBIGoiCyAKQZASakEgaikDADcDACAKQfgOakEYai\
IMIApBkBJqQRhqKQMANwMAIApB+A5qQRBqIg0gCkGQEmpBEGopAwA3AwAgCkH4DmpBCGoiECAKQZAS\
akEIaikDADcDACAKIAopA5ASNwP4DkHAACEDQcAAEBciBkUNHCAGIAopA/gONwAAIAZBOGogASkDAD\
cAACAGQTBqIAIpAwA3AAAgBkEoaiAPKQMANwAAIAZBIGogCykDADcAACAGQRhqIAwpAwA3AAAgBkEQ\
aiANKQMANwAAIAZBCGogECkDADcAAAwKCyAEIAVB8AAQOiIBQZASaiABQfAAEDoaQRwhAyABQegjak\
EcakIANwIAIAFB6CNqQRRqQgA3AgAgAUHoI2pBDGpCADcCACABQgA3AuwjIAFBIDYC6CMgAUH4DmpB\
GGoiAiABQegjakEYaikDADcDACABQfgOakEQaiIKIAFB6CNqQRBqKQMANwMAIAFB+A5qQQhqIg8gAU\
HoI2pBCGopAwA3AwAgAUH4DmpBIGogAUHoI2pBIGooAgA2AgAgASABKQPoIzcD+A4gAUG4ImpBEGoi\
BiABQfgOakEUaikCADcDACABQbgiakEIaiILIAFB+A5qQQxqKQIANwMAIAFBuCJqQRhqIgwgAUH4Dm\
pBHGopAgA3AwAgASABKQL8DjcDuCIgAUGQEmogAUG4EmogAUG4ImoQKCACIAwoAgA2AgAgCiAGKQMA\
NwMAIA8gCykDADcDACABIAEpA7giNwP4DkEcEBciBkUNHCAGIAEpA/gONwAAIAZBGGogAigCADYAAC\
AGQRBqIAopAwA3AAAgBkEIaiAPKQMANwAADAkLIAQgBUHwABA6IgFBkBJqIAFB8AAQOhogAUHoI2pB\
HGpCADcCACABQegjakEUakIANwIAIAFB6CNqQQxqQgA3AgAgAUIANwLsI0EgIQMgAUEgNgLoIyABQf\
gOakEgaiABQegjakEgaigCADYCACABQfgOakEYaiICIAFB6CNqQRhqKQMANwMAIAFB+A5qQRBqIgog\
AUHoI2pBEGopAwA3AwAgAUH4DmpBCGoiDyABQegjakEIaikDADcDACABIAEpA+gjNwP4DiABQbgiak\
EYaiIGIAFB+A5qQRxqKQIANwMAIAFBuCJqQRBqIgsgAUH4DmpBFGopAgA3AwAgAUG4ImpBCGoiDCAB\
QfgOakEMaikCADcDACABIAEpAvwONwO4IiABQZASaiABQbgSaiABQbgiahAoIAIgBikDADcDACAKIA\
spAwA3AwAgDyAMKQMANwMAIAEgASkDuCI3A/gOQSAQFyIGRQ0cIAYgASkD+A43AAAgBkEYaiACKQMA\
NwAAIAZBEGogCikDADcAACAGQQhqIA8pAwA3AAAMCAsgBCAFQdgBEDoiAUGQEmogAUHYARA6GiABQe\
gjakEMakIANwIAIAFB6CNqQRRqQgA3AgAgAUHoI2pBHGpCADcCACABQegjakEkakIANwIAIAFB6CNq\
QSxqQgA3AgAgAUHoI2pBNGpCADcCACABQegjakE8akIANwIAIAFCADcC7CMgAUHAADYC6CMgAUH4Dm\
ogAUHoI2pBxAAQOhogAUHwImogAUH4DmpBPGopAgA3AwBBMCEDIAFBuCJqQTBqIAFB+A5qQTRqKQIA\
NwMAIAFBuCJqQShqIgYgAUH4DmpBLGopAgA3AwAgAUG4ImpBIGoiAiABQfgOakEkaikCADcDACABQb\
giakEYaiIKIAFB+A5qQRxqKQIANwMAIAFBuCJqQRBqIg8gAUH4DmpBFGopAgA3AwAgAUG4ImpBCGoi\
CyABQfgOakEMaikCADcDACABIAEpAvwONwO4IiABQZASaiABQeASaiABQbgiahAjIAFB+A5qQShqIg\
wgBikDADcDACABQfgOakEgaiINIAIpAwA3AwAgAUH4DmpBGGoiAiAKKQMANwMAIAFB+A5qQRBqIgog\
DykDADcDACABQfgOakEIaiIPIAspAwA3AwAgASABKQO4IjcD+A5BMBAXIgZFDRwgBiABKQP4DjcAAC\
AGQShqIAwpAwA3AAAgBkEgaiANKQMANwAAIAZBGGogAikDADcAACAGQRBqIAopAwA3AAAgBkEIaiAP\
KQMANwAADAcLIAQgBUHYARA6IgFBkBJqIAFB2AEQOhogAUHoI2pBDGpCADcCACABQegjakEUakIANw\
IAIAFB6CNqQRxqQgA3AgAgAUHoI2pBJGpCADcCACABQegjakEsakIANwIAIAFB6CNqQTRqQgA3AgAg\
AUHoI2pBPGpCADcCACABQgA3AuwjQcAAIQMgAUHAADYC6CMgAUH4DmogAUHoI2pBxAAQOhogAUG4Im\
pBOGoiBiABQfgOakE8aikCADcDACABQbgiakEwaiICIAFB+A5qQTRqKQIANwMAIAFBuCJqQShqIgog\
AUH4DmpBLGopAgA3AwAgAUG4ImpBIGoiDyABQfgOakEkaikCADcDACABQbgiakEYaiILIAFB+A5qQR\
xqKQIANwMAIAFBuCJqQRBqIgwgAUH4DmpBFGopAgA3AwAgAUG4ImpBCGoiDSABQfgOakEMaikCADcD\
ACABIAEpAvwONwO4IiABQZASaiABQeASaiABQbgiahAjIAFB+A5qQThqIhAgBikDADcDACABQfgOak\
EwaiIOIAIpAwA3AwAgAUH4DmpBKGoiAiAKKQMANwMAIAFB+A5qQSBqIgogDykDADcDACABQfgOakEY\
aiIPIAspAwA3AwAgAUH4DmpBEGoiCyAMKQMANwMAIAFB+A5qQQhqIgwgDSkDADcDACABIAEpA7giNw\
P4DkHAABAXIgZFDRwgBiABKQP4DjcAACAGQThqIBApAwA3AAAgBkEwaiAOKQMANwAAIAZBKGogAikD\
ADcAACAGQSBqIAopAwA3AAAgBkEYaiAPKQMANwAAIAZBEGogCykDADcAACAGQQhqIAwpAwA3AAAMBg\
sgBEH4DmogBUH4AhA6GiADQQBIDQECQAJAIAMNAEEBIQYMAQsgAxAXIgZFDR0gBkF8ai0AAEEDcUUN\
ACAGQQAgAxA8GgsgBEGQEmogBEH4DmpB+AIQOhogBCAEQfgOakHIARA6Ig9ByAFqIA9BkBJqQcgBak\
GpARA6IQEgD0HoI2ogD0H4DmpByAEQOhogD0GIIWogAUGpARA6GiAPQYghaiAPLQCwIiIBaiEKAkAg\
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\
IQggDCAFfCEFIB8gBHwhBCABQYABaiIBIAJHDQALCyAAIAQ3AzggACAFNwMwIAAgBjcDKCAAIAc3Ay\
AgACAINwMYIAAgCTcDECAAIAo3AwggACALNwMAIANBgAFqJAAL+FsCDH8FfiMAQYAGayIEJAACQAJA\
AkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAIAIOAgABAgsgASgCACICQQJ0QbTTwA\
BqKAIAIQMMEQtBICEFIAEoAgAiAg4YAQ8CDxADDwQFBgYHBwgPCQoLDwwNEBAOAQsgASgCACECDA8L\
QcAAIQUMDQtBMCEFDAwLQRwhBQwLC0EwIQUMCgtBwAAhBQwJC0EQIQUMCAtBFCEFDAcLQRwhBQwGC0\
EwIQUMBQtBwAAhBQwEC0EcIQUMAwtBMCEFDAILQcAAIQUMAQtBGCEFCyAFIANGDQBBASEBQTkhA0Gt\
gcAAIQIMAQsCQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQA\
JAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAg4YAAEC\
AwQFBgcICQoLDA0ODxAREhMUFRYaAAsgASgCBCECIARB0ARqQQxqQgA3AgAgBEHQBGpBFGpCADcCAC\
AEQdAEakEcakIANwIAIARB0ARqQSRqQgA3AgAgBEHQBGpBLGpCADcCACAEQdAEakE0akIANwIAIARB\
0ARqQTxqQgA3AgAgBEIANwLUBCAEQcAANgLQBCAEQShqIARB0ARqQcQAEDoaIARBoANqQThqIgYgBE\
EoakE8aikCADcDACAEQaADakEwaiIHIARBKGpBNGopAgA3AwAgBEGgA2pBKGoiCCAEQShqQSxqKQIA\
NwMAIARBoANqQSBqIgkgBEEoakEkaikCADcDACAEQaADakEYaiIKIARBKGpBHGopAgA3AwAgBEGgA2\
pBEGoiCyAEQShqQRRqKQIANwMAIARBoANqQQhqIgwgBEEoakEMaikCADcDACAEIAQpAiw3A6ADIAIg\
AikDQCACQcgBaiIDLQAAIgGtfDcDQCACQcgAaiEFAkAgAUGAAUYNACAFIAFqQQBBgAEgAWsQPBoLQQ\
AhASADQQA6AAAgAiAFQn8QEiAEQShqQQhqIgUgAkEIaikDACIQNwMAIARBKGpBEGogAkEQaikDACIR\
NwMAIARBKGpBGGogAkEYaikDACISNwMAIARBKGpBIGogAikDICITNwMAIARBKGpBKGogAkEoaikDAC\
IUNwMAIAwgEDcDACALIBE3AwAgCiASNwMAIAkgEzcDACAIIBQ3AwAgByACQTBqKQMANwMAIAYgAkE4\
aikDADcDACAEIAIpAwAiEDcDKCAEIBA3A6ADIAVBwAAQUSACIAVByAAQOhogA0EAOgAAQcAAEBciAk\
UNGiACIAQpA6ADNwAAIAJBOGogBEGgA2pBOGopAwA3AAAgAkEwaiAEQaADakEwaikDADcAACACQShq\
IARBoANqQShqKQMANwAAIAJBIGogBEGgA2pBIGopAwA3AAAgAkEYaiAEQaADakEYaikDADcAACACQR\
BqIARBoANqQRBqKQMANwAAIAJBCGogBEGgA2pBCGopAwA3AABBwAAhAwwyCyABKAIEIQIgBEHQBGpB\
HGpCADcCACAEQdAEakEUakIANwIAIARB0ARqQQxqQgA3AgAgBEIANwLUBCAEQSA2AtAEIARBKGpBGG\
oiByAEQdAEakEYaikDADcDACAEQShqQRBqIgggBEHQBGpBEGopAwA3AwAgBEEoakEIaiIDIARB0ARq\
QQhqKQMANwMAIARBKGpBIGoiCSAEQdAEakEgaigCADYCACAEIAQpA9AENwMoIARBoANqQRBqIgogBE\
EoakEUaikCADcDACAEQaADakEIaiILIARBKGpBDGopAgA3AwAgBEGgA2pBGGoiDCAEQShqQRxqKQIA\
NwMAIAQgBCkCLDcDoAMgAiACKQNAIAJByAFqIgUtAAAiAa18NwNAIAJByABqIQYCQCABQYABRg0AIA\
YgAWpBAEGAASABaxA8GgtBACEBIAVBADoAACACIAZCfxASIAMgAkEIaikDACIQNwMAIAggAkEQaikD\
ACIRNwMAIAcgAkEYaikDACISNwMAIAkgAikDIDcDACAEQShqQShqIAJBKGopAwA3AwAgCyAQNwMAIA\
ogETcDACAMIBI3AwAgBCACKQMAIhA3AyggBCAQNwOgAyADQSAQUSACIANByAAQOhogBUEAOgAAQSAQ\
FyICRQ0aIAIgBCkDoAM3AAAgAkEYaiAEQaADakEYaikDADcAACACQRBqIARBoANqQRBqKQMANwAAIA\
JBCGogBEGgA2pBCGopAwA3AABBICEDDDELIAEoAgQhAiAEQdAEakEsakIANwIAIARB0ARqQSRqQgA3\
AgAgBEHQBGpBHGpCADcCACAEQdAEakEUakIANwIAIARB0ARqQQxqQgA3AgAgBEIANwLUBCAEQTA2At\
AEIARBKGpBKGoiByAEQdAEakEoaikDADcDACAEQShqQSBqIgggBEHQBGpBIGopAwA3AwAgBEEoakEY\
aiIJIARB0ARqQRhqKQMANwMAIARBKGpBEGoiCiAEQdAEakEQaikDADcDACAEQShqQQhqIgMgBEHQBG\
pBCGopAwA3AwAgBEEoakEwaiAEQdAEakEwaigCADYCACAEIAQpA9AENwMoIARBoANqQSBqIgsgBEEo\
akEkaikCADcDACAEQaADakEYaiIMIARBKGpBHGopAgA3AwAgBEGgA2pBEGoiDSAEQShqQRRqKQIANw\
MAIARBoANqQQhqIg4gBEEoakEMaikCADcDACAEQaADakEoaiIPIARBKGpBLGopAgA3AwAgBCAEKQIs\
NwOgAyACIAIpA0AgAkHIAWoiBS0AACIBrXw3A0AgAkHIAGohBgJAIAFBgAFGDQAgBiABakEAQYABIA\
FrEDwaC0EAIQEgBUEAOgAAIAIgBkJ/EBIgAyACQQhqKQMAIhA3AwAgCiACQRBqKQMAIhE3AwAgCSAC\
QRhqKQMAIhI3AwAgCCACKQMgIhM3AwAgByACQShqKQMAIhQ3AwAgDiAQNwMAIA0gETcDACAMIBI3Aw\
AgCyATNwMAIA8gFDcDACAEIAIpAwAiEDcDKCAEIBA3A6ADIANBMBBRIAIgA0HIABA6GiAFQQA6AABB\
MBAXIgJFDRogAiAEKQOgAzcAACACQShqIARBoANqQShqKQMANwAAIAJBIGogBEGgA2pBIGopAwA3AA\
AgAkEYaiAEQaADakEYaikDADcAACACQRBqIARBoANqQRBqKQMANwAAIAJBCGogBEGgA2pBCGopAwA3\
AABBMCEDDDALIAEoAgQhAiAEQdAEakEcakIANwIAIARB0ARqQRRqQgA3AgAgBEHQBGpBDGpCADcCAC\
AEQgA3AtQEIARBIDYC0AQgBEEoakEYaiIHIARB0ARqQRhqKQMANwMAIARBKGpBEGoiCCAEQdAEakEQ\
aikDADcDACAEQShqQQhqIgMgBEHQBGpBCGopAwA3AwAgBEEoakEgaiIJIARB0ARqQSBqKAIANgIAIA\
QgBCkD0AQ3AyggBEGgA2pBEGoiCiAEQShqQRRqKQIANwMAIARBoANqQQhqIgsgBEEoakEMaikCADcD\
ACAEQaADakEYaiIMIARBKGpBHGopAgA3AwAgBCAEKQIsNwOgAyACIAIpAwAgAkHoAGoiBS0AACIBrX\
w3AwAgAkEoaiEGAkAgAUHAAEYNACAGIAFqQQBBwAAgAWsQPBoLQQAhASAFQQA6AAAgAiAGQX8QFCAD\
IAJBEGoiBikCACIQNwMAIAsgEDcDACAKIAJBGGoiCykCADcDACAMIAJBIGoiCikCADcDACAEIAJBCG\
oiDCkCACIQNwMoIAQgEDcDoAMgAxBYIAogBEEoakEoaikDADcDACALIAkpAwA3AwAgBiAHKQMANwMA\
IAwgCCkDADcDACACIAQpAzA3AwAgBUEAOgAAQSAQFyICRQ0aIAIgBCkDoAM3AAAgAkEYaiAEQaADak\
EYaikDADcAACACQRBqIARBoANqQRBqKQMANwAAIAJBCGogBEGgA2pBCGopAwA3AABBICEDDC8LIANB\
AEgNEiABKAIEIQUCQAJAIAMNAEEBIQIMAQsgAxAXIgJFDRsgAkF8ai0AAEEDcUUNACACQQAgAxA8Gg\
sgBEEoaiAFECQgBUIANwMAIAVBIGogBUGIAWopAwA3AwAgBUEYaiAFQYABaikDADcDACAFQRBqIAVB\
+ABqKQMANwMAIAUgBSkDcDcDCEEAIQEgBUEoakEAQcIAEDwaAkAgBSgCkAFFDQAgBUEANgKQAQsgBE\
EoaiACIAMQGQwuCyABKAIEIgUgBUHYAmoiBi0AACIBakHIAWohAwJAIAFBkAFGDQAgA0EAQZABIAFr\
EDwaC0EAIQIgBkEAOgAAIANBAToAACAFQdcCaiIBIAEtAABBgAFyOgAAA0AgBSACaiIBIAEtAAAgAU\
HIAWotAABzOgAAIAFBAWoiAyADLQAAIAFByQFqLQAAczoAACABQQJqIgMgAy0AACABQcoBai0AAHM6\
AAAgAUEDaiIDIAMtAAAgAUHLAWotAABzOgAAIAJBBGoiAkGQAUcNAAsgBRAlIARBKGpBGGoiBiAFQR\
hqKAAANgIAIARBKGpBEGoiByAFQRBqKQAANwMAIARBKGpBCGoiCCAFQQhqKQAANwMAIAQgBSkAADcD\
KEEAIQEgBUEAQcgBEDxB2AJqQQA6AABBHCEDQRwQFyICRQ0aIAIgBCkDKDcAACACQRhqIAYoAgA2AA\
AgAkEQaiAHKQMANwAAIAJBCGogCCkDADcAAAwtCyABKAIEIgUgBUHQAmoiBi0AACIBakHIAWohAwJA\
IAFBiAFGDQAgA0EAQYgBIAFrEDwaC0EAIQIgBkEAOgAAIANBAToAACAFQc8CaiIBIAEtAABBgAFyOg\
AAA0AgBSACaiIBIAEtAAAgAUHIAWotAABzOgAAIAFBAWoiAyADLQAAIAFByQFqLQAAczoAACABQQJq\
IgMgAy0AACABQcoBai0AAHM6AAAgAUEDaiIDIAMtAAAgAUHLAWotAABzOgAAIAJBBGoiAkGIAUcNAA\
sgBRAlIARBKGpBGGoiBiAFQRhqKQAANwMAIARBKGpBEGoiByAFQRBqKQAANwMAIARBKGpBCGoiCCAF\
QQhqKQAANwMAIAQgBSkAADcDKEEAIQEgBUEAQcgBEDxB0AJqQQA6AABBICEDQSAQFyICRQ0aIAIgBC\
kDKDcAACACQRhqIAYpAwA3AAAgAkEQaiAHKQMANwAAIAJBCGogCCkDADcAAAwsCyABKAIEIgUgBUGw\
AmoiBi0AACIBakHIAWohAwJAIAFB6ABGDQAgA0EAQegAIAFrEDwaC0EAIQIgBkEAOgAAIANBAToAAC\
AFQa8CaiIBIAEtAABBgAFyOgAAA0AgBSACaiIBIAEtAAAgAUHIAWotAABzOgAAIAFBAWoiAyADLQAA\
IAFByQFqLQAAczoAACABQQJqIgMgAy0AACABQcoBai0AAHM6AAAgAUEDaiIDIAMtAAAgAUHLAWotAA\
BzOgAAIAJBBGoiAkHoAEcNAAsgBRAlIARBKGpBKGoiBiAFQShqKQAANwMAIARBKGpBIGoiByAFQSBq\
KQAANwMAIARBKGpBGGoiCCAFQRhqKQAANwMAIARBKGpBEGoiCSAFQRBqKQAANwMAIARBKGpBCGoiCi\
AFQQhqKQAANwMAIAQgBSkAADcDKEEAIQEgBUEAQcgBEDxBsAJqQQA6AABBMCEDQTAQFyICRQ0aIAIg\
BCkDKDcAACACQShqIAYpAwA3AAAgAkEgaiAHKQMANwAAIAJBGGogCCkDADcAACACQRBqIAkpAwA3AA\
AgAkEIaiAKKQMANwAADCsLIAEoAgQiBSAFQZACaiIGLQAAIgFqQcgBaiEDAkAgAUHIAEYNACADQQBB\
yAAgAWsQPBoLQQAhAiAGQQA6AAAgA0EBOgAAIAVBjwJqIgEgAS0AAEGAAXI6AAADQCAFIAJqIgEgAS\
0AACABQcgBai0AAHM6AAAgAUEBaiIDIAMtAAAgAUHJAWotAABzOgAAIAFBAmoiAyADLQAAIAFBygFq\
LQAAczoAACABQQNqIgMgAy0AACABQcsBai0AAHM6AAAgAkEEaiICQcgARw0ACyAFECUgBEEoakE4ai\
IGIAVBOGopAAA3AwAgBEEoakEwaiIHIAVBMGopAAA3AwAgBEEoakEoaiIIIAVBKGopAAA3AwAgBEEo\
akEgaiIJIAVBIGopAAA3AwAgBEEoakEYaiIKIAVBGGopAAA3AwAgBEEoakEQaiILIAVBEGopAAA3Aw\
AgBEEoakEIaiIMIAVBCGopAAA3AwAgBCAFKQAANwMoQQAhASAFQQBByAEQPEGQAmpBADoAAEHAACED\
QcAAEBciAkUNGiACIAQpAyg3AAAgAkE4aiAGKQMANwAAIAJBMGogBykDADcAACACQShqIAgpAwA3AA\
AgAkEgaiAJKQMANwAAIAJBGGogCikDADcAACACQRBqIAspAwA3AAAgAkEIaiAMKQMANwAADCoLIAEo\
AgQhAiAEQdAEakEMakIANwIAIARCADcC1ARBECEDIARBEDYC0AQgBEEoakEQaiAEQdAEakEQaigCAD\
YCACAEQShqQQhqIARB0ARqQQhqKQMANwMAIARBoANqQQhqIgUgBEEoakEMaikCADcDACAEIAQpA9AE\
NwMoIAQgBCkCLDcDoAMgAiACQRhqIARBoANqEDBBACEBIAJB2ABqQQA6AAAgAkEQakL+uevF6Y6VmR\
A3AwAgAkKBxpS6lvHq5m83AwggAkIANwMAQRAQFyICRQ0aIAIgBCkDoAM3AAAgAkEIaiAFKQMANwAA\
DCkLIAEoAgQhAiAEQdAEakEMakIANwIAIARCADcC1ARBECEDIARBEDYC0AQgBEEoakEQaiAEQdAEak\
EQaigCADYCACAEQShqQQhqIARB0ARqQQhqKQMANwMAIARBoANqQQhqIgUgBEEoakEMaikCADcDACAE\
IAQpA9AENwMoIAQgBCkCLDcDoAMgAiACQRhqIARBoANqEC9BACEBIAJB2ABqQQA6AAAgAkEQakL+ue\
vF6Y6VmRA3AwAgAkKBxpS6lvHq5m83AwggAkIANwMAQRAQFyICRQ0aIAIgBCkDoAM3AAAgAkEIaiAF\
KQMANwAADCgLIAEoAgQhAkEUIQNBACEBIARB0ARqQRRqQQA2AgAgBEHQBGpBDGpCADcCACAEQgA3At\
QEIARBFDYC0AQgBEEoakEQaiAEQdAEakEQaikDADcDACAEQShqQQhqIARB0ARqQQhqKQMANwMAIARB\
oANqQQhqIgUgBEEoakEMaikCADcDACAEQaADakEQaiIGIARBKGpBFGooAgA2AgAgBCAEKQPQBDcDKC\
AEIAQpAiw3A6ADIAIgAkEgaiAEQaADahAuIAJCADcDACACQeAAakEAOgAAIAJBACkD2I1ANwMIIAJB\
EGpBACkD4I1ANwMAIAJBGGpBACgC6I1ANgIAQRQQFyICRQ0aIAIgBCkDoAM3AAAgAkEQaiAGKAIANg\
AAIAJBCGogBSkDADcAAAwnCyABKAIEIQJBFCEDQQAhASAEQdAEakEUakEANgIAIARB0ARqQQxqQgA3\
AgAgBEIANwLUBCAEQRQ2AtAEIARBKGpBEGogBEHQBGpBEGopAwA3AwAgBEEoakEIaiAEQdAEakEIai\
kDADcDACAEQaADakEIaiIFIARBKGpBDGopAgA3AwAgBEGgA2pBEGoiBiAEQShqQRRqKAIANgIAIAQg\
BCkD0AQ3AyggBCAEKQIsNwOgAyACIAJBIGogBEGgA2oQKSACQeAAakEAOgAAIAJBGGpB8MPLnnw2Ag\
AgAkEQakL+uevF6Y6VmRA3AwAgAkKBxpS6lvHq5m83AwggAkIANwMAQRQQFyICRQ0aIAIgBCkDoAM3\
AAAgAkEQaiAGKAIANgAAIAJBCGogBSkDADcAAAwmCyABKAIEIgUgBUHYAmoiBi0AACIBakHIAWohAw\
JAIAFBkAFGDQAgA0EAQZABIAFrEDwaC0EAIQIgBkEAOgAAIANBBjoAACAFQdcCaiIBIAEtAABBgAFy\
OgAAA0AgBSACaiIBIAEtAAAgAUHIAWotAABzOgAAIAFBAWoiAyADLQAAIAFByQFqLQAAczoAACABQQ\
JqIgMgAy0AACABQcoBai0AAHM6AAAgAUEDaiIDIAMtAAAgAUHLAWotAABzOgAAIAJBBGoiAkGQAUcN\
AAsgBRAlIARBKGpBGGoiBiAFQRhqKAAANgIAIARBKGpBEGoiByAFQRBqKQAANwMAIARBKGpBCGoiCC\
AFQQhqKQAANwMAIAQgBSkAADcDKEEAIQEgBUEAQcgBEDxB2AJqQQA6AABBHCEDQRwQFyICRQ0aIAIg\
BCkDKDcAACACQRhqIAYoAgA2AAAgAkEQaiAHKQMANwAAIAJBCGogCCkDADcAAAwlCyABKAIEIgUgBU\
HQAmoiBi0AACIBakHIAWohAwJAIAFBiAFGDQAgA0EAQYgBIAFrEDwaC0EAIQIgBkEAOgAAIANBBjoA\
ACAFQc8CaiIBIAEtAABBgAFyOgAAA0AgBSACaiIBIAEtAAAgAUHIAWotAABzOgAAIAFBAWoiAyADLQ\
AAIAFByQFqLQAAczoAACABQQJqIgMgAy0AACABQcoBai0AAHM6AAAgAUEDaiIDIAMtAAAgAUHLAWot\
AABzOgAAIAJBBGoiAkGIAUcNAAsgBRAlIARBKGpBGGoiBiAFQRhqKQAANwMAIARBKGpBEGoiByAFQR\
BqKQAANwMAIARBKGpBCGoiCCAFQQhqKQAANwMAIAQgBSkAADcDKEEAIQEgBUEAQcgBEDxB0AJqQQA6\
AABBICEDQSAQFyICRQ0aIAIgBCkDKDcAACACQRhqIAYpAwA3AAAgAkEQaiAHKQMANwAAIAJBCGogCC\
kDADcAAAwkCyABKAIEIgUgBUGwAmoiBi0AACIBakHIAWohAwJAIAFB6ABGDQAgA0EAQegAIAFrEDwa\
C0EAIQIgBkEAOgAAIANBBjoAACAFQa8CaiIBIAEtAABBgAFyOgAAA0AgBSACaiIBIAEtAAAgAUHIAW\
otAABzOgAAIAFBAWoiAyADLQAAIAFByQFqLQAAczoAACABQQJqIgMgAy0AACABQcoBai0AAHM6AAAg\
AUEDaiIDIAMtAAAgAUHLAWotAABzOgAAIAJBBGoiAkHoAEcNAAsgBRAlIARBKGpBKGoiBiAFQShqKQ\
AANwMAIARBKGpBIGoiByAFQSBqKQAANwMAIARBKGpBGGoiCCAFQRhqKQAANwMAIARBKGpBEGoiCSAF\
QRBqKQAANwMAIARBKGpBCGoiCiAFQQhqKQAANwMAIAQgBSkAADcDKEEAIQEgBUEAQcgBEDxBsAJqQQ\
A6AABBMCEDQTAQFyICRQ0aIAIgBCkDKDcAACACQShqIAYpAwA3AAAgAkEgaiAHKQMANwAAIAJBGGog\
CCkDADcAACACQRBqIAkpAwA3AAAgAkEIaiAKKQMANwAADCMLIAEoAgQiBSAFQZACaiIGLQAAIgFqQc\
gBaiEDAkAgAUHIAEYNACADQQBByAAgAWsQPBoLQQAhAiAGQQA6AAAgA0EGOgAAIAVBjwJqIgEgAS0A\
AEGAAXI6AAADQCAFIAJqIgEgAS0AACABQcgBai0AAHM6AAAgAUEBaiIDIAMtAAAgAUHJAWotAABzOg\
AAIAFBAmoiAyADLQAAIAFBygFqLQAAczoAACABQQNqIgMgAy0AACABQcsBai0AAHM6AAAgAkEEaiIC\
QcgARw0ACyAFECUgBEEoakE4aiIGIAVBOGopAAA3AwAgBEEoakEwaiIHIAVBMGopAAA3AwAgBEEoak\
EoaiIIIAVBKGopAAA3AwAgBEEoakEgaiIJIAVBIGopAAA3AwAgBEEoakEYaiIKIAVBGGopAAA3AwAg\
BEEoakEQaiILIAVBEGopAAA3AwAgBEEoakEIaiIMIAVBCGopAAA3AwAgBCAFKQAANwMoQQAhASAFQQ\
BByAEQPEGQAmpBADoAAEHAACEDQcAAEBciAkUNGiACIAQpAyg3AAAgAkE4aiAGKQMANwAAIAJBMGog\
BykDADcAACACQShqIAgpAwA3AAAgAkEgaiAJKQMANwAAIAJBGGogCikDADcAACACQRBqIAspAwA3AA\
AgAkEIaiAMKQMANwAADCILIAEoAgQhAkEcIQMgBEHQBGpBHGpCADcCACAEQdAEakEUakIANwIAIARB\
0ARqQQxqQgA3AgAgBEIANwLUBCAEQSA2AtAEIARBKGpBGGoiBSAEQdAEakEYaikDADcDACAEQShqQR\
BqIgYgBEHQBGpBEGopAwA3AwAgBEEoakEIaiIHIARB0ARqQQhqKQMANwMAIARBKGpBIGogBEHQBGpB\
IGooAgA2AgAgBCAEKQPQBDcDKCAEQaADakEQaiIBIARBKGpBFGopAgA3AwAgBEGgA2pBCGoiCCAEQS\
hqQQxqKQIANwMAIARBoANqQRhqIgkgBEEoakEcaikCADcDACAEIAQpAiw3A6ADIAIgAkEoaiAEQaAD\
ahAoIAUgCSgCADYCACAGIAEpAwA3AwAgByAIKQMANwMAIAQgBCkDoAM3AyggAkIANwMAQQAhASACQe\
gAakEAOgAAIAJBACkDkI5ANwMIIAJBEGpBACkDmI5ANwMAIAJBGGpBACkDoI5ANwMAIAJBIGpBACkD\
qI5ANwMAQRwQFyICRQ0aIAIgBCkDKDcAACACQRhqIAUoAgA2AAAgAkEQaiAGKQMANwAAIAJBCGogBy\
kDADcAAAwhCyABKAIEIQIgBEHQBGpBHGpCADcCACAEQdAEakEUakIANwIAIARB0ARqQQxqQgA3AgAg\
BEIANwLUBEEgIQMgBEEgNgLQBCAEQShqQSBqIARB0ARqQSBqKAIANgIAIARBKGpBGGoiBSAEQdAEak\
EYaikDADcDACAEQShqQRBqIgYgBEHQBGpBEGopAwA3AwAgBEEoakEIaiIHIARB0ARqQQhqKQMANwMA\
IAQgBCkD0AQ3AyggBEGgA2pBGGoiASAEQShqQRxqKQIANwMAIARBoANqQRBqIgggBEEoakEUaikCAD\
cDACAEQaADakEIaiIJIARBKGpBDGopAgA3AwAgBCAEKQIsNwOgAyACIAJBKGogBEGgA2oQKCAFIAEp\
AwA3AwAgBiAIKQMANwMAIAcgCSkDADcDACAEIAQpA6ADNwMoIAJCADcDAEEAIQEgAkHoAGpBADoAAC\
ACQQApA/CNQDcDCCACQRBqQQApA/iNQDcDACACQRhqQQApA4COQDcDACACQSBqQQApA4iOQDcDAEEg\
EBciAkUNGiACIAQpAyg3AAAgAkEYaiAFKQMANwAAIAJBEGogBikDADcAACACQQhqIAcpAwA3AAAMIA\
sgASgCBCECIARB0ARqQQxqQgA3AgAgBEHQBGpBFGpCADcCACAEQdAEakEcakIANwIAIARB0ARqQSRq\
QgA3AgAgBEHQBGpBLGpCADcCACAEQdAEakE0akIANwIAIARB0ARqQTxqQgA3AgAgBEIANwLUBCAEQc\
AANgLQBCAEQShqIARB0ARqQcQAEDoaIARBoANqQThqIARBKGpBPGopAgA3AwBBMCEDIARBoANqQTBq\
IARBKGpBNGopAgA3AwAgBEGgA2pBKGoiASAEQShqQSxqKQIANwMAIARBoANqQSBqIgUgBEEoakEkai\
kCADcDACAEQaADakEYaiIGIARBKGpBHGopAgA3AwAgBEGgA2pBEGoiByAEQShqQRRqKQIANwMAIARB\
oANqQQhqIgggBEEoakEMaikCADcDACAEIAQpAiw3A6ADIAIgAkHQAGogBEGgA2oQIyAEQShqQShqIg\
kgASkDADcDACAEQShqQSBqIgogBSkDADcDACAEQShqQRhqIgUgBikDADcDACAEQShqQRBqIgYgBykD\
ADcDACAEQShqQQhqIgcgCCkDADcDACAEIAQpA6ADNwMoIAJByABqQgA3AwAgAkIANwNAQQAhASACQT\
hqQQApA6iPQDcDACACQTBqQQApA6CPQDcDACACQShqQQApA5iPQDcDACACQSBqQQApA5CPQDcDACAC\
QRhqQQApA4iPQDcDACACQRBqQQApA4CPQDcDACACQQhqQQApA/iOQDcDACACQQApA/COQDcDACACQd\
ABakEAOgAAQTAQFyICRQ0aIAIgBCkDKDcAACACQShqIAkpAwA3AAAgAkEgaiAKKQMANwAAIAJBGGog\
BSkDADcAACACQRBqIAYpAwA3AAAgAkEIaiAHKQMANwAADB8LIAEoAgQhAiAEQdAEakEMakIANwIAIA\
RB0ARqQRRqQgA3AgAgBEHQBGpBHGpCADcCACAEQdAEakEkakIANwIAIARB0ARqQSxqQgA3AgAgBEHQ\
BGpBNGpCADcCACAEQdAEakE8akIANwIAIARCADcC1ARBwAAhAyAEQcAANgLQBCAEQShqIARB0ARqQc\
QAEDoaIARBoANqQThqIgEgBEEoakE8aikCADcDACAEQaADakEwaiIFIARBKGpBNGopAgA3AwAgBEGg\
A2pBKGoiBiAEQShqQSxqKQIANwMAIARBoANqQSBqIgcgBEEoakEkaikCADcDACAEQaADakEYaiIIIA\
RBKGpBHGopAgA3AwAgBEGgA2pBEGoiCSAEQShqQRRqKQIANwMAIARBoANqQQhqIgogBEEoakEMaikC\
ADcDACAEIAQpAiw3A6ADIAIgAkHQAGogBEGgA2oQIyAEQShqQThqIgsgASkDADcDACAEQShqQTBqIg\
wgBSkDADcDACAEQShqQShqIgUgBikDADcDACAEQShqQSBqIgYgBykDADcDACAEQShqQRhqIgcgCCkD\
ADcDACAEQShqQRBqIgggCSkDADcDACAEQShqQQhqIgkgCikDADcDACAEIAQpA6ADNwMoIAJByABqQg\
A3AwAgAkIANwNAQQAhASACQThqQQApA+iOQDcDACACQTBqQQApA+COQDcDACACQShqQQApA9iOQDcD\
ACACQSBqQQApA9COQDcDACACQRhqQQApA8iOQDcDACACQRBqQQApA8COQDcDACACQQhqQQApA7iOQD\
cDACACQQApA7COQDcDACACQdABakEAOgAAQcAAEBciAkUNGiACIAQpAyg3AAAgAkE4aiALKQMANwAA\
IAJBMGogDCkDADcAACACQShqIAUpAwA3AAAgAkEgaiAGKQMANwAAIAJBGGogBykDADcAACACQRBqIA\
gpAwA3AAAgAkEIaiAJKQMANwAADB4LIANBAEgNASABKAIEIQcCQAJAIAMNAEEBIQIMAQsgAxAXIgJF\
DRsgAkF8ai0AAEEDcUUNACACQQAgAxA8GgsgByAHQfACaiIILQAAIgFqQcgBaiEGAkAgAUGoAUYNAC\
AGQQBBqAEgAWsQPBoLQQAhBSAIQQA6AAAgBkEfOgAAIAdB7wJqIgEgAS0AAEGAAXI6AAADQCAHIAVq\
IgEgAS0AACABQcgBai0AAHM6AAAgAUEBaiIGIAYtAAAgAUHJAWotAABzOgAAIAFBAmoiBiAGLQAAIA\
FBygFqLQAAczoAACABQQNqIgYgBi0AACABQcsBai0AAHM6AAAgBUEEaiIFQagBRw0ACyAHECUgBEEo\
aiAHQcgBEDoaQQAhASAHQQBByAEQPEHwAmpBADoAACAEQQA2AqADIARBoANqQQRyQQBBqAEQPBogBE\
GoATYCoAMgBEHQBGogBEGgA2pBrAEQOhogBEEoakHIAWogBEHQBGpBBHJBqAEQOhogBEEoakHwAmpB\
ADoAACAEQShqIAIgAxAzDB0LIANBAEgNACABKAIEIQcgAw0BQQEhAgwCCxBrAAsgAxAXIgJFDRggAk\
F8ai0AAEEDcUUNACACQQAgAxA8GgsgByAHQdACaiIILQAAIgFqQcgBaiEGAkAgAUGIAUYNACAGQQBB\
iAEgAWsQPBoLQQAhBSAIQQA6AAAgBkEfOgAAIAdBzwJqIgEgAS0AAEGAAXI6AAADQCAHIAVqIgEgAS\
0AACABQcgBai0AAHM6AAAgAUEBaiIGIAYtAAAgAUHJAWotAABzOgAAIAFBAmoiBiAGLQAAIAFBygFq\
LQAAczoAACABQQNqIgYgBi0AACABQcsBai0AAHM6AAAgBUEEaiIFQYgBRw0ACyAHECUgBEEoaiAHQc\
gBEDoaQQAhASAHQQBByAEQPEHQAmpBADoAACAEQQA2AqADIARBoANqQQRyQQBBiAEQPBogBEGIATYC\
oAMgBEHQBGogBEGgA2pBjAEQOhogBEEoakHIAWogBEHQBGpBBHJBiAEQOhogBEEoakHQAmpBADoAAC\
AEQShqIAIgAxA0DBkLIAEoAgQhAiAEQdAEakEUakIANwIAIARB0ARqQQxqQgA3AgAgBEIANwLUBEEY\
IQMgBEEYNgLQBCAEQShqQRBqIARB0ARqQRBqKQMANwMAIARBKGpBCGogBEHQBGpBCGopAwA3AwAgBE\
EoakEYaiAEQdAEakEYaigCADYCACAEQaADakEIaiIFIARBKGpBDGopAgA3AwAgBEGgA2pBEGoiBiAE\
QShqQRRqKQIANwMAIAQgBCkD0AQ3AyggBCAEKQIsNwOgAyACIAJBIGogBEGgA2oQMSACQgA3AwBBAC\
EBIAJB4ABqQQA6AAAgAkEAKQP4kUA3AwggAkEQakEAKQOAkkA3AwAgAkEYakEAKQOIkkA3AwBBGBAX\
IgJFDRcgAiAEKQOgAzcAACACQRBqIAYpAwA3AAAgAkEIaiAFKQMANwAADBgLQcAAQQFBACgC+NRAIg\
RBBCAEGxEFAAALQSBBAUEAKAL41EAiBEEEIAQbEQUAAAtBMEEBQQAoAvjUQCIEQQQgBBsRBQAAC0Eg\
QQFBACgC+NRAIgRBBCAEGxEFAAALIANBAUEAKAL41EAiBEEEIAQbEQUAAAtBHEEBQQAoAvjUQCIEQQ\
QgBBsRBQAAC0EgQQFBACgC+NRAIgRBBCAEGxEFAAALQTBBAUEAKAL41EAiBEEEIAQbEQUAAAtBwABB\
AUEAKAL41EAiBEEEIAQbEQUAAAtBEEEBQQAoAvjUQCIEQQQgBBsRBQAAC0EQQQFBACgC+NRAIgRBBC\
AEGxEFAAALQRRBAUEAKAL41EAiBEEEIAQbEQUAAAtBFEEBQQAoAvjUQCIEQQQgBBsRBQAAC0EcQQFB\
ACgC+NRAIgRBBCAEGxEFAAALQSBBAUEAKAL41EAiBEEEIAQbEQUAAAtBMEEBQQAoAvjUQCIEQQQgBB\
sRBQAAC0HAAEEBQQAoAvjUQCIEQQQgBBsRBQAAC0EcQQFBACgC+NRAIgRBBCAEGxEFAAALQSBBAUEA\
KAL41EAiBEEEIAQbEQUAAAtBMEEBQQAoAvjUQCIEQQQgBBsRBQAAC0HAAEEBQQAoAvjUQCIEQQQgBB\
sRBQAACyADQQFBACgC+NRAIgRBBCAEGxEFAAALIANBAUEAKAL41EAiBEEEIAQbEQUAAAtBGEEBQQAo\
AvjUQCIEQQQgBBsRBQAACyAAIAI2AgQgACABNgIAIABBCGogAzYCACAEQYAGaiQAC5xWAhp/An4jAE\
GwAmsiAyQAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAC\
QAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAk\
ACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgACgCAA4YAAECAwQFBgcICQoLDA0O\
DxAREhMUFRYXAAsgACgCBCIAQcgAaiEEAkBBgAEgAEHIAWotAAAiBWsiBiACTw0AAkAgBUUNACAEIA\
VqIAEgBhA6GiAAIAApA0BCgAF8NwNAIAAgBEIAEBIgASAGaiEBIAIgBmshAgsgAiACQQd2IgYgAkEA\
RyACQf8AcUVxIgdrIgVBB3QiCGshAiAFRQ1FIAhFDUUgBkEAIAdrakEHdCEGIAEhBQNAIAAgACkDQE\
KAAXw3A0AgACAFQgAQEiAFQYABaiEFIAZBgH9qIgYNAAxGCwsgBCAFaiABIAIQOhogBSACaiECDEUL\
IAAoAgQiAEHIAGohBAJAQYABIABByAFqLQAAIgVrIgYgAk8NAAJAIAVFDQAgBCAFaiABIAYQOhogAC\
AAKQNAQoABfDcDQCAAIARCABASIAEgBmohASACIAZrIQILIAIgAkEHdiIGIAJBAEcgAkH/AHFFcSIH\
ayIFQQd0IghrIQIgBUUNQSAIRQ1BIAZBACAHa2pBB3QhBiABIQUDQCAAIAApA0BCgAF8NwNAIAAgBU\
IAEBIgBUGAAWohBSAGQYB/aiIGDQAMQgsLIAQgBWogASACEDoaIAUgAmohAgxBCyAAKAIEIgBByABq\
IQQCQEGAASAAQcgBai0AACIFayIGIAJPDQACQCAFRQ0AIAQgBWogASAGEDoaIAAgACkDQEKAAXw3A0\
AgACAEQgAQEiABIAZqIQEgAiAGayECCyACIAJBB3YiBiACQQBHIAJB/wBxRXEiB2siBUEHdCIIayEC\
IAVFDT0gCEUNPSAGQQAgB2tqQQd0IQYgASEFA0AgACAAKQNAQoABfDcDQCAAIAVCABASIAVBgAFqIQ\
UgBkGAf2oiBg0ADD4LCyAEIAVqIAEgAhA6GiAFIAJqIQIMPQsgACgCBCIAQShqIQQCQEHAACAAQegA\
ai0AACIFayIGIAJPDQACQCAFRQ0AIAQgBWogASAGEDoaIAAgACkDAELAAHw3AwAgACAEQQAQFCABIA\
ZqIQEgAiAGayECCyACIAJBBnYiBiACQQBHIAJBP3FFcSIHayIFQQZ0IghrIQIgBUUNOSAIRQ05IAZB\
ACAHa2pBBnQhBiABIQUDQCAAIAApAwBCwAB8NwMAIAAgBUEAEBQgBUHAAGohBSAGQUBqIgYNAAw6Cw\
sgBCAFaiABIAIQOhogBSACaiECDDkLIAAoAgQiCEHpAGotAABBBnQgCC0AaGoiAEUNNiAIIAEgAkGA\
CCAAayIAIAAgAksbIgUQNRogAiAFayICRQ1CIANB+ABqQRBqIAhBEGoiACkDADcDACADQfgAakEYai\
AIQRhqIgYpAwA3AwAgA0H4AGpBIGogCEEgaiIEKQMANwMAIANB+ABqQTBqIAhBMGopAwA3AwAgA0H4\
AGpBOGogCEE4aikDADcDACADQfgAakHAAGogCEHAAGopAwA3AwAgA0H4AGpByABqIAhByABqKQMANw\
MAIANB+ABqQdAAaiAIQdAAaikDADcDACADQfgAakHYAGogCEHYAGopAwA3AwAgA0H4AGpB4ABqIAhB\
4ABqKQMANwMAIAMgCCkDCDcDgAEgAyAIKQMoNwOgASAIQekAai0AACEHIAgtAGohCSADIAgtAGgiCj\
oA4AEgAyAIKQMAIh03A3ggAyAJIAdFckECciIHOgDhASADQegBakEYaiIJIAQpAgA3AwAgA0HoAWpB\
EGoiBCAGKQIANwMAIANB6AFqQQhqIgYgACkCADcDACADIAgpAgg3A+gBIANB6AFqIANB+ABqQShqIA\
ogHSAHEBogCSgCACEHIAQoAgAhBCAGKAIAIQkgAygChAIhCiADKAL8ASELIAMoAvQBIQwgAygC7AEh\
DSADKALoASEOIAggCCkDABAqIAgoApABIgZBN08NEyAIQZABaiAGQQV0aiIAQSBqIAo2AgAgAEEcai\
AHNgIAIABBGGogCzYCACAAQRRqIAQ2AgAgAEEQaiAMNgIAIABBDGogCTYCACAAQQhqIA02AgAgAEEE\
aiAONgIAIAggBkEBajYCkAEgCEEoaiIAQgA3AwAgAEEIakIANwMAIABBEGpCADcDACAAQRhqQgA3Aw\
AgAEEgakIANwMAIABBKGpCADcDACAAQTBqQgA3AwAgAEE4akIANwMAIAhBADsBaCAIQQhqIgAgCCkD\
cDcDACAAQQhqIAhB+ABqKQMANwMAIABBEGogCEGAAWopAwA3AwAgAEEYaiAIQYgBaikDADcDACAIIA\
gpAwBCAXw3AwAgASAFaiEBDDYLIAAoAgQiBEHIAWohCgJAQZABIARB2AJqLQAAIgBrIgggAksNAAJA\
IABFDQAgCiAAaiABIAgQOhogAiAIayECQQAhBQNAIAQgBWoiACAALQAAIABByAFqLQAAczoAACAAQQ\
FqIgYgBi0AACAAQckBai0AAHM6AAAgAEECaiIGIAYtAAAgAEHKAWotAABzOgAAIABBA2oiBiAGLQAA\
IABBywFqLQAAczoAACAFQQRqIgVBkAFHDQALIAQQJSABIAhqIQELIAEgAkGQAW5BkAFsIgBqIQcgAi\
AAayEJIAJBjwFNDTMgAEUNMwNAIAFBkAFqIQhBACEFA0AgBCAFaiIAIAAtAAAgASAFaiIGLQAAczoA\
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\
KQMANwMAIApBGGogGCkDADcDACAKQSBqIBkpAwA3AwAgCkEoaiAaKQMANwMAIApBMGogGykDADcDAC\
AKQThqIBwpAwA3AwAgAy0A4gEhDiADLQDhASEXIAMgAy0A4AEiGDoAcCADIAMpA3giHjcDCCADIA4g\
F0VyQQJyIg46AHEgA0HoAWpBGGoiFyAHKQIANwMAIANB6AFqQRBqIgcgBikCADcDACADQegBakEIai\
IGIAUpAgA3AwAgAyALKQIANwPoASADQegBaiAKIBggHiAOEBogFygCACEOIAcoAgAhByAGKAIAIRcg\
AygChAIhGCADKAL8ASEZIAMoAvQBIRogAygC7AEhGyADKALoASEcIAggCCkDABAqIAgoApABIgZBN0\
8NCSANIAZBBXRqIgUgGDYCHCAFIA42AhggBSAZNgIUIAUgBzYCECAFIBo2AgwgBSAXNgIIIAUgGzYC\
BCAFIBw2AgAgCCAGQQFqNgKQAQsgCCAIKQMAIB18Ih43AwAgAiAASQ0JIAEgAGohASACIABrIgJBgA\
hLDQALCyACRQ0TIAggASACEDUaIAggCCkDABAqDBMLIAAgAkGghcAAEEsACyAFQcAAQeCEwAAQSwAL\
IAZBwABB8ITAABBLAAsgBkEgQYCFwAAQSwALIANBkAJqQQhqIgEgGjYCACADQZACakEQaiIAIBg2Ag\
AgA0GQAmpBGGoiBSAONgIAIAMgGTYCnAIgA0GBAWoiBiABKQMANwAAIAMgFzYCpAIgA0GJAWoiASAA\
KQMANwAAIAMgBzYCrAIgA0GRAWoiACAFKQMANwAAIAMgGzYClAIgAyAcNgKQAiADIAMpA5ACNwB5IA\
NBCGpBGGogACkAADcDACADQQhqQRBqIAEpAAA3AwAgA0EIakEIaiAGKQAANwMAIAMgAykAeTcDCEGQ\
ksAAIANBCGpBgIbAAEH4hsAAEEIACyADQZACakEIaiIBIBQ2AgAgA0GQAmpBEGoiACASNgIAIANBkA\
JqQRhqIgUgEDYCACADIBM2ApwCIANBgQFqIgYgASkDADcAACADIBE2AqQCIANBiQFqIgEgACkDADcA\
ACADIA82AqwCIANBkQFqIgAgBSkDADcAACADIBU2ApQCIAMgFjYCkAIgAyADKQOQAjcAeSADQQhqQR\
hqIAApAAA3AwAgA0EIakEQaiABKQAANwMAIANBCGpBCGogBikAADcDACADIAMpAHk3AwhBkJLAACAD\
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\
QRh3Ii4gL2oiLyAac0EZdyIaIAggMCAiIBlzQRl3IhlqIBRqIiIgJiAoc0EYdyImc0EQdyIoICEgJ2\
oiIWoiJyAZc0EUdyIZICJqaiIiamoiMCANIAsgHiAhIBhzQRl3IhhqaiIeICpzQRB3IiEgJiApaiIm\
aiIpIBhzQRR3IhggHmpqIh4gIXNBGHciIXNBEHciKiAOICYgF3NBGXciFyAfaiAJaiIfICBzQRB3Ii\
AgMmoiJiAXc0EUdyIXIB9qaiIfICBzQRh3IiAgJmoiJmoiMiAac0EUdyIaIDBqaiIwICpzQRh3Iiog\
MmoiMiAac0EZdyIaIAwgMSAmIBdzQRl3IhdqIANqIiYgIiAoc0EYdyIic0EQdyIoICEgKWoiIWoiKS\
AXc0EUdyIXICZqaiImaiAGaiIxIAcgISAYc0EZdyIYIB9qIAZqIh8gLnNBEHciISAiICdqIiJqIicg\
GHNBFHciGCAfamoiHyAhc0EYdyIhc0EQdyIuIAUgIiAZc0EZdyIZIB5qaiIeICBzQRB3IiAgL2oiIi\
AZc0EUdyIZIB5qIAJqIh4gIHNBGHciICAiaiIiaiIvIBpzQRR3IhogMWpqIjEgLnNBGHciLiAvaiIv\
IBpzQRl3IhogByAPIDAgIiAZc0EZdyIZamoiIiAmIChzQRh3IiZzQRB3IiggISAnaiIhaiInIBlzQR\
R3IhkgImpqIiJqaiIwIAEgHiAhIBhzQRl3IhhqIANqIh4gKnNBEHciISAmIClqIiZqIikgGHNBFHci\
GCAeamoiHiAhc0EYdyIhc0EQdyIqIA4gJiAXc0EZdyIXIB9qaiIfICBzQRB3IiAgMmoiJiAXc0EUdy\
IXIB9qIAJqIh8gIHNBGHciICAmaiImaiIyIBpzQRR3IhogMGogCWoiMCAqc0EYdyIqIDJqIjIgGnNB\
GXciGiAIIAQgMSAmIBdzQRl3IhdqaiImICIgKHNBGHciInNBEHciKCAhIClqIiFqIikgF3NBFHciFy\
AmamoiJmogCmoiMSAFICEgGHNBGXciGCAfaiAUaiIfIC5zQRB3IiEgIiAnaiIiaiInIBhzQRR3Ihgg\
H2pqIh8gIXNBGHciIXNBEHciLiALICIgGXNBGXciGSAeamoiHiAgc0EQdyIgIC9qIiIgGXNBFHciGS\
AeaiAKaiIeICBzQRh3IiAgImoiImoiLyAac0EUdyIaIDFqaiIxIC5zQRh3Ii4gL2oiLyAac0EZdyIa\
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\
AhQgAyABQRxqKAAAIgJBGHQgAkEIdEGAgPwHcXIgAkEIdkGA/gNxIAJBGHZyciIKNgIcIAMgAUEgai\
gAACICQRh0IAJBCHRBgID8B3FyIAJBCHZBgP4DcSACQRh2cnIiCzYCICADIAFBGGooAAAiAkEYdCAC\
QQh0QYCA/AdxciACQQh2QYD+A3EgAkEYdnJyIgw2AhggAygCACENIAMoAgQhDiADKAIIIQ8gAygCEC\
EQIAMoAgwhESADKAIUIRIgAyABQSRqKAAAIgJBGHQgAkEIdEGAgPwHcXIgAkEIdkGA/gNxIAJBGHZy\
ciITNgIkIAMgAUEoaigAACICQRh0IAJBCHRBgID8B3FyIAJBCHZBgP4DcSACQRh2cnIiFDYCKCADIA\
FBMGooAAAiAkEYdCACQQh0QYCA/AdxciACQQh2QYD+A3EgAkEYdnJyIhU2AjAgAyABQSxqKAAAIgJB\
GHQgAkEIdEGAgPwHcXIgAkEIdkGA/gNxIAJBGHZyciIWNgIsIAMgAUE0aigAACICQRh0IAJBCHRBgI\
D8B3FyIAJBCHZBgP4DcSACQRh2cnIiAjYCNCADIAFBOGooAAAiF0EYdCAXQQh0QYCA/AdxciAXQQh2\
QYD+A3EgF0EYdnJyIhc2AjggAyABQTxqKAAAIhhBGHQgGEEIdEGAgPwHcXIgGEEIdkGA/gNxIBhBGH\
ZyciIYNgI8IAggEyAKcyAYcyAMIBBzIBVzIBEgDnMgE3MgF3NBAXciGXNBAXciGnNBAXciGyAKIBJz\
IAJzIBAgD3MgFHMgGHNBAXciHHNBAXciHXMgGCACcyAdcyAVIBRzIBxzIBtzQQF3Ih5zQQF3Ih9zIB\
ogHHMgHnMgGSAYcyAbcyAXIBVzIBpzIBYgE3MgGXMgCyAMcyAXcyASIBFzIBZzIA8gDXMgC3MgAnNB\
AXciIHNBAXciIXNBAXciInNBAXciI3NBAXciJHNBAXciJXNBAXciJnNBAXciJyAdICFzIAIgFnMgIX\
MgFCALcyAgcyAdc0EBdyIoc0EBdyIpcyAcICBzIChzIB9zQQF3IipzQQF3IitzIB8gKXMgK3MgHiAo\
cyAqcyAnc0EBdyIsc0EBdyItcyAmICpzICxzICUgH3MgJ3MgJCAecyAmcyAjIBtzICVzICIgGnMgJH\
MgISAZcyAjcyAgIBdzICJzIClzQQF3Ii5zQQF3Ii9zQQF3IjBzQQF3IjFzQQF3IjJzQQF3IjNzQQF3\
IjRzQQF3IjUgKyAvcyApICNzIC9zICggInMgLnMgK3NBAXciNnNBAXciN3MgKiAucyA2cyAtc0EBdy\
I4c0EBdyI5cyAtIDdzIDlzICwgNnMgOHMgNXNBAXciOnNBAXciO3MgNCA4cyA6cyAzIC1zIDVzIDIg\
LHMgNHMgMSAncyAzcyAwICZzIDJzIC8gJXMgMXMgLiAkcyAwcyA3c0EBdyI8c0EBdyI9c0EBdyI+c0\
EBdyI/c0EBdyJAc0EBdyJBc0EBdyJCc0EBdyJDIDkgPXMgNyAxcyA9cyA2IDBzIDxzIDlzQQF3IkRz\
QQF3IkVzIDggPHMgRHMgO3NBAXciRnNBAXciR3MgOyBFcyBHcyA6IERzIEZzIENzQQF3IkhzQQF3Ik\
lzIEIgRnMgSHMgQSA7cyBDcyBAIDpzIEJzID8gNXMgQXMgPiA0cyBAcyA9IDNzID9zIDwgMnMgPnMg\
RXNBAXciSnNBAXciS3NBAXciTHNBAXciTXNBAXciTnNBAXciT3NBAXciUHNBAXdqIEYgSnMgRCA+cy\
BKcyBHc0EBdyJRcyBJc0EBdyJSIEUgP3MgS3MgUXNBAXciUyBMIEEgOiA5IDwgMSAmIB8gKCAhIBcg\
EyAQIAhBHnciVGogDiAFIAdBHnciECAGcyAIcSAGc2pqIA0gBCAIQQV3aiAGIAVzIAdxIAVzampBmf\
OJ1AVqIg5BBXdqQZnzidQFaiJVQR53IgggDkEedyINcyAGIA9qIA4gVCAQc3EgEHNqIFVBBXdqQZnz\
idQFaiIOcSANc2ogECARaiBVIA0gVHNxIFRzaiAOQQV3akGZ84nUBWoiEEEFd2pBmfOJ1AVqIhFBHn\
ciD2ogDCAIaiARIBBBHnciEyAOQR53IgxzcSAMc2ogEiANaiAMIAhzIBBxIAhzaiARQQV3akGZ84nU\
BWoiEUEFd2pBmfOJ1AVqIhJBHnciCCARQR53IhBzIAogDGogESAPIBNzcSATc2ogEkEFd2pBmfOJ1A\
VqIgpxIBBzaiALIBNqIBAgD3MgEnEgD3NqIApBBXdqQZnzidQFaiIMQQV3akGZ84nUBWoiD0EedyIL\
aiAVIApBHnciF2ogCyAMQR53IhNzIBQgEGogDCAXIAhzcSAIc2ogD0EFd2pBmfOJ1AVqIhRxIBNzai\
AWIAhqIA8gEyAXc3EgF3NqIBRBBXdqQZnzidQFaiIVQQV3akGZ84nUBWoiFiAVQR53IhcgFEEedyII\
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\
IANBhYHAACAEEFNFDQYgA0GMgcAAIAQQUw0KQdgBEBciBEUNHCACQQA2AgAgAkEEckEAQYABEDwaIA\
JBgAE2AgAgAkGwAWogAkGEARA6GiAEQdAAaiACQbABakEEckGAARA6GiAEQcgAakIANwMAIARCADcD\
QCAEQQA6ANABIARBACkDsI5ANwMAIARBCGpBACkDuI5ANwMAIARBEGpBACkDwI5ANwMAIARBGGpBAC\
kDyI5ANwMAIARBIGpBACkD0I5ANwMAIARBKGpBACkD2I5ANwMAIARBMGpBACkD4I5ANwMAIARBOGpB\
ACkD6I5ANwMAQRQhBQwjC0HwABAXIgRFDQwgAkGwAWpBCGoQWCAEQSBqIAJB2AFqKQMANwMAIARBGG\
ogAkGwAWpBIGopAwA3AwAgBEEQaiACQbABakEYaikDADcDACAEQQhqIAJBsAFqQRBqKQMANwMAIAQg\
AikDuAE3AwAgAkEMakIANwIAIAJBFGpCADcCACACQRxqQgA3AgAgAkEkakIANwIAIAJBLGpCADcCAC\
ACQTRqQgA3AgAgAkE8akIANwIAIAJCADcCBCACQcAANgIAIAJBsAFqIAJBxAAQOhogBEHgAGogAkGw\
AWpBPGopAgA3AAAgBEHYAGogAkGwAWpBNGopAgA3AAAgBEHQAGogAkGwAWpBLGopAgA3AAAgBEHIAG\
ogAkGwAWpBJGopAgA3AAAgBEHAAGogAkGwAWpBHGopAgA3AAAgBEE4aiACQbABakEUaikCADcAACAE\
QTBqIAJBsAFqQQxqKQIANwAAIAQgAikCtAE3ACggBEEAOgBoQQMhBQwiCwJAAkACQAJAIANBuoDAAE\
EKEFNFDQAgA0HEgMAAQQoQU0UNASADQc6AwABBChBTRQ0CIANB2IDAAEEKEFNFDQMgA0HogMAAQQoQ\
Uw0MQegAEBciBEUNFiACQQxqQgA3AgAgAkEUakIANwIAIAJBHGpCADcCACACQSRqQgA3AgAgAkEsak\
IANwIAIAJBNGpCADcCACACQTxqQgA3AgAgAkIANwIEIAJBwAA2AgAgAkGwAWogAkHEABA6GiAEQdgA\
aiACQbABakE8aikCADcAACAEQdAAaiACQbABakE0aikCADcAACAEQcgAaiACQbABakEsaikCADcAAC\
AEQcAAaiACQbABakEkaikCADcAACAEQThqIAJBsAFqQRxqKQIANwAAIARBMGogAkGwAWpBFGopAgA3\
AAAgBEEoaiACQbABakEMaikCADcAACAEIAIpArQBNwAgIARCADcDACAEQQA6AGAgBEEAKQPYjUA3Aw\
ggBEEQakEAKQPgjUA3AwAgBEEYakEAKALojUA2AgBBCyEFDCULQeACEBciBEUNDyAEQQBByAEQPCEF\
IAJBADYCACACQQRyQQBBkAEQPBogAkGQATYCACACQbABaiACQZQBEDoaIAVByAFqIAJBsAFqQQRyQZ\
ABEDoaIAVBADoA2AJBBSEFDCQLQdgCEBciBEUNDyAEQQBByAEQPCEFIAJBADYCACACQQRyQQBBiAEQ\
PBogAkGIATYCACACQbABaiACQYwBEDoaIAVByAFqIAJBsAFqQQRyQYgBEDoaIAVBADoA0AJBBiEFDC\
MLQbgCEBciBEUNDyAEQQBByAEQPCEFIAJBADYCACACQQRyQQBB6AAQPBogAkHoADYCACACQbABaiAC\
QewAEDoaIAVByAFqIAJBsAFqQQRyQegAEDoaIAVBADoAsAJBByEFDCILQZgCEBciBEUNDyAEQQBByA\
EQPCEFIAJBADYCACACQQRyQQBByAAQPBogAkHIADYCACACQbABaiACQcwAEDoaIAVByAFqIAJBsAFq\
QQRyQcgAEDoaIAVBADoAkAJBCCEFDCELAkAgA0HigMAAQQMQU0UNACADQeWAwABBAxBTDQhB4AAQFy\
IERQ0RIAJBDGpCADcCACACQRRqQgA3AgAgAkEcakIANwIAIAJBJGpCADcCACACQSxqQgA3AgAgAkE0\
akIANwIAIAJBPGpCADcCACACQgA3AgQgAkHAADYCACACQbABaiACQcQAEDoaIARB0ABqIAJBsAFqQT\
xqKQIANwAAIARByABqIAJBsAFqQTRqKQIANwAAIARBwABqIAJBsAFqQSxqKQIANwAAIARBOGogAkGw\
AWpBJGopAgA3AAAgBEEwaiACQbABakEcaikCADcAACAEQShqIAJBsAFqQRRqKQIANwAAIARBIGogAk\
GwAWpBDGopAgA3AAAgBCACKQK0ATcAGCAEQv6568XpjpWZEDcDECAEQoHGlLqW8ermbzcDCCAEQgA3\
AwAgBEEAOgBYQQohBQwhC0HgABAXIgRFDQ8gAkEMakIANwIAIAJBFGpCADcCACACQRxqQgA3AgAgAk\
EkakIANwIAIAJBLGpCADcCACACQTRqQgA3AgAgAkE8akIANwIAIAJCADcCBCACQcAANgIAIAJBsAFq\
IAJBxAAQOhogBEHQAGogAkGwAWpBPGopAgA3AAAgBEHIAGogAkGwAWpBNGopAgA3AAAgBEHAAGogAk\
GwAWpBLGopAgA3AAAgBEE4aiACQbABakEkaikCADcAACAEQTBqIAJBsAFqQRxqKQIANwAAIARBKGog\
AkGwAWpBFGopAgA3AAAgBEEgaiACQbABakEMaikCADcAACAEIAIpArQBNwAYIARC/rnrxemOlZkQNw\
MQIARCgcaUupbx6uZvNwMIIARCADcDACAEQQA6AFhBCSEFDCALAkACQAJAAkAgAykAAELTkIWa08WM\
mTRRDQAgAykAAELTkIWa08XMmjZRDQEgAykAAELTkIWa0+WMnDRRDQIgAykAAELTkIWa06XNmDJRDQ\
MgAykAAELTkIXa1KiMmThRDQcgAykAAELTkIXa1MjMmjZSDQpB2AIQFyIERQ0eIARBAEHIARA8IQUg\
AkEANgIAIAJBBHJBAEGIARA8GiACQYgBNgIAIAJBsAFqIAJBjAEQOhogBUHIAWogAkGwAWpBBHJBiA\
EQOhogBUEAOgDQAkEWIQUMIwtB4AIQFyIERQ0UIARBAEHIARA8IQUgAkEANgIAIAJBBHJBAEGQARA8\
GiACQZABNgIAIAJBsAFqIAJBlAEQOhogBUHIAWogAkGwAWpBBHJBkAEQOhogBUEAOgDYAkENIQUMIg\
tB2AIQFyIERQ0UIARBAEHIARA8IQUgAkEANgIAIAJBBHJBAEGIARA8GiACQYgBNgIAIAJBsAFqIAJB\
jAEQOhogBUHIAWogAkGwAWpBBHJBiAEQOhogBUEAOgDQAkEOIQUMIQtBuAIQFyIERQ0UIARBAEHIAR\
A8IQUgAkEANgIAIAJBBHJBAEHoABA8GiACQegANgIAIAJBsAFqIAJB7AAQOhogBUHIAWogAkGwAWpB\
BHJB6AAQOhogBUEAOgCwAkEPIQUMIAtBmAIQFyIERQ0UIARBAEHIARA8IQUgAkEANgIAIAJBBHJBAE\
HIABA8GiACQcgANgIAIAJBsAFqIAJBzAAQOhogBUHIAWogAkGwAWpBBHJByAAQOhogBUEAOgCQAkEQ\
IQUMHwtB8AAQFyIERQ0UIAJBDGpCADcCACACQRRqQgA3AgAgAkEcakIANwIAIAJBJGpCADcCACACQS\
xqQgA3AgAgAkE0akIANwIAIAJBPGpCADcCACACQgA3AgQgAkHAADYCACACQbABaiACQcQAEDoaIARB\
4ABqIAJBsAFqQTxqKQIANwAAIARB2ABqIAJBsAFqQTRqKQIANwAAIARB0ABqIAJBsAFqQSxqKQIANw\
AAIARByABqIAJBsAFqQSRqKQIANwAAIARBwABqIAJBsAFqQRxqKQIANwAAIARBOGogAkGwAWpBFGop\
AgA3AAAgBEEwaiACQbABakEMaikCADcAACAEIAIpArQBNwAoIARCADcDACAEQQA6AGggBEEAKQOQjk\
A3AwggBEEQakEAKQOYjkA3AwAgBEEYakEAKQOgjkA3AwAgBEEgakEAKQOojkA3AwBBESEFDB4LQfAA\
EBciBEUNFCACQQxqQgA3AgAgAkEUakIANwIAIAJBHGpCADcCACACQSRqQgA3AgAgAkEsakIANwIAIA\
JBNGpCADcCACACQTxqQgA3AgAgAkIANwIEIAJBwAA2AgAgAkGwAWogAkHEABA6GiAEQeAAaiACQbAB\
akE8aikCADcAACAEQdgAaiACQbABakE0aikCADcAACAEQdAAaiACQbABakEsaikCADcAACAEQcgAai\
ACQbABakEkaikCADcAACAEQcAAaiACQbABakEcaikCADcAACAEQThqIAJBsAFqQRRqKQIANwAAIARB\
MGogAkGwAWpBDGopAgA3AAAgBCACKQK0ATcAKCAEQgA3AwAgBEEAOgBoIARBACkD8I1ANwMIIARBEG\
pBACkD+I1ANwMAIARBGGpBACkDgI5ANwMAIARBIGpBACkDiI5ANwMAQRIhBQwdC0HYARAXIgRFDRQg\
AkEANgIAIAJBBHJBAEGAARA8GiACQYABNgIAIAJBsAFqIAJBhAEQOhogBEHQAGogAkGwAWpBBHJBgA\
EQOhogBEHIAGpCADcDACAEQgA3A0AgBEEAOgDQASAEQQApA/COQDcDACAEQQhqQQApA/iOQDcDACAE\
QRBqQQApA4CPQDcDACAEQRhqQQApA4iPQDcDACAEQSBqQQApA5CPQDcDACAEQShqQQApA5iPQDcDAC\
AEQTBqQQApA6CPQDcDACAEQThqQQApA6iPQDcDAEETIQUMHAtB+AIQFyIERQ0VIARBAEHIARA8IQUg\
AkEANgIAIAJBBHJBAEGoARA8GiACQagBNgIAIAJBsAFqIAJBrAEQOhogBUHIAWogAkGwAWpBBHJBqA\
EQOhogBUEAOgDwAkEVIQUMGwsgA0HygMAAQQUQU0UNFyADQZOBwABBBRBTDQFB6AAQFyIERQ0WIARC\
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\
QEEAQaTVwAA2AqzVQEEAQbTVwAA2AsDVQEEAQazVwAA2ArTVQEEAQbzVwAA2AsjVQEEAQbTVwAA2Ar\
zVQEEAQcTVwAA2AtDVQEEAQbzVwAA2AsTVQEEAQQA2ArjYQEEAQczVwAA2AtjVQEEAQcTVwAA2AszV\
QEEAQczVwAA2AtTVQEEAQdTVwAA2AuDVQEEAQdTVwAA2AtzVQEEAQdzVwAA2AujVQEEAQdzVwAA2Au\
TVQEEAQeTVwAA2AvDVQEEAQeTVwAA2AuzVQEEAQezVwAA2AvjVQEEAQezVwAA2AvTVQEEAQfTVwAA2\
AoDWQEEAQfTVwAA2AvzVQEEAQfzVwAA2AojWQEEAQfzVwAA2AoTWQEEAQYTWwAA2ApDWQEEAQYTWwA\
A2AozWQEEAQYzWwAA2ApjWQEEAQZTWwAA2AqDWQEEAQYzWwAA2ApTWQEEAQZzWwAA2AqjWQEEAQZTW\
wAA2ApzWQEEAQaTWwAA2ArDWQEEAQZzWwAA2AqTWQEEAQazWwAA2ArjWQEEAQaTWwAA2AqzWQEEAQb\
TWwAA2AsDWQEEAQazWwAA2ArTWQEEAQbzWwAA2AsjWQEEAQbTWwAA2ArzWQEEAQcTWwAA2AtDWQEEA\
QbzWwAA2AsTWQEEAQczWwAA2AtjWQEEAQcTWwAA2AszWQEEAQdTWwAA2AuDWQEEAQczWwAA2AtTWQE\
EAQdzWwAA2AujWQEEAQdTWwAA2AtzWQEEAQeTWwAA2AvDWQEEAQdzWwAA2AuTWQEEAQezWwAA2AvjW\
QEEAQeTWwAA2AuzWQEEAQfTWwAA2AoDXQEEAQezWwAA2AvTWQEEAQfzWwAA2AojXQEEAQfTWwAA2Av\
zWQEEAQYTXwAA2ApDXQEEAQfzWwAA2AoTXQEEAIAY2AqDYQEEAQYTXwAA2AozXQEEAIAhBWGoiADYC\
mNhAIAYgAEEBcjYCBCAIIAZqQVxqQSg2AgBBAEGAgIABNgK82EALQQAhAUEAKAKY2EAiACACTQ0AQQ\
AgACACayIBNgKY2EBBAEEAKAKg2EAiACACaiIFNgKg2EAgBSABQQFyNgIEIAAgAkEDcjYCBCAAQQhq\
DwsgAQu5JQIDfx5+IwBBwABrIgNBOGpCADcDACADQTBqQgA3AwAgA0EoakIANwMAIANBIGpCADcDAC\
ADQRhqQgA3AwAgA0EQakIANwMAIANBCGpCADcDACADQgA3AwACQCACRQ0AIAEgAkEGdGohBCAAKQMQ\
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\
OGogA0E4aikDADcDACABQQhqQTBqIANBMGopAwA3AwAgAUEIakEoaiADQShqKQMANwMAIAFBCGpBIG\
ogA0EgaikDADcDACABQQhqQRhqIANBGGopAwA3AwAgAUEIakEQaiADQRBqKQMANwMAIAFBCGpBCGog\
A0EIaikDADcDACABIAMpAwA3AwggAykDQCEPIAFBCGpByABqIANByABqEEUgASAPNwNIIAIgAUEIak\
HQARA6GkEAIQMMHwsgAigCBCEDQdABEBciAkUNBiABQQhqQThqIANBOGopAwA3AwAgAUEIakEwaiAD\
QTBqKQMANwMAIAFBCGpBKGogA0EoaikDADcDACABQQhqQSBqIANBIGopAwA3AwAgAUEIakEYaiADQR\
hqKQMANwMAIAFBCGpBEGogA0EQaikDADcDACABQQhqQQhqIANBCGopAwA3AwAgASADKQMANwMIIAMp\
A0AhDyABQQhqQcgAaiADQcgAahBFIAEgDzcDSCACIAFBCGpB0AEQOhpBASEDDB4LIAIoAgQhA0HQAR\
AXIgJFDQYgAUEIakE4aiADQThqKQMANwMAIAFBCGpBMGogA0EwaikDADcDACABQQhqQShqIANBKGop\
AwA3AwAgAUEIakEgaiADQSBqKQMANwMAIAFBCGpBGGogA0EYaikDADcDACABQQhqQRBqIANBEGopAw\
A3AwAgAUEIakEIaiADQQhqKQMANwMAIAEgAykDADcDCCADKQNAIQ8gAUEIakHIAGogA0HIAGoQRSAB\
IA83A0ggAiABQQhqQdABEDoaQQIhAwwdCyACKAIEIQNB8AAQFyICRQ0GIAFBCGpBIGogA0EgaikDAD\
cDACABQQhqQRhqIANBGGopAwA3AwAgAUEIakEQaiADQRBqKQMANwMAIAEgAykDCDcDECADKQMAIQ8g\
AUEIakEoaiADQShqEDkgASAPNwMIIAIgAUEIakHwABA6GkEDIQMMHAsgAigCBCEDQfgOEBciAkUNBi\
ABQQhqQYgBaiADQYgBaikDADcDACABQQhqQYABaiADQYABaikDADcDACABQQhqQfgAaiADQfgAaikD\
ADcDACABQQhqQRBqIANBEGopAwA3AwAgAUEIakEYaiADQRhqKQMANwMAIAFBCGpBIGogA0EgaikDAD\
cDACABQQhqQTBqIANBMGopAwA3AwAgAUEIakE4aiADQThqKQMANwMAIAFBCGpBwABqIANBwABqKQMA\
NwMAIAFBCGpByABqIANByABqKQMANwMAIAFBCGpB0ABqIANB0ABqKQMANwMAIAFBCGpB2ABqIANB2A\
BqKQMANwMAIAFBCGpB4ABqIANB4ABqKQMANwMAIAEgAykDcDcDeCABIAMpAwg3AxAgASADKQMoNwMw\
IAMpAwAhDyADLQBqIQQgAy0AaSEFIAMtAGghBgJAIAMoApABQQV0IgcNAEEAIQcMGwsgAUGAD2pBGG\
oiCCADQZQBaiIJQRhqKQAANwMAIAFBgA9qQRBqIgogCUEQaikAADcDACABQYAPakEIaiILIAlBCGop\
AAA3AwAgASAJKQAANwOADyADQdQBaiEJQQAgB0FgakEFdmshDCABQbwBaiEDQQIhBwNAIANBYGoiDS\
ABKQOADzcAACANQRhqIAgpAwA3AAAgDUEQaiAKKQMANwAAIA1BCGogCykDADcAAAJAAkAgDCAHaiIO\
QQJGDQAgCCAJQWBqIg1BGGopAAA3AwAgCiANQRBqKQAANwMAIAsgDUEIaikAADcDACABIA0pAAA3A4\
APIAdBOEcNARBsAAsgB0F/aiEHDBwLIAMgASkDgA83AAAgA0EYaiAIKQMANwAAIANBEGogCikDADcA\
ACADQQhqIAspAwA3AAAgDkEBRg0bIAggCUEYaikAADcDACAKIAlBEGopAAA3AwAgCyAJQQhqKQAANw\
MAIAEgCSkAADcDgA8gA0HAAGohAyAHQQJqIQcgCUHAAGohCQwACwsQcAALEHEAC0HQAUEIQQAoAvjU\
QCIBQQQgARsRBQAAC0HQAUEIQQAoAvjUQCIBQQQgARsRBQAAC0HQAUEIQQAoAvjUQCIBQQQgARsRBQ\
AAC0HwAEEIQQAoAvjUQCIBQQQgARsRBQAAC0H4DkEIQQAoAvjUQCIBQQQgARsRBQAACyACKAIEIQMC\
QEHoABAXIgJFDQAgAUEIakEQaiADQRBqKQMANwMAIAFBCGpBGGogA0EYaikDADcDACABIAMpAwg3Ax\
AgAykDACEPIAFBCGpBIGogA0EgahA5IAEgDzcDCCACIAFBCGpB6AAQOhpBFyEDDBQLQegAQQhBACgC\
+NRAIgFBBCABGxEFAAALIAIoAgQhAwJAQdgCEBciAkUNACABQQhqIANByAEQOhogAUEIakHIAWogA0\
HIAWoQRiACIAFBCGpB2AIQOhpBFiEDDBMLQdgCQQhBACgC+NRAIgFBBCABGxEFAAALIAIoAgQhAwJA\
QfgCEBciAkUNACABQQhqIANByAEQOhogAUEIakHIAWogA0HIAWoQRyACIAFBCGpB+AIQOhpBFSEDDB\
ILQfgCQQhBACgC+NRAIgFBBCABGxEFAAALIAIoAgQhAwJAQdgBEBciAkUNACABQQhqQThqIANBOGop\
AwA3AwAgAUEIakEwaiADQTBqKQMANwMAIAFBCGpBKGogA0EoaikDADcDACABQQhqQSBqIANBIGopAw\
A3AwAgAUEIakEYaiADQRhqKQMANwMAIAFBCGpBEGogA0EQaikDADcDACABQQhqQQhqIANBCGopAwA3\
AwAgASADKQMANwMIIANByABqKQMAIQ8gAykDQCEQIAFBCGpB0ABqIANB0ABqEEUgAUEIakHIAGogDz\
cDACABIBA3A0ggAiABQQhqQdgBEDoaQRQhAwwRC0HYAUEIQQAoAvjUQCIBQQQgARsRBQAACyACKAIE\
IQMCQEHYARAXIgJFDQAgAUEIakE4aiADQThqKQMANwMAIAFBCGpBMGogA0EwaikDADcDACABQQhqQS\
hqIANBKGopAwA3AwAgAUEIakEgaiADQSBqKQMANwMAIAFBCGpBGGogA0EYaikDADcDACABQQhqQRBq\
IANBEGopAwA3AwAgAUEIakEIaiADQQhqKQMANwMAIAEgAykDADcDCCADQcgAaikDACEPIAMpA0AhEC\
ABQQhqQdAAaiADQdAAahBFIAFBCGpByABqIA83AwAgASAQNwNIIAIgAUEIakHYARA6GkETIQMMEAtB\
2AFBCEEAKAL41EAiAUEEIAEbEQUAAAsgAigCBCEDAkBB8AAQFyICRQ0AIAFBCGpBIGogA0EgaikDAD\
cDACABQQhqQRhqIANBGGopAwA3AwAgAUEIakEQaiADQRBqKQMANwMAIAEgAykDCDcDECADKQMAIQ8g\
AUEIakEoaiADQShqEDkgASAPNwMIIAIgAUEIakHwABA6GkESIQMMDwtB8ABBCEEAKAL41EAiAUEEIA\
EbEQUAAAsgAigCBCEDAkBB8AAQFyICRQ0AIAFBCGpBIGogA0EgaikDADcDACABQQhqQRhqIANBGGop\
AwA3AwAgAUEIakEQaiADQRBqKQMANwMAIAEgAykDCDcDECADKQMAIQ8gAUEIakEoaiADQShqEDkgAS\
APNwMIIAIgAUEIakHwABA6GkERIQMMDgtB8ABBCEEAKAL41EAiAUEEIAEbEQUAAAsgAigCBCEDAkBB\
mAIQFyICRQ0AIAFBCGogA0HIARA6GiABQQhqQcgBaiADQcgBahBIIAIgAUEIakGYAhA6GkEQIQMMDQ\
tBmAJBCEEAKAL41EAiAUEEIAEbEQUAAAsgAigCBCEDAkBBuAIQFyICRQ0AIAFBCGogA0HIARA6GiAB\
QQhqQcgBaiADQcgBahBJIAIgAUEIakG4AhA6GkEPIQMMDAtBuAJBCEEAKAL41EAiAUEEIAEbEQUAAA\
sgAigCBCEDAkBB2AIQFyICRQ0AIAFBCGogA0HIARA6GiABQQhqQcgBaiADQcgBahBGIAIgAUEIakHY\
AhA6GkEOIQMMCwtB2AJBCEEAKAL41EAiAUEEIAEbEQUAAAsgAigCBCEDAkBB4AIQFyICRQ0AIAFBCG\
ogA0HIARA6GiABQQhqQcgBaiADQcgBahBKIAIgAUEIakHgAhA6GkENIQMMCgtB4AJBCEEAKAL41EAi\
AUEEIAEbEQUAAAsgAigCBCEDAkBB6AAQFyICRQ0AIAFBCGpBGGogA0EYaigCADYCACABQQhqQRBqIA\
NBEGopAwA3AwAgASADKQMINwMQIAMpAwAhDyABQQhqQSBqIANBIGoQOSABIA83AwggAiABQQhqQegA\
EDoaQQwhAwwJC0HoAEEIQQAoAvjUQCIBQQQgARsRBQAACyACKAIEIQMCQEHoABAXIgJFDQAgAUEIak\
EYaiADQRhqKAIANgIAIAFBCGpBEGogA0EQaikDADcDACABIAMpAwg3AxAgAykDACEPIAFBCGpBIGog\
A0EgahA5IAEgDzcDCCACIAFBCGpB6AAQOhpBCyEDDAgLQegAQQhBACgC+NRAIgFBBCABGxEFAAALIA\
IoAgQhAwJAQeAAEBciAkUNACABQQhqQRBqIANBEGopAwA3AwAgASADKQMINwMQIAMpAwAhDyABQQhq\
QRhqIANBGGoQOSABIA83AwggAiABQQhqQeAAEDoaQQohAwwHC0HgAEEIQQAoAvjUQCIBQQQgARsRBQ\
AACyACKAIEIQMCQEHgABAXIgJFDQAgAUEIakEQaiADQRBqKQMANwMAIAEgAykDCDcDECADKQMAIQ8g\
AUEIakEYaiADQRhqEDkgASAPNwMIIAIgAUEIakHgABA6GkEJIQMMBgtB4ABBCEEAKAL41EAiAUEEIA\
EbEQUAAAsgAigCBCEDAkBBmAIQFyICRQ0AIAFBCGogA0HIARA6GiABQQhqQcgBaiADQcgBahBIIAIg\
AUEIakGYAhA6GkEIIQMMBQtBmAJBCEEAKAL41EAiAUEEIAEbEQUAAAsgAigCBCEDAkBBuAIQFyICRQ\
0AIAFBCGogA0HIARA6GiABQQhqQcgBaiADQcgBahBJIAIgAUEIakG4AhA6GkEHIQMMBAtBuAJBCEEA\
KAL41EAiAUEEIAEbEQUAAAsgAigCBCEDAkBB2AIQFyICRQ0AIAFBCGogA0HIARA6GiABQQhqQcgBai\
ADQcgBahBGIAIgAUEIakHYAhA6GkEGIQMMAwtB2AJBCEEAKAL41EAiAUEEIAEbEQUAAAsgAigCBCED\
AkBB4AIQFyICRQ0AIAFBCGogA0HIARA6GiABQQhqQcgBaiADQcgBahBKIAIgAUEIakHgAhA6GkEFIQ\
MMAgtB4AJBCEEAKAL41EAiAUEEIAEbEQUAAAsgASAHNgKYASABIAQ6AHIgASAFOgBxIAEgBjoAcCAB\
IA83AwggAiABQQhqQfgOEDoaQQQhAwsgACAAKAIAQX9qNgIAAkBBDBAXIgBFDQAgACACNgIIIAAgAz\
YCBCAAQQA2AgAgAUGgD2okACAADwtBDEEEQQAoAvjUQCIBQQQgARsRBQAAC6MSARp/IwBBwABrIQMg\
ACgCACgCACIEIAQpAwAgAq18NwMAAkAgAkEGdCICRQ0AIAEgAmohBSAEKAIUIQYgBCgCECEHIAQoAg\
whAiAEKAIIIQgDQCADQRhqIgBCADcDACADQSBqIglCADcDACADQThqQgA3AwAgA0EwakIANwMAIANB\
KGpCADcDACADQQhqIgogAUEIaikAADcDACADQRBqIgsgAUEQaikAADcDACAAIAFBGGooAAAiDDYCAC\
AJIAFBIGooAAAiDTYCACADIAEpAAA3AwAgAyABQRxqKAAAIg42AhwgAyABQSRqKAAAIg82AiQgCigC\
ACIQIAwgAUEoaigAACIRIAFBOGooAAAiEiABQTxqKAAAIhMgAygCDCIUIA4gAUEsaigAACIVIA4gFC\
ATIBUgEiARIAwgByAQaiAGIAMoAgQiFmogCCACIAdxaiAGIAJBf3NxaiADKAIAIhdqQfjIqrt9akEH\
dyACaiIAIAJxaiAHIABBf3NxakHW7p7GfmpBDHcgAGoiCSAAcWogAiAJQX9zcWpB2+GBoQJqQRF3IA\
lqIgpqIAMoAhQiGCAJaiAAIAsoAgAiGWogAiAUaiAKIAlxaiAAIApBf3NxakHunfeNfGpBFncgCmoi\
ACAKcWogCSAAQX9zcWpBr5/wq39qQQd3IABqIgkgAHFqIAogCUF/c3FqQaqMn7wEakEMdyAJaiIKIA\
lxaiAAIApBf3NxakGTjMHBempBEXcgCmoiC2ogDyAKaiANIAlqIA4gAGogCyAKcWogCSALQX9zcWpB\
gaqaampBFncgC2oiACALcWogCiAAQX9zcWpB2LGCzAZqQQd3IABqIgkgAHFqIAsgCUF/c3FqQa/vk9\
p4akEMdyAJaiIKIAlxaiAAIApBf3NxakGxt31qQRF3IApqIgtqIAFBNGooAAAiGiAKaiABQTBqKAAA\
IhsgCWogFSAAaiALIApxaiAJIAtBf3NxakG+r/PKeGpBFncgC2oiACALcWogCiAAQX9zcWpBoqLA3A\
ZqQQd3IABqIgkgAHFqIAsgCUF/c3FqQZPj4WxqQQx3IAlqIgogCXFqIAAgCkF/cyIccWpBjofls3pq\
QRF3IApqIgtqIBYgCWogCyAccWogEyAAaiALIApxaiAJIAtBf3MiHHFqQaGQ0M0EakEWdyALaiIAIA\
pxakHiyviwf2pBBXcgAGoiCSAAQX9zcWogDCAKaiAAIBxxaiAJIAtxakHA5oKCfGpBCXcgCWoiCiAA\
cWpB0bT5sgJqQQ53IApqIgtqIBggCWogCyAKQX9zcWogFyAAaiAKIAlBf3NxaiALIAlxakGqj9vNfm\
pBFHcgC2oiACAKcWpB3aC8sX1qQQV3IABqIgkgAEF/c3FqIBEgCmogACALQX9zcWogCSALcWpB06iQ\
EmpBCXcgCWoiCiAAcWpBgc2HxX1qQQ53IApqIgtqIA8gCWogCyAKQX9zcWogGSAAaiAKIAlBf3Nxai\
ALIAlxakHI98++fmpBFHcgC2oiACAKcWpB5puHjwJqQQV3IABqIgkgAEF/c3FqIBIgCmogACALQX9z\
cWogCSALcWpB1o/cmXxqQQl3IAlqIgogAHFqQYeb1KZ/akEOdyAKaiILaiAaIAlqIAsgCkF/c3FqIA\
0gAGogCiAJQX9zcWogCyAJcWpB7anoqgRqQRR3IAtqIgAgCnFqQYXSj896akEFdyAAaiIJIABBf3Nx\
aiAQIApqIAAgC0F/c3FqIAkgC3FqQfjHvmdqQQl3IAlqIgogAHFqQdmFvLsGakEOdyAKaiILaiANIA\
pqIBggCWogGyAAaiAKIAlBf3NxaiALIAlxakGKmanpeGpBFHcgC2oiACALcyILIApzakHC8mhqQQR3\
IABqIgkgC3NqQYHtx7t4akELdyAJaiIKIAlzIhwgAHNqQaLC9ewGakEQdyAKaiILaiAZIApqIBYgCW\
ogEiAAaiALIBxzakGM8JRvakEXdyALaiIJIAtzIgAgCnNqQcTU+6V6akEEdyAJaiIKIABzakGpn/ve\
BGpBC3cgCmoiCyAKcyISIAlzakHglu21f2pBEHcgC2oiAGogGiAKaiAAIAtzIBEgCWogEiAAc2pB8P\
j+9XtqQRd3IABqIglzakHG/e3EAmpBBHcgCWoiCiAJcyAXIAtqIAkgAHMgCnNqQfrPhNV+akELdyAK\
aiIAc2pBheG8p31qQRB3IABqIgtqIA8gCmogCyAAcyAMIAlqIAAgCnMgC3NqQYW6oCRqQRd3IAtqIg\
lzakG5oNPOfWpBBHcgCWoiCiAJcyAbIABqIAkgC3MgCnNqQeWz7rZ+akELdyAKaiIAc2pB+PmJ/QFq\
QRB3IABqIgtqIA4gAGogFyAKaiAQIAlqIAAgCnMgC3NqQeWssaV8akEXdyALaiIJIABBf3NyIAtzak\
HExKShf2pBBncgCWoiACALQX9zciAJc2pBl/+rmQRqQQp3IABqIgogCUF/c3IgAHNqQafH0Nx6akEP\
dyAKaiILaiAUIApqIBsgAGogGCAJaiALIABBf3NyIApzakG5wM5kakEVdyALaiIAIApBf3NyIAtzak\
HDs+2qBmpBBncgAGoiCSALQX9zciAAc2pBkpmz+HhqQQp3IAlqIgogAEF/c3IgCXNqQf3ov39qQQ93\
IApqIgtqIBMgCmogDSAJaiAWIABqIAsgCUF/c3IgCnNqQdG7kax4akEVdyALaiIAIApBf3NyIAtzak\
HP/KH9BmpBBncgAGoiCSALQX9zciAAc2pB4M2zcWpBCncgCWoiCiAAQX9zciAJc2pBlIaFmHpqQQ93\
IApqIgtqIBUgCmogGSAJaiAaIABqIAsgCUF/c3IgCnNqQaGjoPAEakEVdyALaiIAIApBf3NyIAtzak\
GC/c26f2pBBncgAGoiCSALQX9zciAAc2pBteTr6XtqQQp3IAlqIgogAEF/c3IgCXNqQbul39YCakEP\
dyAKaiILIAJqIA8gAGogCyAJQX9zciAKc2pBkaeb3H5qQRV3aiECIAsgB2ohByAKIAZqIQYgCSAIai\
EIIAFBwABqIgEgBUcNAAsgBCAGNgIUIAQgBzYCECAEIAI2AgwgBCAINgIICwvtEQEYfyMAIQIgACgC\
ACIDKAIAIQQgAygCCCEFIAMoAgwhBiADKAIEIQcgAkHAAGsiAEEYaiICQgA3AwAgAEEgaiIIQgA3Aw\
AgAEE4aiIJQgA3AwAgAEEwaiIKQgA3AwAgAEEoaiILQgA3AwAgAEEIaiIMIAEpAAg3AwAgAEEQaiIN\
IAEpABA3AwAgAiABKAAYIg42AgAgCCABKAAgIg82AgAgACABKQAANwMAIAAgASgAHCIQNgIcIAAgAS\
gAJCIRNgIkIAsgASgAKCISNgIAIAAgASgALCILNgIsIAogASgAMCITNgIAIAAgASgANCIKNgI0IAkg\
ASgAOCIUNgIAIAAgASgAPCIJNgI8IAMgBCANKAIAIg0gDyATIAAoAgAiFSARIAogACgCBCIWIAAoAh\
QiFyAKIBEgFyAWIBMgDyANIAcgFSAEIAcgBXFqIAYgB0F/c3FqakH4yKq7fWpBB3dqIgFqIAcgACgC\
DCIYaiAFIAwoAgAiDGogBiAWaiABIAdxaiAFIAFBf3NxakHW7p7GfmpBDHcgAWoiACABcWogByAAQX\
9zcWpB2+GBoQJqQRF3IABqIgIgAHFqIAEgAkF/c3FqQe6d9418akEWdyACaiIBIAJxaiAAIAFBf3Nx\
akGvn/Crf2pBB3cgAWoiCGogECABaiAOIAJqIBcgAGogCCABcWogAiAIQX9zcWpBqoyfvARqQQx3IA\
hqIgAgCHFqIAEgAEF/c3FqQZOMwcF6akERdyAAaiIBIABxaiAIIAFBf3NxakGBqppqakEWdyABaiIC\
IAFxaiAAIAJBf3NxakHYsYLMBmpBB3cgAmoiCGogCyACaiASIAFqIBEgAGogCCACcWogASAIQX9zcW\
pBr++T2nhqQQx3IAhqIgAgCHFqIAIgAEF/c3FqQbG3fWpBEXcgAGoiASAAcWogCCABQX9zcWpBvq/z\
ynhqQRZ3IAFqIgIgAXFqIAAgAkF/c3FqQaKiwNwGakEHdyACaiIIaiAUIAFqIAogAGogCCACcWogAS\
AIQX9zcWpBk+PhbGpBDHcgCGoiACAIcWogAiAAQX9zIhlxakGOh+WzempBEXcgAGoiASAZcWogCSAC\
aiABIABxaiAIIAFBf3MiGXFqQaGQ0M0EakEWdyABaiICIABxakHiyviwf2pBBXcgAmoiCGogCyABai\
AIIAJBf3NxaiAOIABqIAIgGXFqIAggAXFqQcDmgoJ8akEJdyAIaiIAIAJxakHRtPmyAmpBDncgAGoi\
ASAAQX9zcWogFSACaiAAIAhBf3NxaiABIAhxakGqj9vNfmpBFHcgAWoiAiAAcWpB3aC8sX1qQQV3IA\
JqIghqIAkgAWogCCACQX9zcWogEiAAaiACIAFBf3NxaiAIIAFxakHTqJASakEJdyAIaiIAIAJxakGB\
zYfFfWpBDncgAGoiASAAQX9zcWogDSACaiAAIAhBf3NxaiABIAhxakHI98++fmpBFHcgAWoiAiAAcW\
pB5puHjwJqQQV3IAJqIghqIBggAWogCCACQX9zcWogFCAAaiACIAFBf3NxaiAIIAFxakHWj9yZfGpB\
CXcgCGoiACACcWpBh5vUpn9qQQ53IABqIgEgAEF/c3FqIA8gAmogACAIQX9zcWogASAIcWpB7anoqg\
RqQRR3IAFqIgIgAHFqQYXSj896akEFdyACaiIIaiATIAJqIAwgAGogAiABQX9zcWogCCABcWpB+Me+\
Z2pBCXcgCGoiACAIQX9zcWogECABaiAIIAJBf3NxaiAAIAJxakHZhby7BmpBDncgAGoiASAIcWpBip\
mp6XhqQRR3IAFqIgIgAXMiGSAAc2pBwvJoakEEdyACaiIIaiAUIAJqIAsgAWogDyAAaiAIIBlzakGB\
7ce7eGpBC3cgCGoiASAIcyIAIAJzakGiwvXsBmpBEHcgAWoiAiAAc2pBjPCUb2pBF3cgAmoiCCACcy\
IZIAFzakHE1PulempBBHcgCGoiAGogECACaiAAIAhzIA0gAWogGSAAc2pBqZ/73gRqQQt3IABqIgFz\
akHglu21f2pBEHcgAWoiAiABcyASIAhqIAEgAHMgAnNqQfD4/vV7akEXdyACaiIAc2pBxv3txAJqQQ\
R3IABqIghqIBggAmogCCAAcyAVIAFqIAAgAnMgCHNqQfrPhNV+akELdyAIaiIBc2pBheG8p31qQRB3\
IAFqIgIgAXMgDiAAaiABIAhzIAJzakGFuqAkakEXdyACaiIAc2pBuaDTzn1qQQR3IABqIghqIAwgAG\
ogEyABaiAAIAJzIAhzakHls+62fmpBC3cgCGoiASAIcyAJIAJqIAggAHMgAXNqQfj5if0BakEQdyAB\
aiIAc2pB5ayxpXxqQRd3IABqIgIgAUF/c3IgAHNqQcTEpKF/akEGdyACaiIIaiAXIAJqIBQgAGogEC\
ABaiAIIABBf3NyIAJzakGX/6uZBGpBCncgCGoiACACQX9zciAIc2pBp8fQ3HpqQQ93IABqIgEgCEF/\
c3IgAHNqQbnAzmRqQRV3IAFqIgIgAEF/c3IgAXNqQcOz7aoGakEGdyACaiIIaiAWIAJqIBIgAWogGC\
AAaiAIIAFBf3NyIAJzakGSmbP4eGpBCncgCGoiACACQX9zciAIc2pB/ei/f2pBD3cgAGoiASAIQX9z\
ciAAc2pB0buRrHhqQRV3IAFqIgIgAEF/c3IgAXNqQc/8of0GakEGdyACaiIIaiAKIAJqIA4gAWogCS\
AAaiAIIAFBf3NyIAJzakHgzbNxakEKdyAIaiIAIAJBf3NyIAhzakGUhoWYempBD3cgAGoiASAIQX9z\
ciAAc2pBoaOg8ARqQRV3IAFqIgIgAEF/c3IgAXNqQYL9zbp/akEGdyACaiIIajYCACADIAYgCyAAai\
AIIAFBf3NyIAJzakG15Ovpe2pBCncgCGoiAGo2AgwgAyAFIAwgAWogACACQX9zciAIc2pBu6Xf1gJq\
QQ93IABqIgFqNgIIIAMgASAHaiARIAJqIAEgCEF/c3IgAHNqQZGnm9x+akEVd2o2AgQLnA4CDX8Bfi\
MAQaACayIHJAACQAJAAkACQAJAAkACQAJAAkACQCABQYEISQ0AQX8gAUF/aiIIQQt2Z3ZBCnRBgAhq\
QYAIIAhB/w9LGyIIIAFLDQQgB0EIakEAQYABEDwaIAEgCGshCSAAIAhqIQEgCEEKdq0gA3whFCAIQY\
AIRw0BIAdBCGpBIGohCkHgACELIABBgAggAiADIAQgB0EIakEgEB4hCAwCCyAHQgA3A4gBAkACQCAB\
QYB4cSIKDQBBACEIQQAhCQwBCyAKQYAIRw0DIAcgADYCiAFBASEJIAdBATYCjAEgACEICyABQf8HcS\
EBAkAgBkEFdiILIAkgCSALSxtFDQAgB0EIakEYaiIJIAJBGGopAgA3AwAgB0EIakEQaiILIAJBEGop\
AgA3AwAgB0EIakEIaiIMIAJBCGopAgA3AwAgByACKQIANwMIIAdBCGogCEHAACADIARBAXIQGiAHQQ\
hqIAhBwABqQcAAIAMgBBAaIAdBCGogCEGAAWpBwAAgAyAEEBogB0EIaiAIQcABakHAACADIAQQGiAH\
QQhqIAhBgAJqQcAAIAMgBBAaIAdBCGogCEHAAmpBwAAgAyAEEBogB0EIaiAIQYADakHAACADIAQQGi\
AHQQhqIAhBwANqQcAAIAMgBBAaIAdBCGogCEGABGpBwAAgAyAEEBogB0EIaiAIQcAEakHAACADIAQQ\
GiAHQQhqIAhBgAVqQcAAIAMgBBAaIAdBCGogCEHABWpBwAAgAyAEEBogB0EIaiAIQYAGakHAACADIA\
QQGiAHQQhqIAhBwAZqQcAAIAMgBBAaIAdBCGogCEGAB2pBwAAgAyAEEBogB0EIaiAIQcAHakHAACAD\
IARBAnIQGiAFIAkpAwA3ABggBSALKQMANwAQIAUgDCkDADcACCAFIAcpAwg3AAAgBygCjAEhCQsgAU\
UNCCAHQZABakEwaiINQgA3AwAgB0GQAWpBOGoiDkIANwMAIAdBkAFqQcAAaiIPQgA3AwAgB0GQAWpB\
yABqIhBCADcDACAHQZABakHQAGoiEUIANwMAIAdBkAFqQdgAaiISQgA3AwAgB0GQAWpB4ABqIhNCAD\
cDACAHQZABakEgaiIIIAJBGGopAgA3AwAgB0GQAWpBGGoiCyACQRBqKQIANwMAIAdBkAFqQRBqIgwg\
AkEIaikCADcDACAHQgA3A7gBIAcgBDoA+gEgB0EAOwH4ASAHIAIpAgA3A5gBIAcgCa0gA3w3A5ABIA\
dBkAFqIAAgCmogARA1GiAHQQhqQRBqIAwpAwA3AwAgB0EIakEYaiALKQMANwMAIAdBCGpBIGogCCkD\
ADcDACAHQQhqQTBqIA0pAwA3AwAgB0EIakE4aiAOKQMANwMAIAdBCGpBwABqIA8pAwA3AwAgB0EIak\
HIAGogECkDADcDACAHQQhqQdAAaiARKQMANwMAIAdBCGpB2ABqIBIpAwA3AwAgB0EIakHgAGogEykD\
ADcDACAHIAcpA5gBNwMQIAcgBykDuAE3AzAgBy0A+gEhBCAHLQD5ASECIAcgBy0A+AEiAToAcCAHIA\
cpA5ABIgM3AwggByAEIAJFckECciIEOgBxIAdBgAJqQRhqIgIgCCkDADcDACAHQYACakEQaiIAIAsp\
AwA3AwAgB0GAAmpBCGoiCiAMKQMANwMAIAcgBykDmAE3A4ACIAdBgAJqIAdBMGogASADIAQQGiAJQQ\
V0IgRBIGohCCAEQWBGDQQgCCAGSw0FIAIoAgAhCCAAKAIAIQIgCigCACEBIAcoApQCIQAgBygCjAIh\
BiAHKAKEAiEKIAcoAoACIQsgBSAEaiIEIAcoApwCNgAcIAQgCDYAGCAEIAA2ABQgBCACNgAQIAQgBj\
YADCAEIAE2AAggBCAKNgAEIAQgCzYAACAJQQFqIQkMCAtBwAAhCyAHQQhqQcAAaiEKIAAgCCACIAMg\
BCAHQQhqQcAAEB4hCAsgASAJIAIgFCAEIAogCxAeIQkCQCAIQQFHDQAgBkE/TQ0FIAUgBykACDcAAC\
AFQThqIAdBCGpBOGopAAA3AAAgBUEwaiAHQQhqQTBqKQAANwAAIAVBKGogB0EIakEoaikAADcAACAF\
QSBqIAdBCGpBIGopAAA3AAAgBUEYaiAHQQhqQRhqKQAANwAAIAVBEGogB0EIakEQaikAADcAACAFQQ\
hqIAdBCGpBCGopAAA3AABBAiEJDAcLIAkgCGpBBXQiCEGBAU8NBSAHQQhqIAggAiAEIAUgBhAtIQkM\
BgsgByAAQYAIajYCCEGQksAAIAdBCGpB8IXAAEH4hsAAEEIAC0GhjcAAQSNBtIPAABBVAAtBYCAIQa\
CEwAAQTQALIAggBkGghMAAEEsAC0HAACAGQdCEwAAQSwALIAhBgAFBwITAABBLAAsgB0GgAmokACAJ\
C80OAQd/IABBeGoiASAAQXxqKAIAIgJBeHEiAGohAwJAAkAgAkEBcQ0AIAJBA3FFDQEgASgCACICIA\
BqIQACQEEAKAKc2EAgASACayIBRw0AIAMoAgRBA3FBA0cNAUEAIAA2ApTYQCADIAMoAgRBfnE2AgQg\
ASAAQQFyNgIEIAEgAGogADYCAA8LAkACQCACQYACSQ0AIAEoAhghBAJAAkAgASgCDCIFIAFHDQAgAU\
EUQRAgASgCFCIFG2ooAgAiAg0BQQAhBQwDCyABKAIIIgIgBTYCDCAFIAI2AggMAgsgAUEUaiABQRBq\
IAUbIQYDQCAGIQcCQCACIgVBFGoiBigCACICDQAgBUEQaiEGIAUoAhAhAgsgAg0ACyAHQQA2AgAMAQ\
sCQCABQQxqKAIAIgUgAUEIaigCACIGRg0AIAYgBTYCDCAFIAY2AggMAgtBAEEAKAKE1UBBfiACQQN2\
d3E2AoTVQAwBCyAERQ0AAkACQCABKAIcQQJ0QZTXwABqIgIoAgAgAUYNACAEQRBBFCAEKAIQIAFGG2\
ogBTYCACAFRQ0CDAELIAIgBTYCACAFDQBBAEEAKAKI1UBBfiABKAIcd3E2AojVQAwBCyAFIAQ2AhgC\
QCABKAIQIgJFDQAgBSACNgIQIAIgBTYCGAsgASgCFCICRQ0AIAVBFGogAjYCACACIAU2AhgLAkACQC\
ADKAIEIgJBAnFFDQAgAyACQX5xNgIEIAEgAEEBcjYCBCABIABqIAA2AgAMAQsCQAJAAkACQAJAAkAC\
QEEAKAKg2EAgA0YNAEEAKAKc2EAgA0cNAUEAIAE2ApzYQEEAQQAoApTYQCAAaiIANgKU2EAgASAAQQ\
FyNgIEIAEgAGogADYCAA8LQQAgATYCoNhAQQBBACgCmNhAIABqIgA2ApjYQCABIABBAXI2AgQgAUEA\
KAKc2EBGDQEMBQsgAkF4cSIFIABqIQAgBUGAAkkNASADKAIYIQQCQAJAIAMoAgwiBSADRw0AIANBFE\
EQIAMoAhQiBRtqKAIAIgINAUEAIQUMBAsgAygCCCICIAU2AgwgBSACNgIIDAMLIANBFGogA0EQaiAF\
GyEGA0AgBiEHAkAgAiIFQRRqIgYoAgAiAg0AIAVBEGohBiAFKAIQIQILIAINAAsgB0EANgIADAILQQ\
BBADYClNhAQQBBADYCnNhADAMLAkAgA0EMaigCACIFIANBCGooAgAiA0YNACADIAU2AgwgBSADNgII\
DAILQQBBACgChNVAQX4gAkEDdndxNgKE1UAMAQsgBEUNAAJAAkAgAygCHEECdEGU18AAaiICKAIAIA\
NGDQAgBEEQQRQgBCgCECADRhtqIAU2AgAgBUUNAgwBCyACIAU2AgAgBQ0AQQBBACgCiNVAQX4gAygC\
HHdxNgKI1UAMAQsgBSAENgIYAkAgAygCECICRQ0AIAUgAjYCECACIAU2AhgLIAMoAhQiA0UNACAFQR\
RqIAM2AgAgAyAFNgIYCyABIABBAXI2AgQgASAAaiAANgIAIAFBACgCnNhARw0BQQAgADYClNhADAIL\
QQAoArzYQCICIABPDQFBACgCoNhAIgBFDQECQEEAKAKY2EAiBUEpSQ0AQazYwAAhAQNAAkAgASgCAC\
IDIABLDQAgAyABKAIEaiAASw0CCyABKAIIIgENAAsLAkACQEEAKAK02EAiAA0AQf8fIQEMAQtBACEB\
A0AgAUEBaiEBIAAoAggiAA0ACyABQf8fIAFB/x9LGyEBC0EAIAE2AsTYQCAFIAJNDQFBAEF/NgK82E\
APCwJAAkACQCAAQYACSQ0AQR8hAwJAIABB////B0sNACAAQQYgAEEIdmciA2t2QQFxIANBAXRrQT5q\
IQMLIAFCADcCECABQRxqIAM2AgAgA0ECdEGU18AAaiECAkACQAJAAkACQAJAQQAoAojVQCIFQQEgA3\
QiBnFFDQAgAigCACIFKAIEQXhxIABHDQEgBSEDDAILQQAgBSAGcjYCiNVAIAIgATYCACABQRhqIAI2\
AgAMAwsgAEEAQRkgA0EBdmtBH3EgA0EfRht0IQIDQCAFIAJBHXZBBHFqQRBqIgYoAgAiA0UNAiACQQ\
F0IQIgAyEFIAMoAgRBeHEgAEcNAAsLIAMoAggiACABNgIMIAMgATYCCCABQRhqQQA2AgAgASADNgIM\
IAEgADYCCAwCCyAGIAE2AgAgAUEYaiAFNgIACyABIAE2AgwgASABNgIIC0EAQQAoAsTYQEF/aiIBNg\
LE2EAgAQ0DQQAoArTYQCIADQFB/x8hAQwCCyAAQQN2IgNBA3RBjNXAAGohAAJAAkBBACgChNVAIgJB\
ASADdCIDcUUNACAAKAIIIQMMAQtBACACIANyNgKE1UAgACEDCyAAIAE2AgggAyABNgIMIAEgADYCDC\
ABIAM2AggPC0EAIQEDQCABQQFqIQEgACgCCCIADQALIAFB/x8gAUH/H0sbIQELQQAgATYCxNhADwsL\
lQwBGH8jACECIAAoAgAhAyAAKAIIIQQgACgCDCEFIAAoAgQhBiACQcAAayICQRhqIgdCADcDACACQS\
BqIghCADcDACACQThqIglCADcDACACQTBqIgpCADcDACACQShqIgtCADcDACACQQhqIgwgASkACDcD\
ACACQRBqIg0gASkAEDcDACAHIAEoABgiDjYCACAIIAEoACAiDzYCACACIAEpAAA3AwAgAiABKAAcIh\
A2AhwgAiABKAAkIhE2AiQgCyABKAAoIhI2AgAgAiABKAAsIgs2AiwgCiABKAAwIhM2AgAgAiABKAA0\
Igo2AjQgCSABKAA4IhQ2AgAgAiABKAA8IhU2AjwgACADIBMgCyASIBEgDyAQIA4gBiAEIAUgBiADIA\
YgBHFqIAUgBkF/c3FqIAIoAgAiFmpBA3ciAXFqIAQgAUF/c3FqIAIoAgQiF2pBB3ciByABcWogBiAH\
QX9zcWogDCgCACIMakELdyIIIAdxaiABIAhBf3NxaiACKAIMIhhqQRN3IgkgCHEgAWogByAJQX9zcW\
ogDSgCACINakEDdyIBIAlxIAdqIAggAUF/c3FqIAIoAhQiGWpBB3ciAiABcSAIaiAJIAJBf3NxampB\
C3ciByACcSAJaiABIAdBf3NxampBE3ciCCAHcSABaiACIAhBf3NxampBA3ciASAIcSACaiAHIAFBf3\
NxampBB3ciAiABcSAHaiAIIAJBf3NxampBC3ciByACcSAIaiABIAdBf3NxampBE3ciCCAHcSABaiAC\
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\
IRQgAS0AaiEIIAJB4ABqIAQpAhg3AwAgAkHYAGogFDcDACACQdAAaiATNwMAIAJByABqIBI3AwBCAC\
ESIAJCADcDACAIQQRyIQkgAkEIaiEEDAELIAJBEGogAUEQaikDADcDACACQRhqIAFBGGopAwA3AwAg\
AkEgaiABQSBqKQMANwMAIAJBMGogAUEwaikDADcDACACQThqIAFBOGopAwA3AwAgAkHAAGogAUHAAG\
opAwA3AwAgAkHIAGogAUHIAGopAwA3AwAgAkHQAGogAUHQAGopAwA3AwAgAkHYAGogAUHYAGopAwA3\
AwAgAkHgAGogAUHgAGopAwA3AwAgAiABKQMINwMIIAIgASkDKDcDKCABLQBqIQggAiABKQMAIhI3Aw\
AgCCAERXJBAnIhCSACQQhqIQQgAyEGCyACIAk6AGkgAiAFOgBoAkACQCAGRQ0AIAFB8ABqIQogAkEo\
aiEHQQEgBmshCyAIQQRyIQggBkEFdCABakH0AGohASAGQX9qIANPIQwDQCAMDQIgAkHwAGpBGGoiBi\
AEQRhqIg0pAgA3AwAgAkHwAGpBEGoiDiAEQRBqIg8pAgA3AwAgAkHwAGpBCGoiECAEQQhqIhEpAgA3\
AwAgAiAEKQIANwNwIAJB8ABqIAcgBSASIAkQGiAQKQMAIRMgDikDACEUIAYpAwAhFSACKQNwIRYgB0\
EYaiABQRhqKQIANwIAIAdBEGogAUEQaikCADcCACAHQQhqIAFBCGopAgA3AgAgByABKQIANwIAIAQg\
CikDADcDACARIApBCGopAwA3AwAgDyAKQRBqKQMANwMAIA0gCkEYaikDADcDAEIAIRIgAkIANwMAIA\
IgFTcDYCACIBQ3A1ggAiATNwNQIAIgFjcDSCACIAg6AGlBwAAhBSACQcAAOgBoIAFBYGohASAIIQkg\
C0EBaiILQQFHDQALCyAAIAJB8AAQOhoMAgtBACALayADQdCFwAAQTwALIAAgASkDCDcDCCAAIAEpAy\
g3AyggAEEQaiABQRBqKQMANwMAIABBGGogAUEYaikDADcDACAAQSBqIAFBIGopAwA3AwAgAEEwaiAB\
QTBqKQMANwMAIABBOGogAUE4aikDADcDACAAQcAAaiABQcAAaikDADcDACAAQcgAaiABQcgAaikDAD\
cDACAAQdAAaiABQdAAaikDADcDACAAQdgAaiABQdgAaikDADcDACAAQeAAaiABQeAAaikDADcDACAB\
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\
AwAgA0HIAGogA0GoAWpBLGopAgA3AwAgA0HAAGogA0GoAWpBJGopAgA3AwAgA0E4aiADQagBakEcai\
kCADcDACADQTBqIANBqAFqQRRqKQIANwMAIANBKGogA0GoAWpBDGopAgA3AwAgAyADKQKsATcDICAD\
IAY3A1ggA0EIaiADQSBqQQEQFQsgAUHAAGpBADoAACACIAMoAggiAUEYdCABQQh0QYCA/AdxciABQQ\
h2QYD+A3EgAUEYdnJyNgAAIAIgAygCDCIBQRh0IAFBCHRBgID8B3FyIAFBCHZBgP4DcSABQRh2cnI2\
AAQgAiADKAIQIgFBGHQgAUEIdEGAgPwHcXIgAUEIdkGA/gNxIAFBGHZycjYACCACIAMoAhQiAUEYdC\
ABQQh0QYCA/AdxciABQQh2QYD+A3EgAUEYdnJyNgAMIAIgAygCGCIBQRh0IAFBCHRBgID8B3FyIAFB\
CHZBgP4DcSABQRh2cnI2ABAgA0HwAWokAAuyBgEVfyMAQbABayICJAACQAJAAkAgACgCkAEiAyABe6\
ciBE0NACAAQfAAaiEFIAJBKGohBiACQQhqIQcgAkHwAGpBIGohCCADQX9qIQkgA0EFdCAAakHUAGoh\
CiADQX5qQTdJIQsDQCAAIAk2ApABIAlFDQIgACAJQX9qIgw2ApABIAAtAGohDSACQfAAakEYaiIDIA\
pBGGoiDikAADcDACACQfAAakEQaiIPIApBEGoiECkAADcDACACQfAAakEIaiIRIApBCGoiEikAADcD\
ACAIIApBIGopAAA3AAAgCEEIaiAKQShqKQAANwAAIAhBEGogCkEwaikAADcAACAIQRhqIApBOGopAA\
A3AAAgByAFKQMANwMAIAdBCGogBUEIaiITKQMANwMAIAdBEGogBUEQaiIUKQMANwMAIAdBGGogBUEY\
aiIVKQMANwMAIAIgCikAADcDcCAGQThqIAJB8ABqQThqKQMANwAAIAZBMGogAkHwAGpBMGopAwA3AA\
AgBkEoaiACQfAAakEoaikDADcAACAGQSBqIAgpAwA3AAAgBkEYaiADKQMANwAAIAZBEGogDykDADcA\
ACAGQQhqIBEpAwA3AAAgBiACKQNwNwAAIAJBwAA6AGggAiANQQRyIg06AGkgAkIANwMAIAMgFSkCAD\
cDACAPIBQpAgA3AwAgESATKQIANwMAIAIgBSkCADcDcCACQfAAaiAGQcAAQgAgDRAaIAMoAgAhAyAP\
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\
QQhqIA4pAwA3AAAgByAGKQMQNwAAIANBBGohAyALIAFBIGoiAUcNAAsgBigCCCEHCwJAAkACQAJAIA\
lFDQAgB0EFdCICIAVLDQEgBSACayIBQR9NDQIgCUEgRw0DIAQgAmoiAiAAIAhqIgEpAAA3AAAgAkEY\
aiABQRhqKQAANwAAIAJBEGogAUEQaikAADcAACACQQhqIAFBCGopAAA3AAAgB0EBaiEHCyAGQTBqJA\
AgBw8LIAIgBUGwhMAAEEwAC0EgIAFBsITAABBLAAtBICAJQeSLwAAQTgALgQQCA38CfiMAQfABayID\
JAAgACkDACEGIAEgAUHAAGotAAAiBGoiBUGAAToAACADQQhqQRBqIABBGGooAgA2AgAgA0EQaiAAQR\
BqKQIANwMAIAMgACkCCDcDCCAGQgmGIQYgBK1CA4YhBwJAIARBP3MiAEUNACAFQQFqQQAgABA8Ggsg\
BiAHhCEGAkACQCAEQThxQThGDQAgAUE4aiAGNwAAIANBCGogARATDAELIANBCGogARATIANB4ABqQQ\
xqQgA3AgAgA0HgAGpBFGpCADcCACADQeAAakEcakIANwIAIANB4ABqQSRqQgA3AgAgA0HgAGpBLGpC\
ADcCACADQeAAakE0akIANwIAIANBnAFqQgA3AgAgA0IANwJkIANBwAA2AmAgA0GoAWogA0HgAGpBxA\
AQOhogA0HQAGogA0GoAWpBNGopAgA3AwAgA0HIAGogA0GoAWpBLGopAgA3AwAgA0HAAGogA0GoAWpB\
JGopAgA3AwAgA0E4aiADQagBakEcaikCADcDACADQTBqIANBqAFqQRRqKQIANwMAIANBKGogA0GoAW\
pBDGopAgA3AwAgAyADKQKsATcDICADIAY3A1ggA0EIaiADQSBqEBMLIAIgAygCCDYAACACIAMpAgw3\
AAQgAiADKQIUNwAMIAFBwABqQQA6AAAgA0HwAWokAAvwAwIDfwJ+IwBB8AFrIgMkACABQcAAai0AAC\
EEIAApAwAhBiADQRBqIABBEGopAgA3AwAgAyAAKQIINwMIIAEgBGoiAEGAAToAACAGQgmGIQYgBK1C\
A4YhByADIANBCGo2AhwCQCAEQT9zIgVFDQAgAEEBakEAIAUQPBoLIAcgBoQhBgJAAkAgBEE4cUE4Rg\
0AIAFBOGogBjcAACADQRxqIAEQHQwBCyADQRxqIAEQHSADQeAAakEMakIANwIAIANB4ABqQRRqQgA3\
AgAgA0HgAGpBHGpCADcCACADQeAAakEkakIANwIAIANB4ABqQSxqQgA3AgAgA0HgAGpBNGpCADcCAC\
ADQZwBakIANwIAIANCADcCZCADQcAANgJgIANBqAFqIANB4ABqQcQAEDoaIANB0ABqIANBqAFqQTRq\
KQIANwMAIANByABqIANBqAFqQSxqKQIANwMAIANBwABqIANBqAFqQSRqKQIANwMAIANBOGogA0GoAW\
pBHGopAgA3AwAgA0EwaiADQagBakEUaikCADcDACADQShqIANBqAFqQQxqKQIANwMAIAMgAykCrAE3\
AyAgAyAGNwNYIANBHGogA0EgahAdCyABQcAAakEAOgAAIAIgAykDCDcAACACIAMpAxA3AAggA0HwAW\
okAAvZAwIDfwJ+IwBB4AFrIgMkACAAKQMAIQYgASABQcAAai0AACIEaiIFQYABOgAAIANBCGogAEEQ\
aikCADcDACADIAApAgg3AwAgBkIJhiEGIAStQgOGIQcCQCAEQT9zIgBFDQAgBUEBakEAIAAQPBoLIA\
cgBoQhBgJAAkAgBEE4cUE4Rg0AIAFBOGogBjcAACADIAEQIAwBCyADIAEQICADQdAAakEMakIANwIA\
IANB0ABqQRRqQgA3AgAgA0HQAGpBHGpCADcCACADQdAAakEkakIANwIAIANB0ABqQSxqQgA3AgAgA0\
HQAGpBNGpCADcCACADQYwBakIANwIAIANCADcCVCADQcAANgJQIANBmAFqIANB0ABqQcQAEDoaIANB\
wABqIANBmAFqQTRqKQIANwMAIANBOGogA0GYAWpBLGopAgA3AwAgA0EwaiADQZgBakEkaikCADcDAC\
ADQShqIANBmAFqQRxqKQIANwMAIANBIGogA0GYAWpBFGopAgA3AwAgA0EYaiADQZgBakEMaikCADcD\
ACADIAMpApwBNwMQIAMgBjcDSCADIANBEGoQIAsgAiADKQMANwAAIAIgAykDCDcACCABQcAAakEAOg\
AAIANB4AFqJAAL1AMCBH8CfiMAQdABayIDJAAgASABQcAAai0AACIEaiIFQQE6AAAgACkDAEIJhiEH\
IAStQgOGIQgCQCAEQT9zIgZFDQAgBUEBakEAIAYQPBoLIAcgCIQhBwJAAkAgBEE4cUE4Rg0AIAFBOG\
ogBzcAACAAQQhqIAFBARAYDAELIABBCGoiBCABQQEQGCADQcAAakEMakIANwIAIANBwABqQRRqQgA3\
AgAgA0HAAGpBHGpCADcCACADQcAAakEkakIANwIAIANBwABqQSxqQgA3AgAgA0HAAGpBNGpCADcCAC\
ADQfwAakIANwIAIANCADcCRCADQcAANgJAIANBiAFqIANBwABqQcQAEDoaIANBMGogA0GIAWpBNGop\
AgA3AwAgA0EoaiADQYgBakEsaikCADcDACADQSBqIANBiAFqQSRqKQIANwMAIANBGGogA0GIAWpBHG\
opAgA3AwAgA0EQaiADQYgBakEUaikCADcDACADQQhqIANBiAFqQQxqKQIANwMAIAMgAykCjAE3AwAg\
AyAHNwM4IAQgA0EBEBgLIAFBwABqQQA6AAAgAiAAKQMINwAAIAIgAEEQaikDADcACCACIABBGGopAw\
A3ABAgA0HQAWokAAuJAwEFfwJAAkACQCABQQlJDQBBACECQc3/eyABQRAgAUEQSxsiAWsgAE0NASAB\
QRAgAEELakF4cSAAQQtJGyIDakEMahAXIgBFDQEgAEF4aiECAkACQCABQX9qIgQgAHENACACIQEMAQ\
sgAEF8aiIFKAIAIgZBeHEgBCAAakEAIAFrcUF4aiIAQQAgASAAIAJrQRBLG2oiASACayIAayEEAkAg\
BkEDcUUNACABIAEoAgRBAXEgBHJBAnI2AgQgBCABakEEaiIEIAQoAgBBAXI2AgAgBSAFKAIAQQFxIA\
ByQQJyNgIAIAAgAmpBBGoiBCAEKAIAQQFyNgIAIAIgABAhDAELIAIoAgAhAiABIAQ2AgQgASACIABq\
NgIACyABKAIEIgBBA3FFDQIgAEF4cSICIANBEGpNDQIgASAAQQFxIANyQQJyNgIEIAEgA2oiACACIA\
NrIgJBA3I2AgQgACACQQRyaiIDIAMoAgBBAXI2AgAgACACECEMAgsgABAXIQILIAIPCyABQQhqC5cD\
AQV/IwBBkARrIgMkACAAQcgBaiEEAkACQAJAAkACQCAAQfACai0AACIFRQ0AQagBIAVrIgYgAksNAS\
ABIAQgBWogBhA6IAZqIQEgAiAGayECCyACIAJBqAFuIgVBqAFsIgdJDQEgAiAHayEGAkAgBUGoAWwi\
AkUNACABIQUDQCADQeACaiAAQagBEDoaIAAQJSAFIANB4AJqQagBEDpBqAFqIQUgAkHYfmoiAg0ACw\
sCQCAGDQBBACEGDAQLIANBADYCsAEgA0GwAWpBBHJBAEGoARA8GiADQagBNgKwASADQeACaiADQbAB\
akGsARA6GiADQQhqIANB4AJqQQRyQagBEDoaIANB4AJqIABBqAEQOhogABAlIANBCGogA0HgAmpBqA\
EQOhogBkGpAU8NAiABIAdqIANBCGogBhA6GiAEIANBCGpBqAEQOhoMAwsgASAEIAVqIAIQOhogBSAC\
aiEGDAILQaGNwABBI0HEjcAAEFUACyAGQagBQcSMwAAQSwALIABB8AJqIAY6AAAgA0GQBGokAAuXAw\
EFfyMAQbADayIDJAAgAEHIAWohBAJAAkACQAJAAkAgAEHQAmotAAAiBUUNAEGIASAFayIGIAJLDQEg\
ASAEIAVqIAYQOiAGaiEBIAIgBmshAgsgAiACQYgBbiIFQYgBbCIHSQ0BIAIgB2shBgJAIAVBiAFsIg\
JFDQAgASEFA0AgA0GgAmogAEGIARA6GiAAECUgBSADQaACakGIARA6QYgBaiEFIAJB+H5qIgINAAsL\
AkAgBg0AQQAhBgwECyADQQA2ApABIANBkAFqQQRyQQBBiAEQPBogA0GIATYCkAEgA0GgAmogA0GQAW\
pBjAEQOhogA0EIaiADQaACakEEckGIARA6GiADQaACaiAAQYgBEDoaIAAQJSADQQhqIANBoAJqQYgB\
EDoaIAZBiQFPDQIgASAHaiADQQhqIAYQOhogBCADQQhqQYgBEDoaDAMLIAEgBCAFaiACEDoaIAUgAm\
ohBgwCC0GhjcAAQSNBxI3AABBVAAsgBkGIAUHEjMAAEEsACyAAQdACaiAGOgAAIANBsANqJAALggMB\
A38CQAJAAkACQCAALQBoIgNFDQACQCADQcEATw0AIAAgA2pBKGogASACQcAAIANrIgMgAyACSxsiAx\
A6GiAAIAAtAGggA2oiBDoAaCABIANqIQECQCACIANrIgINAEEAIQIMAwsgAEEIaiAAQShqIgRBwAAg\
ACkDACAALQBqIABB6QBqIgMtAABFchAaIARBAEHBABA8GiADIAMtAABBAWo6AAAMAQsgA0HAAEGQhM\
AAEEwACwJAIAJBwABLDQAgAkHAACACQcAASRshAkEAIQMMAgsgAEEIaiEFIABB6QBqIgMtAAAhBANA\
IAUgAUHAACAAKQMAIAAtAGogBEH/AXFFchAaIAMgAy0AAEEBaiIEOgAAIAFBwABqIQEgAkFAaiICQc\
AASw0ACyAALQBoIQQLIARB/wFxIgNBwQBPDQEgAkHAACADayIEIAQgAksbIQILIAAgA2pBKGogASAC\
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\
IAJBGGoQLCEBIAJBMGokACABC3QBAn8jAEGQAmsiAiQAQQAhAyACQQA2AgADQCACIANqQQRqIAEgA2\
ooAAA2AgAgA0EEaiIDQYABRw0ACyACQYABNgIAIAJBiAFqIAJBhAEQOhogACACQYgBakEEckGAARA6\
IAEtAIABOgCAASACQZACaiQAC3QBAn8jAEGgAmsiAiQAQQAhAyACQQA2AgADQCACIANqQQRqIAEgA2\
ooAAA2AgAgA0EEaiIDQYgBRw0ACyACQYgBNgIAIAJBkAFqIAJBjAEQOhogACACQZABakEEckGIARA6\
IAEtAIgBOgCIASACQaACaiQAC3QBAn8jAEHgAmsiAiQAQQAhAyACQQA2AgADQCACIANqQQRqIAEgA2\
ooAAA2AgAgA0EEaiIDQagBRw0ACyACQagBNgIAIAJBsAFqIAJBrAEQOhogACACQbABakEEckGoARA6\
IAEtAKgBOgCoASACQeACaiQAC3IBAn8jAEGgAWsiAiQAQQAhAyACQQA2AgADQCACIANqQQRqIAEgA2\
ooAAA2AgAgA0EEaiIDQcgARw0ACyACQcgANgIAIAJB0ABqIAJBzAAQOhogACACQdAAakEEckHIABA6\
IAEtAEg6AEggAkGgAWokAAtyAQJ/IwBB4AFrIgIkAEEAIQMgAkEANgIAA0AgAiADakEEaiABIANqKA\
AANgIAIANBBGoiA0HoAEcNAAsgAkHoADYCACACQfAAaiACQewAEDoaIAAgAkHwAGpBBHJB6AAQOiAB\
LQBoOgBoIAJB4AFqJAALdAECfyMAQbACayICJABBACEDIAJBADYCAANAIAIgA2pBBGogASADaigAAD\
YCACADQQRqIgNBkAFHDQALIAJBkAE2AgAgAkGYAWogAkGUARA6GiAAIAJBmAFqQQRyQZABEDogAS0A\
kAE6AJABIAJBsAJqJAALbAEBfyMAQTBrIgMkACADIAE2AgQgAyAANgIAIANBHGpBAjYCACADQSxqQQ\
M2AgAgA0ICNwIMIANByIrAADYCCCADQQM2AiQgAyADQSBqNgIYIAMgA0EEajYCKCADIAM2AiAgA0EI\
aiACEFkAC2wBAX8jAEEwayIDJAAgAyABNgIEIAMgADYCACADQRxqQQI2AgAgA0EsakEDNgIAIANCAj\
cCDCADQaiKwAA2AgggA0EDNgIkIAMgA0EgajYCGCADIANBBGo2AiggAyADNgIgIANBCGogAhBZAAts\
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\
NEJMQUtFMlNCTEFLRTNLRUNDQUstMjI0S0VDQ0FLLTI1NktFQ0NBSy0zODRLRUNDQUstNTEyTUQ0TU\
Q1UklQRU1ELTE2MFNIQS0xU0hBLTIyNFNIQS0yNTZTSEEtMzg0U0hBLTUxMlRJR0VSdW5zdXBwb3J0\
ZWQgYWxnb3JpdGhtbm9uLWRlZmF1bHQgbGVuZ3RoIHNwZWNpZmllZCBmb3Igbm9uLWV4dGVuZGFibG\
UgYWxnb3JpdGhtbGlicmFyeS9hbGxvYy9zcmMvcmF3X3ZlYy5yc2NhcGFjaXR5IG92ZXJmbG93AOYA\
EAAcAAAAMgIAAAUAAABBcnJheVZlYzogY2FwYWNpdHkgZXhjZWVkZWQgaW4gZXh0ZW5kL2Zyb21faX\
Rlcn4vLmNhcmdvL3JlZ2lzdHJ5L3NyYy9naXRodWIuY29tLTFlY2M2Mjk5ZGI5ZWM4MjMvYXJyYXl2\
ZWMtMC43LjIvc3JjL2FycmF5dmVjLnJzAFMBEABQAAAAAQQAAAUAAABUBhAATQAAAAEGAAAJAAAAfi\
8uY2FyZ28vcmVnaXN0cnkvc3JjL2dpdGh1Yi5jb20tMWVjYzYyOTlkYjllYzgyMy9ibGFrZTMtMS4z\
LjAvc3JjL2xpYi5ycwAAAMQBEABJAAAAuQEAAAkAAADEARAASQAAAF8CAAAKAAAAxAEQAEkAAACNAg\
AACQAAAMQBEABJAAAA3QIAAAoAAADEARAASQAAANYCAAAJAAAAxAEQAEkAAAABAwAAGQAAAMQBEABJ\
AAAAAwMAAAkAAADEARAASQAAAAMDAAA4AAAAxAEQAEkAAAD4AwAAMgAAAMQBEABJAAAAqgQAABYAAA\
DEARAASQAAALwEAAAWAAAAxAEQAEkAAADtBAAAEgAAAMQBEABJAAAA9wQAABIAAADEARAASQAAAGkF\
AAAhAAAAEQAAAAQAAAAEAAAAEgAAABEAAAAgAAAAAQAAABMAAAARAAAABAAAAAQAAAASAAAAfi8uY2\
FyZ28vcmVnaXN0cnkvc3JjL2dpdGh1Yi5jb20tMWVjYzYyOTlkYjllYzgyMy9hcnJheXZlYy0wLjcu\
Mi9zcmMvYXJyYXl2ZWNfaW1wbC5ycwAAACADEABVAAAAJwAAACAAAABDYXBhY2l0eUVycm9yAAAAiA\
MQAA0AAABpbnN1ZmZpY2llbnQgY2FwYWNpdHkAAACgAxAAFQAAABEAAAAAAAAAAQAAABQAAABpbmRl\
eCBvdXQgb2YgYm91bmRzOiB0aGUgbGVuIGlzICBidXQgdGhlIGluZGV4IGlzIAAA0AMQACAAAADwAx\
AAEgAAADogAACgCBAAAAAAABQEEAACAAAAKTAwMDEwMjAzMDQwNTA2MDcwODA5MTAxMTEyMTMxNDE1\
MTYxNzE4MTkyMDIxMjIyMzI0MjUyNjI3MjgyOTMwMzEzMjMzMzQzNTM2MzczODM5NDA0MTQyNDM0ND\
Q1NDY0NzQ4NDk1MDUxNTI1MzU0NTU1NjU3NTg1OTYwNjE2MjYzNjQ2NTY2Njc2ODY5NzA3MTcyNzM3\
NDc1NzY3Nzc4Nzk4MDgxODI4Mzg0ODU4Njg3ODg4OTkwOTE5MjkzOTQ5NTk2OTc5ODk5cmFuZ2Ugc3\
RhcnQgaW5kZXggIG91dCBvZiByYW5nZSBmb3Igc2xpY2Ugb2YgbGVuZ3RoIAAAAPEEEAASAAAAAwUQ\
ACIAAAByYW5nZSBlbmQgaW5kZXggOAUQABAAAAADBRAAIgAAAHNsaWNlIGluZGV4IHN0YXJ0cyBhdC\
AgYnV0IGVuZHMgYXQgAFgFEAAWAAAAbgUQAA0AAABzb3VyY2Ugc2xpY2UgbGVuZ3RoICgpIGRvZXMg\
bm90IG1hdGNoIGRlc3RpbmF0aW9uIHNsaWNlIGxlbmd0aCAojAUQABUAAAChBRAAKwAAACgEEAABAA\
AAVAYQAE0AAAAQDAAADQAAAH4vLmNhcmdvL3JlZ2lzdHJ5L3NyYy9naXRodWIuY29tLTFlY2M2Mjk5\
ZGI5ZWM4MjMvYmxvY2stYnVmZmVyLTAuMTAuMC9zcmMvbGliLnJz9AUQAFAAAAD8AAAAJwAAAC9ydX\
N0Yy9mMWVkZDA0Mjk1ODJkZDI5Y2NjYWNhZjUwZmQxMzRiMDU1OTNiZDljL2xpYnJhcnkvY29yZS9z\
cmMvc2xpY2UvbW9kLnJzYXNzZXJ0aW9uIGZhaWxlZDogbWlkIDw9IHNlbGYubGVuKClUBhAATQAAAB\
8GAAAJAAAAAAAAAAEjRWeJq83v/ty6mHZUMhDw4dLDAAAAAGfmCWqFrme7cvNuPDr1T6V/Ug5RjGgF\
m6vZgx8ZzeBb2J4FwQfVfDYX3XAwOVkO9zELwP8RFVhop4/5ZKRP+r4IybzzZ+YJajunyoSFrme7K/\
iU/nLzbjzxNh1fOvVPpdGC5q1/Ug5RH2w+K4xoBZtrvUH7q9mDH3khfhMZzeBb2J4FwV2du8sH1Xw2\
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\
7K2QVDo6BtknPCsAv6IwgISjrn7AAyDtbTICxoZAqWl9KKeDinr1MMtfesV55+t55ERotem83AUPtH\
Oj4g5XiG54Gteg9ui9zbqchy+jZMG80WqXi9dmll7iIas8w+XlqmMQkJCNaUhEsxiYu4oePq6HZOO0\
3DuJMfm9rxnVu1/coEVjymWUmyb+KIbsUZw/YAFdHrdJUKEGQORNsct29+VwbL/tK1Xv8hgSQaM2Wn\
AIBwzLRGCYT3UUTecOKKgOQ9lWzWVQX1PXkSXBlu8KcvEjMsgfpWNzbzmgw251bGwgcG9pbnRlciBw\
YXNzZWQgdG8gcnVzdHJlY3Vyc2l2ZSB1c2Ugb2YgYW4gb2JqZWN0IGRldGVjdGVkIHdoaWNoIHdvdW\
xkIGxlYWQgdG8gdW5zYWZlIGFsaWFzaW5nIGluIHJ1c3QAAAQAAAAAAAAAQAAAACAAAAAwAAAAIAAA\
ACAAAAAcAAAAIAAAADAAAABAAAAAEAAAABAAAAAUAAAAFAAAABwAAAAgAAAAMAAAAEAAAAAcAAAAIA\
AAADAAAABAAAAAIAAAAEAAAAAYAAAAQAAAACAAAAAwAAAAIAAAACAAAAAcAAAAIAAAADAAAABAAAAA\
EAAAABAAAAAUAAAAFAAAABwAAAAgAAAAMAAAAEAAAAAcAAAAIAAAADAAAABAAAAAIAAAAEAAAAAYAA\
AAALq4gIAABG5hbWUBr7iAgAB5AEVqc19zeXM6OlR5cGVFcnJvcjo6bmV3OjpfX3diZ19uZXdfYTRi\
NjFhMGY1NDgyNGNmZDo6aGQwZmM0NjMyMGI3ZGQ5OWEBO3dhc21fYmluZGdlbjo6X193YmluZGdlbl\
9vYmplY3RfZHJvcF9yZWY6OmhkZGYxZjhlODllMjczZjBkAlVqc19zeXM6OlVpbnQ4QXJyYXk6OmJ5\
dGVfbGVuZ3RoOjpfX3diZ19ieXRlTGVuZ3RoXzNlMjUwYjQxYTg5MTU3NTc6Omg1ZGQ4ZjQyMDFmYT\
A0NGU2A1Vqc19zeXM6OlVpbnQ4QXJyYXk6OmJ5dGVfb2Zmc2V0OjpfX3diZ19ieXRlT2Zmc2V0XzQy\
MDRlY2IyNGE2ZTVkZjk6Omg2MDEyMWZmY2ViMDUyYjQ4BExqc19zeXM6OlVpbnQ4QXJyYXk6OmJ1Zm\
Zlcjo6X193YmdfYnVmZmVyX2ZhY2YwMzk4YTI4MWM4NWI6OmhiMDZhZjNlYzc5OTA3ZWY2BXlqc19z\
eXM6OlVpbnQ4QXJyYXk6Om5ld193aXRoX2J5dGVfb2Zmc2V0X2FuZF9sZW5ndGg6Ol9fd2JnX25ld3\
dpdGhieXRlb2Zmc2V0YW5kbGVuZ3RoXzRiOWI4YzRlM2Y1YWRiZmY6OmgwNzFlZmZhMTYwOTM5NjJj\
Bkxqc19zeXM6OlVpbnQ4QXJyYXk6Omxlbmd0aDo6X193YmdfbGVuZ3RoXzFlYjhmYzYwOGEwZDRjZG\
I6Omg4NjE2OGQxNDEzMTJkOWQ3BzJ3YXNtX2JpbmRnZW46Ol9fd2JpbmRnZW5fbWVtb3J5OjpoNzA2\
NmYxYTQ1YzJkNzg4YQhVanNfc3lzOjpXZWJBc3NlbWJseTo6TWVtb3J5OjpidWZmZXI6Ol9fd2JnX2\
J1ZmZlcl8zOTdlYWE0ZDcyZWU5NGRkOjpoOGVjMDRmOWE1ZDgzYjZhMwlGanNfc3lzOjpVaW50OEFy\
cmF5OjpuZXc6Ol9fd2JnX25ld19hN2NlNDQ3ZjE1ZmY0OTZmOjpoYjNiYTQwNGE1ZDgzYjNkMgpGan\
Nfc3lzOjpVaW50OEFycmF5OjpzZXQ6Ol9fd2JnX3NldF85NjlhZDBhNjBlNTFkMzIwOjpoODQyYjZh\
YjRkODFiN2ZkYwsxd2FzbV9iaW5kZ2VuOjpfX3diaW5kZ2VuX3Rocm93OjpoYjNjZDc3YTExYWFhMD\
UwMgwzd2FzbV9iaW5kZ2VuOjpfX3diaW5kZ2VuX3JldGhyb3c6OmgxYjVhNzgwMjNiZTU0MzExDUBk\
ZW5vX3N0ZF93YXNtX2NyeXB0bzo6ZGlnZXN0OjpDb250ZXh0OjpkaWdlc3Q6OmgyYmNjMTg3MGQ5YW\
IzODNjDixzaGEyOjpzaGE1MTI6OmNvbXByZXNzNTEyOjpoNmIxMGMzM2FkMDVjMzVmNg9KZGVub19z\
dGRfd2FzbV9jcnlwdG86OmRpZ2VzdDo6Q29udGV4dDo6ZGlnZXN0X2FuZF9yZXNldDo6aDQ0ZjRiNj\
M5NjUyZDdlMTcQQGRlbm9fc3RkX3dhc21fY3J5cHRvOjpkaWdlc3Q6OkNvbnRleHQ6OnVwZGF0ZTo6\
aGUwZjdjN2YyMmZjYjkzYTIRLHNoYTI6OnNoYTI1Njo6Y29tcHJlc3MyNTY6OmhlODc4MDI5Y2NmZG\
QzZGY0EjNibGFrZTI6OkJsYWtlMmJWYXJDb3JlOjpjb21wcmVzczo6aDlmODdhNzZhOGZiZWUyMmIT\
KXJpcGVtZDo6YzE2MDo6Y29tcHJlc3M6OmgxODljNDc5ZmJkNjdhZmFkFDNibGFrZTI6OkJsYWtlMn\
NWYXJDb3JlOjpjb21wcmVzczo6aDlkZGE5YzJhMmI2MTc2ODkVK3NoYTE6OmNvbXByZXNzOjpjb21w\
cmVzczo6aDUwZTVkODNlOTFkNjU0YWEWO2Rlbm9fc3RkX3dhc21fY3J5cHRvOjpEaWdlc3RDb250ZX\
h0OjpuZXc6Omg4NTJmMGUyNTRkYTI0NDJhFzpkbG1hbGxvYzo6ZGxtYWxsb2M6OkRsbWFsbG9jPEE+\
OjptYWxsb2M6OmgyYTI3MjA3ZWU5YWY3ZmU5GCx0aWdlcjo6Y29tcHJlc3M6OmNvbXByZXNzOjpoNm\
QyNThmYmY3NTQ4YmZlMRktYmxha2UzOjpPdXRwdXRSZWFkZXI6OmZpbGw6OmhhOWMyNzBjOWI3ZmY0\
MWVlGjZibGFrZTM6OnBvcnRhYmxlOjpjb21wcmVzc19pbl9wbGFjZTo6aGM0YWQ3NDc3Y2JmNTJmMG\
UbE2RpZ2VzdGNvbnRleHRfY2xvbmUcZTxkaWdlc3Q6OmNvcmVfYXBpOjp3cmFwcGVyOjpDb3JlV3Jh\
cHBlcjxUPiBhcyBkaWdlc3Q6OlVwZGF0ZT46OnVwZGF0ZTo6e3tjbG9zdXJlfX06OmhlMWZhYWExOW\
M5MTM0ODllHWg8bWQ1OjpNZDVDb3JlIGFzIGRpZ2VzdDo6Y29yZV9hcGk6OkZpeGVkT3V0cHV0Q29y\
ZT46OmZpbmFsaXplX2ZpeGVkX2NvcmU6Ont7Y2xvc3VyZX19OjpoNTZjODcxYTc1MGM1MTgwZB4wYm\
xha2UzOjpjb21wcmVzc19zdWJ0cmVlX3dpZGU6Omg5OTVmOTJhMDk5ZDk4NjM0HzhkbG1hbGxvYzo6\
ZGxtYWxsb2M6OkRsbWFsbG9jPEE+OjpmcmVlOjpoY2I3OTQ3YTlhN2UyODJjYSAgbWQ0Ojpjb21wcm\
Vzczo6aDkwZDU0MDM2Y2E2MzNlM2MhQWRsbWFsbG9jOjpkbG1hbGxvYzo6RGxtYWxsb2M8QT46OmRp\
c3Bvc2VfY2h1bms6OmgyZjkwYmRkZmFiOWZkYWY5IhNkaWdlc3Rjb250ZXh0X3Jlc2V0I3I8c2hhMj\
o6Y29yZV9hcGk6OlNoYTUxMlZhckNvcmUgYXMgZGlnZXN0Ojpjb3JlX2FwaTo6VmFyaWFibGVPdXRw\
dXRDb3JlPjo6ZmluYWxpemVfdmFyaWFibGVfY29yZTo6aDllYTRhMjE1OGUwNzAzM2IkL2JsYWtlMz\
o6SGFzaGVyOjpmaW5hbGl6ZV94b2Y6OmhiODgzZTZjNWM0ZTVkNDBiJSBrZWNjYWs6OmYxNjAwOjpo\
YTgyNTc5MGNmMjVhNWY1ZSYsY29yZTo6Zm10OjpGb3JtYXR0ZXI6OnBhZDo6aDQ5ZDJjZmNjYWZiYm\
RlNGQnDl9fcnVzdF9yZWFsbG9jKHI8c2hhMjo6Y29yZV9hcGk6OlNoYTI1NlZhckNvcmUgYXMgZGln\
ZXN0Ojpjb3JlX2FwaTo6VmFyaWFibGVPdXRwdXRDb3JlPjo6ZmluYWxpemVfdmFyaWFibGVfY29yZT\
o6aDAzYTkzMGI4Yzc0YzllZDUpXTxzaGExOjpTaGExQ29yZSBhcyBkaWdlc3Q6OmNvcmVfYXBpOjpG\
aXhlZE91dHB1dENvcmU+OjpmaW5hbGl6ZV9maXhlZF9jb3JlOjpoYjVkOWVjNzAyNDhlMTgyMCoxYm\
xha2UzOjpIYXNoZXI6Om1lcmdlX2N2X3N0YWNrOjpoNDdiNmUyNGU2N2UyMTY1Yis1Y29yZTo6Zm10\
OjpGb3JtYXR0ZXI6OnBhZF9pbnRlZ3JhbDo6aGM2Njk0N2IxZGVkNTc4YWEsI2NvcmU6OmZtdDo6d3\
JpdGU6OmhiYmFmMzlmMDliZjQ5ZWZiLTRibGFrZTM6OmNvbXByZXNzX3BhcmVudHNfcGFyYWxsZWw6\
OmhhMDczMmZhY2IxMjc2OWJiLmQ8cmlwZW1kOjpSaXBlbWQxNjBDb3JlIGFzIGRpZ2VzdDo6Y29yZV\
9hcGk6OkZpeGVkT3V0cHV0Q29yZT46OmZpbmFsaXplX2ZpeGVkX2NvcmU6OmhkZThmYzJhZjcxMWYx\
ODVmL1s8bWQ1OjpNZDVDb3JlIGFzIGRpZ2VzdDo6Y29yZV9hcGk6OkZpeGVkT3V0cHV0Q29yZT46Om\
ZpbmFsaXplX2ZpeGVkX2NvcmU6OmgwYjMwMDNlNDg0MjlhYzNkMFs8bWQ0OjpNZDRDb3JlIGFzIGRp\
Z2VzdDo6Y29yZV9hcGk6OkZpeGVkT3V0cHV0Q29yZT46OmZpbmFsaXplX2ZpeGVkX2NvcmU6OmgzZT\
JiMzAwNzMwYWE4YWYwMV88dGlnZXI6OlRpZ2VyQ29yZSBhcyBkaWdlc3Q6OmNvcmVfYXBpOjpGaXhl\
ZE91dHB1dENvcmU+OjpmaW5hbGl6ZV9maXhlZF9jb3JlOjpoNDU3M2E0MGViYzU0Y2E1MzIwZGxtYW\
xsb2M6OkRsbWFsbG9jPEE+OjptYWxsb2M6OmgxODlmYmNhMDM3M2FiODI4M2U8ZGlnZXN0Ojpjb3Jl\
X2FwaTo6eG9mX3JlYWRlcjo6WG9mUmVhZGVyQ29yZVdyYXBwZXI8VD4gYXMgZGlnZXN0OjpYb2ZSZW\
FkZXI+OjpyZWFkOjpoOGE2ZDliYzFkOGM4YTc0NTRlPGRpZ2VzdDo6Y29yZV9hcGk6OnhvZl9yZWFk\
ZXI6OlhvZlJlYWRlckNvcmVXcmFwcGVyPFQ+IGFzIGRpZ2VzdDo6WG9mUmVhZGVyPjo6cmVhZDo6aD\
c0YzJhMGFkMGJjOGFmODU1LWJsYWtlMzo6Q2h1bmtTdGF0ZTo6dXBkYXRlOjpoYzU4OGE4Y2Q3YzI2\
Y2VmNTYvY29yZTo6Zm10OjpudW06OmltcDo6Zm10X3U2NDo6aDY2MjhhM2U3MjI3ZTg1NTM3BmRpZ2\
VzdDg+ZGVub19zdGRfd2FzbV9jcnlwdG86OkRpZ2VzdENvbnRleHQ6OnVwZGF0ZTo6aGJkOTQ0YWQ2\
M2Y2MjlkYTE5WzxibG9ja19idWZmZXI6OkJsb2NrQnVmZmVyPEJsb2NrU2l6ZSxLaW5kPiBhcyBjb3\
JlOjpjbG9uZTo6Q2xvbmU+OjpjbG9uZTo6aDFlNjc5OGM0NDQwOWIxM2M6Bm1lbWNweTsbZGlnZXN0\
Y29udGV4dF9kaWdlc3RBbmREcm9wPAZtZW1zZXQ9P3dhc21fYmluZGdlbjo6Y29udmVydDo6Y2xvc3\
VyZXM6Omludm9rZTNfbXV0OjpoNGE4M2FkMzFhZDllYjlkOT4UZGlnZXN0Y29udGV4dF9kaWdlc3Q/\
LWpzX3N5czo6VWludDhBcnJheTo6dG9fdmVjOjpoNmVhOWI5MWQ1MjIzZGJiZEAcZGlnZXN0Y29udG\
V4dF9kaWdlc3RBbmRSZXNldEERZGlnZXN0Y29udGV4dF9uZXdCLmNvcmU6OnJlc3VsdDo6dW53cmFw\
X2ZhaWxlZDo6aGQ1ODRlZmI3Yjg0YmYzMjZDUDxhcnJheXZlYzo6ZXJyb3JzOjpDYXBhY2l0eUVycm\
9yPFQ+IGFzIGNvcmU6OmZtdDo6RGVidWc+OjpmbXQ6Omg4Y2EzNjljOTgxMGMyMjI5RFA8YXJyYXl2\
ZWM6OmVycm9yczo6Q2FwYWNpdHlFcnJvcjxUPiBhcyBjb3JlOjpmbXQ6OkRlYnVnPjo6Zm10OjpoYW\
JkMmI2NDNkZDBlY2QyY0VbPGJsb2NrX2J1ZmZlcjo6QmxvY2tCdWZmZXI8QmxvY2tTaXplLEtpbmQ+\
IGFzIGNvcmU6OmNsb25lOjpDbG9uZT46OmNsb25lOjpoMzFiOWEwZGUxMGRmODY4OUZbPGJsb2NrX2\
J1ZmZlcjo6QmxvY2tCdWZmZXI8QmxvY2tTaXplLEtpbmQ+IGFzIGNvcmU6OmNsb25lOjpDbG9uZT46\
OmNsb25lOjpoNmQ1ZmZjMTIxNjVhNDVlZkdbPGJsb2NrX2J1ZmZlcjo6QmxvY2tCdWZmZXI8QmxvY2\
tTaXplLEtpbmQ+IGFzIGNvcmU6OmNsb25lOjpDbG9uZT46OmNsb25lOjpoZTQ1NzhiZDExMWQ2NDYw\
N0hbPGJsb2NrX2J1ZmZlcjo6QmxvY2tCdWZmZXI8QmxvY2tTaXplLEtpbmQ+IGFzIGNvcmU6OmNsb2\
5lOjpDbG9uZT46OmNsb25lOjpoNzY2ZWMwMWYwODU4YjU3OElbPGJsb2NrX2J1ZmZlcjo6QmxvY2tC\
dWZmZXI8QmxvY2tTaXplLEtpbmQ+IGFzIGNvcmU6OmNsb25lOjpDbG9uZT46OmNsb25lOjpoMzg2Nz\
U4YmUyNWRiYzlmYUpbPGJsb2NrX2J1ZmZlcjo6QmxvY2tCdWZmZXI8QmxvY2tTaXplLEtpbmQ+IGFz\
IGNvcmU6OmNsb25lOjpDbG9uZT46OmNsb25lOjpoMzhlMzdmZDQxYjU4ZTJmNks/Y29yZTo6c2xpY2\
U6OmluZGV4OjpzbGljZV9lbmRfaW5kZXhfbGVuX2ZhaWw6OmhjM2UwZGNmNmQ4NjZlMWJlTEFjb3Jl\
OjpzbGljZTo6aW5kZXg6OnNsaWNlX3N0YXJ0X2luZGV4X2xlbl9mYWlsOjpoNmMxMDlhYzg1ODdmMj\
kxMU09Y29yZTo6c2xpY2U6OmluZGV4OjpzbGljZV9pbmRleF9vcmRlcl9mYWlsOjpoZDI3ZGMzODVh\
N2VjMTNjMU5OY29yZTo6c2xpY2U6OjxpbXBsIFtUXT46OmNvcHlfZnJvbV9zbGljZTo6bGVuX21pc2\
1hdGNoX2ZhaWw6OmhlZGQxMGM1YmNjMDI2MTBjTzZjb3JlOjpwYW5pY2tpbmc6OnBhbmljX2JvdW5k\
c19jaGVjazo6aGNlMDUwMmY2MzcxMWZhZDhQN3N0ZDo6cGFuaWNraW5nOjpydXN0X3BhbmljX3dpdG\
hfaG9vazo6aDYwNmQ3YzdmN2E0MjNiOThROmJsYWtlMjo6Qmxha2UyYlZhckNvcmU6Om5ld193aXRo\
X3BhcmFtczo6aDU4N2Y5YTcyNzlmMzcxNmRSGF9fd2JnX2RpZ2VzdGNvbnRleHRfZnJlZVMGbWVtY2\
1wVENjb3JlOjpmbXQ6OkZvcm1hdHRlcjo6cGFkX2ludGVncmFsOjp3cml0ZV9wcmVmaXg6OmhhYTBh\
ZGYwMGNiNjdkZWQ3VSljb3JlOjpwYW5pY2tpbmc6OnBhbmljOjpoZWMxZmMwNTdiZDBiYWYwYlYUZG\
lnZXN0Y29udGV4dF91cGRhdGVXEV9fd2JpbmRnZW5fbWFsbG9jWDpibGFrZTI6OkJsYWtlMnNWYXJD\
b3JlOjpuZXdfd2l0aF9wYXJhbXM6Omg1ZmY0NTlmMjMxYWI4ZDY4WS1jb3JlOjpwYW5pY2tpbmc6On\
BhbmljX2ZtdDo6aDYzMTRiNWM5MWFiZTczNDlaP3dhc21fYmluZGdlbjo6Y29udmVydDo6Y2xvc3Vy\
ZXM6Omludm9rZTRfbXV0OjpoMGRhMGY0NDM1YWYyZTNlYVs/d2FzbV9iaW5kZ2VuOjpjb252ZXJ0Oj\
pjbG9zdXJlczo6aW52b2tlM19tdXQ6OmgwMDg1MjE2YzlhMTJhZWRmXD93YXNtX2JpbmRnZW46OmNv\
bnZlcnQ6OmNsb3N1cmVzOjppbnZva2UzX211dDo6aDNmMGUyMmI1ODczODUwMDZdP3dhc21fYmluZG\
dlbjo6Y29udmVydDo6Y2xvc3VyZXM6Omludm9rZTNfbXV0OjpoMzJlNGU5MGYwYzA4MjM5MF4/d2Fz\
bV9iaW5kZ2VuOjpjb252ZXJ0OjpjbG9zdXJlczo6aW52b2tlM19tdXQ6OmhiNWQ0MWNhNmRjZDZiMz\
Q4Xz93YXNtX2JpbmRnZW46OmNvbnZlcnQ6OmNsb3N1cmVzOjppbnZva2UzX211dDo6aDczZGIzMGMw\
OGZiNWJjZDBgP3dhc21fYmluZGdlbjo6Y29udmVydDo6Y2xvc3VyZXM6Omludm9rZTNfbXV0OjpoOT\
k0MDdiYzUzNzNkMzBmOWE/d2FzbV9iaW5kZ2VuOjpjb252ZXJ0OjpjbG9zdXJlczo6aW52b2tlM19t\
dXQ6OmhmODAzN2M3ZmFjMTc4MDllYj93YXNtX2JpbmRnZW46OmNvbnZlcnQ6OmNsb3N1cmVzOjppbn\
Zva2UyX211dDo6aDkxMTRjMzZhYmJlNDBmNzljQ3N0ZDo6cGFuaWNraW5nOjpiZWdpbl9wYW5pY19o\
YW5kbGVyOjp7e2Nsb3N1cmV9fTo6aDliOTg1YTI5M2FhYzRjZTFkEl9fd2JpbmRnZW5fcmVhbGxvY2\
U/d2FzbV9iaW5kZ2VuOjpjb252ZXJ0OjpjbG9zdXJlczo6aW52b2tlMV9tdXQ6OmhkMWIyODM5MTNl\
Y2RiMGQxZjJjb3JlOjpvcHRpb246Ok9wdGlvbjxUPjo6dW53cmFwOjpoNWE3ZGY5MWI1ZDYwOTBjYm\
cwPCZUIGFzIGNvcmU6OmZtdDo6RGVidWc+OjpmbXQ6OmgwZDljZDYyNmRhYmFhMWVmaDI8JlQgYXMg\
Y29yZTo6Zm10OjpEaXNwbGF5Pjo6Zm10OjpoZDMwM2JjMTZhZWU1NTkxMGkRcnVzdF9iZWdpbl91bn\
dpbmRqD19fd2JpbmRnZW5fZnJlZWs0YWxsb2M6OnJhd192ZWM6OmNhcGFjaXR5X292ZXJmbG93Ojpo\
NGI0OTAxNDgzMGNhZmU2M2wzYXJyYXl2ZWM6OmFycmF5dmVjOjpleHRlbmRfcGFuaWM6OmgzN2Q1OT\
hkNzVkMGQyZTZmbTljb3JlOjpvcHM6OmZ1bmN0aW9uOjpGbk9uY2U6OmNhbGxfb25jZTo6aDJhYjg2\
NzY3ZWMxN2M1MGRuH19fd2JpbmRnZW5fYWRkX3RvX3N0YWNrX3BvaW50ZXJvTmNvcmU6OmZtdDo6bn\
VtOjppbXA6OjxpbXBsIGNvcmU6OmZtdDo6RGlzcGxheSBmb3IgdTMyPjo6Zm10OjpoMDQ2ZWNjNWVh\
YWIzNGNkNXAxd2FzbV9iaW5kZ2VuOjpfX3J0Ojp0aHJvd19udWxsOjpoZGE3OGMxMGZhOTdiYTRjOH\
Eyd2FzbV9iaW5kZ2VuOjpfX3J0Ojpib3Jyb3dfZmFpbDo6aDU0MzNjYzM4Zjk0MTk1ZmZyKndhc21f\
YmluZGdlbjo6dGhyb3dfc3RyOjpoYTdhZjVhZTY3MjEyZjIxYXNJc3RkOjpzeXNfY29tbW9uOjpiYW\
NrdHJhY2U6Ol9fcnVzdF9lbmRfc2hvcnRfYmFja3RyYWNlOjpoYTAzYWJlZjAyYThiNzBmZHQqd2Fz\
bV9iaW5kZ2VuOjp0aHJvd192YWw6OmgwNWYxN2ZkOTc3Nzc3YjlkdTE8VCBhcyBjb3JlOjphbnk6Ok\
FueT46OnR5cGVfaWQ6OmhhMGM0NDkyMjE2ZDRkMmU3dgpydXN0X3BhbmljdzdzdGQ6OmFsbG9jOjpk\
ZWZhdWx0X2FsbG9jX2Vycm9yX2hvb2s6OmhmOWMzOTNiYTNjZDI4N2UxeG9jb3JlOjpwdHI6OmRyb3\
BfaW5fcGxhY2U8JmNvcmU6Oml0ZXI6OmFkYXB0ZXJzOjpjb3BpZWQ6OkNvcGllZDxjb3JlOjpzbGlj\
ZTo6aXRlcjo6SXRlcjx1OD4+Pjo6aDYzYzJlMTQ5N2I1MmYzZDcA74CAgAAJcHJvZHVjZXJzAghsYW\
5ndWFnZQEEUnVzdAAMcHJvY2Vzc2VkLWJ5AwVydXN0Yx0xLjU3LjAgKGYxZWRkMDQyOSAyMDIxLTEx\
LTI5KQZ3YWxydXMGMC4xOS4wDHdhc20tYmluZGdlbgYwLjIuNzg=\
",
);
const heap = new Array(32).fill(undefined);
heap.push(undefined, null, true, false);
function getObject(idx) {
	return heap[idx];
}
let heap_next = heap.length;
function dropObject(idx) {
	if (idx < 36) return;
	heap[idx] = heap_next;
	heap_next = idx;
}
function takeObject(idx) {
	const ret = getObject(idx);
	dropObject(idx);
	return ret;
}
function addHeapObject(obj) {
	if (heap_next === heap.length) heap.push(heap.length + 1);
	const idx = heap_next;
	heap_next = heap[idx];
	heap[idx] = obj;
	return idx;
}
let cachedTextDecoder = new TextDecoder("utf-8", {
	ignoreBOM: true,
	fatal: true,
});
cachedTextDecoder.decode();
let cachegetUint8Memory0 = null;
function getUint8Memory0() {
	if (
		cachegetUint8Memory0 === null ||
		cachegetUint8Memory0.buffer !== wasm.memory.buffer
	) {
		cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
	}
	return cachegetUint8Memory0;
}
function getStringFromWasm0(ptr, len) {
	return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}
let WASM_VECTOR_LEN = 0;
let cachedTextEncoder = new TextEncoder("utf-8");
const encodeString = function (arg, view) {
	return cachedTextEncoder.encodeInto(arg, view);
};
function passStringToWasm0(arg, malloc, realloc) {
	if (realloc === undefined) {
		const buf = cachedTextEncoder.encode(arg);
		const ptr = malloc(buf.length);
		getUint8Memory0()
			.subarray(ptr, ptr + buf.length)
			.set(buf);
		WASM_VECTOR_LEN = buf.length;
		return ptr;
	}
	let len = arg.length;
	let ptr1 = malloc(len);
	const mem = getUint8Memory0();
	let offset = 0;
	for (; offset < len; offset++) {
		const code = arg.charCodeAt(offset);
		if (code > 0x7F) break;
		mem[ptr1 + offset] = code;
	}
	if (offset !== len) {
		if (offset !== 0) {
			arg = arg.slice(offset);
		}
		ptr1 = realloc(ptr1, len, (len = offset + arg.length * 3));
		const view = getUint8Memory0().subarray(ptr1 + offset, ptr1 + len);
		const ret = encodeString(arg, view);
		offset += ret.written;
	}
	WASM_VECTOR_LEN = offset;
	return ptr1;
}
function isLikeNone(x) {
	return x === undefined || x === null;
}
let cachegetInt32Memory0 = null;
function getInt32Memory0() {
	if (
		cachegetInt32Memory0 === null ||
		cachegetInt32Memory0.buffer !== wasm.memory.buffer
	) {
		cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
	}
	return cachegetInt32Memory0;
}
function getArrayU8FromWasm0(ptr, len) {
	return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}
function digest(algorithm, data, length) {
	try {
		const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
		var ptr0 = passStringToWasm0(
			algorithm,
			wasm.__wbindgen_malloc,
			wasm.__wbindgen_realloc,
		);
		var len0 = WASM_VECTOR_LEN;
		wasm.digest(
			retptr,
			ptr0,
			len0,
			addHeapObject(data),
			!isLikeNone(length),
			isLikeNone(length) ? 0 : length,
		);
		var r0 = getInt32Memory0()[retptr / 4 + 0];
		var r1 = getInt32Memory0()[retptr / 4 + 1];
		var v1 = getArrayU8FromWasm0(r0, r1).slice();
		wasm.__wbindgen_free(r0, r1 * 1);
		return v1;
	} finally {
		wasm.__wbindgen_add_to_stack_pointer(16);
	}
}
const DigestContextFinalization = new FinalizationRegistry(
	(ptr) => wasm.__wbg_digestcontext_free(ptr),
);
class DigestContext {
	static __wrap(ptr) {
		const obj = Object.create(DigestContext.prototype);
		obj.ptr = ptr;
		DigestContextFinalization.register(obj, obj.ptr, obj);
		return obj;
	}
	__destroy_into_raw() {
		const ptr = this.ptr;
		this.ptr = 0;
		DigestContextFinalization.unregister(this);
		return ptr;
	}
	free() {
		const ptr = this.__destroy_into_raw();
		wasm.__wbg_digestcontext_free(ptr);
	}
	constructor(algorithm) {
		var ptr0 = passStringToWasm0(
			algorithm,
			wasm.__wbindgen_malloc,
			wasm.__wbindgen_realloc,
		);
		var len0 = WASM_VECTOR_LEN;
		var ret = wasm.digestcontext_new(ptr0, len0);
		return DigestContext.__wrap(ret);
	}
	update(data) {
		wasm.digestcontext_update(this.ptr, addHeapObject(data));
	}
	digest(length) {
		try {
			const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
			wasm.digestcontext_digest(
				retptr,
				this.ptr,
				!isLikeNone(length),
				isLikeNone(length) ? 0 : length,
			);
			var r0 = getInt32Memory0()[retptr / 4 + 0];
			var r1 = getInt32Memory0()[retptr / 4 + 1];
			var v0 = getArrayU8FromWasm0(r0, r1).slice();
			wasm.__wbindgen_free(r0, r1 * 1);
			return v0;
		} finally {
			wasm.__wbindgen_add_to_stack_pointer(16);
		}
	}
	digestAndReset(length) {
		try {
			const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
			wasm.digestcontext_digestAndReset(
				retptr,
				this.ptr,
				!isLikeNone(length),
				isLikeNone(length) ? 0 : length,
			);
			var r0 = getInt32Memory0()[retptr / 4 + 0];
			var r1 = getInt32Memory0()[retptr / 4 + 1];
			var v0 = getArrayU8FromWasm0(r0, r1).slice();
			wasm.__wbindgen_free(r0, r1 * 1);
			return v0;
		} finally {
			wasm.__wbindgen_add_to_stack_pointer(16);
		}
	}
	digestAndDrop(length) {
		try {
			const ptr = this.__destroy_into_raw();
			const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
			wasm.digestcontext_digestAndDrop(
				retptr,
				ptr,
				!isLikeNone(length),
				isLikeNone(length) ? 0 : length,
			);
			var r0 = getInt32Memory0()[retptr / 4 + 0];
			var r1 = getInt32Memory0()[retptr / 4 + 1];
			var v0 = getArrayU8FromWasm0(r0, r1).slice();
			wasm.__wbindgen_free(r0, r1 * 1);
			return v0;
		} finally {
			wasm.__wbindgen_add_to_stack_pointer(16);
		}
	}
	reset() {
		wasm.digestcontext_reset(this.ptr);
	}
	clone() {
		var ret = wasm.digestcontext_clone(this.ptr);
		return DigestContext.__wrap(ret);
	}
}
const imports = {
	__wbindgen_placeholder__: {
		__wbg_new_a4b61a0f54824cfd: function (arg0, arg1) {
			var ret = new TypeError(getStringFromWasm0(arg0, arg1));
			return addHeapObject(ret);
		},
		__wbindgen_object_drop_ref: function (arg0) {
			takeObject(arg0);
		},
		__wbg_byteLength_3e250b41a8915757: function (arg0) {
			var ret = getObject(arg0).byteLength;
			return ret;
		},
		__wbg_byteOffset_4204ecb24a6e5df9: function (arg0) {
			var ret = getObject(arg0).byteOffset;
			return ret;
		},
		__wbg_buffer_facf0398a281c85b: function (arg0) {
			var ret = getObject(arg0).buffer;
			return addHeapObject(ret);
		},
		__wbg_newwithbyteoffsetandlength_4b9b8c4e3f5adbff: function (
			arg0,
			arg1,
			arg2,
		) {
			var ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
			return addHeapObject(ret);
		},
		__wbg_length_1eb8fc608a0d4cdb: function (arg0) {
			var ret = getObject(arg0).length;
			return ret;
		},
		__wbindgen_memory: function () {
			var ret = wasm.memory;
			return addHeapObject(ret);
		},
		__wbg_buffer_397eaa4d72ee94dd: function (arg0) {
			var ret = getObject(arg0).buffer;
			return addHeapObject(ret);
		},
		__wbg_new_a7ce447f15ff496f: function (arg0) {
			var ret = new Uint8Array(getObject(arg0));
			return addHeapObject(ret);
		},
		__wbg_set_969ad0a60e51d320: function (arg0, arg1, arg2) {
			getObject(arg0).set(getObject(arg1), arg2 >>> 0);
		},
		__wbindgen_throw: function (arg0, arg1) {
			throw new Error(getStringFromWasm0(arg0, arg1));
		},
		__wbindgen_rethrow: function (arg0) {
			throw takeObject(arg0);
		},
	},
};
const wasmModule = new WebAssembly.Module(data);
const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
const wasm = wasmInstance.exports;
const _wasm = wasm;
const _wasmModule = wasmModule;
const _wasmInstance = wasmInstance;
const mod3 = {
	digest: digest,
	DigestContext: DigestContext,
	_wasm: _wasm,
	_wasmModule: _wasmModule,
	_wasmInstance: _wasmInstance,
	_wasmBytes: data,
};
const digestAlgorithms = [
	"BLAKE2B-256",
	"BLAKE2B-384",
	"BLAKE2B",
	"BLAKE2S",
	"BLAKE3",
	"KECCAK-224",
	"KECCAK-256",
	"KECCAK-384",
	"KECCAK-512",
	"SHA-384",
	"SHA3-224",
	"SHA3-256",
	"SHA3-384",
	"SHA3-512",
	"SHAKE128",
	"SHAKE256",
	"TIGER",
	"RIPEMD-160",
	"SHA-224",
	"SHA-256",
	"SHA-512",
	"MD4",
	"MD5",
	"SHA-1",
];
const webCrypto = ((crypto1) => ({
	getRandomValues: crypto1.getRandomValues?.bind(crypto1),
	randomUUID: crypto1.randomUUID?.bind(crypto1),
	subtle: {
		decrypt: crypto1.subtle?.decrypt?.bind(crypto1.subtle),
		deriveBits: crypto1.subtle?.deriveBits?.bind(crypto1.subtle),
		deriveKey: crypto1.subtle?.deriveKey?.bind(crypto1.subtle),
		digest: crypto1.subtle?.digest?.bind(crypto1.subtle),
		encrypt: crypto1.subtle?.encrypt?.bind(crypto1.subtle),
		exportKey: crypto1.subtle?.exportKey?.bind(crypto1.subtle),
		generateKey: crypto1.subtle?.generateKey?.bind(crypto1.subtle),
		importKey: crypto1.subtle?.importKey?.bind(crypto1.subtle),
		sign: crypto1.subtle?.sign?.bind(crypto1.subtle),
		unwrapKey: crypto1.subtle?.unwrapKey?.bind(crypto1.subtle),
		verify: crypto1.subtle?.verify?.bind(crypto1.subtle),
		wrapKey: crypto1.subtle?.wrapKey?.bind(crypto1.subtle),
	},
}))(globalThis.crypto);
const bufferSourceBytes = (data) => {
	let bytes;
	if (data instanceof Uint8Array) {
		bytes = data;
	} else if (ArrayBuffer.isView(data)) {
		bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
	} else if (data instanceof ArrayBuffer) {
		bytes = new Uint8Array(data);
	}
	return bytes;
};
const stdCrypto = ((x) => x)({
	...webCrypto,
	subtle: {
		...webCrypto.subtle,
		async digest(algorithm, data) {
			const { name, length } = normalizeAlgorithm(algorithm);
			const bytes = bufferSourceBytes(data);
			if (webCryptoDigestAlgorithms.includes(name) && bytes) {
				return webCrypto.subtle.digest(algorithm, bytes);
			} else if (digestAlgorithms.includes(name)) {
				if (bytes) {
					return stdCrypto.subtle.digestSync(algorithm, bytes);
				} else if (data[Symbol.iterator]) {
					return stdCrypto.subtle.digestSync(algorithm, data);
				} else if (data[Symbol.asyncIterator]) {
					const context = new mod3.DigestContext(name);
					for await (const chunk of data) {
						const chunkBytes = bufferSourceBytes(chunk);
						if (!chunkBytes) {
							throw new TypeError("data contained chunk of the wrong type");
						}
						context.update(chunkBytes);
					}
					return context.digestAndDrop(length).buffer;
				} else {
					throw new TypeError(
						"data must be a BufferSource or [Async]Iterable<BufferSource>",
					);
				}
			} else if (webCrypto.subtle?.digest) {
				return webCrypto.subtle.digest(algorithm, data);
			} else {
				throw new TypeError(`unsupported digest algorithm: ${algorithm}`);
			}
		},
		digestSync(algorithm, data) {
			algorithm = normalizeAlgorithm(algorithm);
			const bytes = bufferSourceBytes(data);
			if (bytes) {
				return mod3.digest(algorithm.name, bytes, algorithm.length).buffer;
			} else if (data[Symbol.iterator]) {
				const context = new mod3.DigestContext(algorithm.name);
				for (const chunk of data) {
					const chunkBytes = bufferSourceBytes(chunk);
					if (!chunkBytes) {
						throw new TypeError("data contained chunk of the wrong type");
					}
					context.update(chunkBytes);
				}
				return context.digestAndDrop(algorithm.length).buffer;
			} else {
				throw new TypeError(
					"data must be a BufferSource or Iterable<BufferSource>",
				);
			}
		},
	},
});
const webCryptoDigestAlgorithms = ["SHA-384", "SHA-256", "SHA-512", "SHA-1"];
const normalizeAlgorithm = (algorithm) =>
	typeof algorithm === "string"
		? {
				name: algorithm.toUpperCase(),
		  }
		: {
				...algorithm,
				name: algorithm.name.toUpperCase(),
		  };
function deferred() {
	let methods;
	let state = "pending";
	const promise = new Promise((resolve, reject) => {
		methods = {
			async resolve(value) {
				await value;
				state = "fulfilled";
				resolve(value);
			},
			reject(reason) {
				state = "rejected";
				reject(reason);
			},
		};
	});
	Object.defineProperty(promise, "state", {
		get: () => state,
	});
	return Object.assign(promise, methods);
}
function delay(ms, options = {}) {
	const { signal } = options;
	if (signal?.aborted) {
		return Promise.reject(new DOMException("Delay was aborted.", "AbortError"));
	}
	return new Promise((resolve, reject) => {
		const abort = () => {
			clearTimeout(i);
			reject(new DOMException("Delay was aborted.", "AbortError"));
		};
		const done = () => {
			signal?.removeEventListener("abort", abort);
			resolve();
		};
		const i = setTimeout(done, ms);
		signal?.addEventListener("abort", abort, {
			once: true,
		});
	});
}
class MuxAsyncIterator {
	iteratorCount = 0;
	yields = [];
	throws = [];
	signal = deferred();
	add(iterable) {
		++this.iteratorCount;
		this.callIteratorNext(iterable[Symbol.asyncIterator]());
	}
	async callIteratorNext(iterator) {
		try {
			const { value, done } = await iterator.next();
			if (done) {
				--this.iteratorCount;
			} else {
				this.yields.push({
					iterator,
					value,
				});
			}
		} catch (e) {
			this.throws.push(e);
		}
		this.signal.resolve();
	}
	async *iterate() {
		while (this.iteratorCount > 0) {
			await this.signal;
			for (let i = 0; i < this.yields.length; i++) {
				const { iterator, value } = this.yields[i];
				yield value;
				this.callIteratorNext(iterator);
			}
			if (this.throws.length) {
				for (const e of this.throws) {
					throw e;
				}
				this.throws.length = 0;
			}
			this.yields.length = 0;
			this.signal = deferred();
		}
	}
	[Symbol.asyncIterator]() {
		return this.iterate();
	}
}
const { Deno: Deno1 } = globalThis;
const noColor = typeof Deno1?.noColor === "boolean" ? Deno1.noColor : true;
let enabled = !noColor;
function code(open, close) {
	return {
		open: `\x1b[${open.join(";")}m`,
		close: `\x1b[${close}m`,
		regexp: new RegExp(`\\x1b\\[${close}m`, "g"),
	};
}
function run(str, code) {
	return enabled
		? `${code.open}${str.replace(code.regexp, code.open)}${code.close}`
		: str;
}
function bold(str) {
	return run(str, code([1], 22));
}
function yellow(str) {
	return run(str, code([33], 39));
}
new RegExp(
	[
		"[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
		"(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))",
	].join("|"),
	"g",
);
const osType = (() => {
	const { Deno: Deno1 } = globalThis;
	if (typeof Deno1?.build?.os === "string") {
		return Deno1.build.os;
	}
	const { navigator } = globalThis;
	if (navigator?.appVersion?.includes?.("Win")) {
		return "windows";
	}
	return "linux";
})();
const isWindows = osType === "windows";
const CHAR_FORWARD_SLASH = 47;
function assertPath(path) {
	if (typeof path !== "string") {
		throw new TypeError(
			`Path must be a string. Received ${JSON.stringify(path)}`,
		);
	}
}
function isPosixPathSeparator(code) {
	return code === 47;
}
function isPathSeparator(code) {
	return isPosixPathSeparator(code) || code === 92;
}
function isWindowsDeviceRoot(code) {
	return (code >= 97 && code <= 122) || (code >= 65 && code <= 90);
}
function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
	let res = "";
	let lastSegmentLength = 0;
	let lastSlash = -1;
	let dots = 0;
	let code;
	for (let i = 0, len = path.length; i <= len; ++i) {
		if (i < len) code = path.charCodeAt(i);
		else if (isPathSeparator(code)) break;
		else code = CHAR_FORWARD_SLASH;
		if (isPathSeparator(code)) {
			if (lastSlash === i - 1 || dots === 1) {
			} else if (lastSlash !== i - 1 && dots === 2) {
				if (
					res.length < 2 ||
					lastSegmentLength !== 2 ||
					res.charCodeAt(res.length - 1) !== 46 ||
					res.charCodeAt(res.length - 2) !== 46
				) {
					if (res.length > 2) {
						const lastSlashIndex = res.lastIndexOf(separator);
						if (lastSlashIndex === -1) {
							res = "";
							lastSegmentLength = 0;
						} else {
							res = res.slice(0, lastSlashIndex);
							lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
						}
						lastSlash = i;
						dots = 0;
						continue;
					} else if (res.length === 2 || res.length === 1) {
						res = "";
						lastSegmentLength = 0;
						lastSlash = i;
						dots = 0;
						continue;
					}
				}
				if (allowAboveRoot) {
					if (res.length > 0) res += `${separator}..`;
					else res = "..";
					lastSegmentLength = 2;
				}
			} else {
				if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
				else res = path.slice(lastSlash + 1, i);
				lastSegmentLength = i - lastSlash - 1;
			}
			lastSlash = i;
			dots = 0;
		} else if (code === 46 && dots !== -1) {
			++dots;
		} else {
			dots = -1;
		}
	}
	return res;
}
function _format(sep, pathObject) {
	const dir = pathObject.dir || pathObject.root;
	const base =
		pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
	if (!dir) return base;
	if (dir === pathObject.root) return dir + base;
	return dir + sep + base;
}
const WHITESPACE_ENCODINGS = {
	"\u0009": "%09",
	"\u000A": "%0A",
	"\u000B": "%0B",
	"\u000C": "%0C",
	"\u000D": "%0D",
	"\u0020": "%20",
};
function encodeWhitespace(string) {
	return string.replaceAll(/[\s]/g, (c) => {
		return WHITESPACE_ENCODINGS[c] ?? c;
	});
}
const sep = "\\";
const delimiter = ";";
function resolve(...pathSegments) {
	let resolvedDevice = "";
	let resolvedTail = "";
	let resolvedAbsolute = false;
	for (let i = pathSegments.length - 1; i >= -1; i--) {
		let path;
		const { Deno: Deno1 } = globalThis;
		if (i >= 0) {
			path = pathSegments[i];
		} else if (!resolvedDevice) {
			if (typeof Deno1?.cwd !== "function") {
				throw new TypeError("Resolved a drive-letter-less path without a CWD.");
			}
			path = Deno1.cwd();
		} else {
			if (
				typeof Deno1?.env?.get !== "function" ||
				typeof Deno1?.cwd !== "function"
			) {
				throw new TypeError("Resolved a relative path without a CWD.");
			}
			path = Deno1.cwd();
			if (
				path === undefined ||
				path.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`
			) {
				path = `${resolvedDevice}\\`;
			}
		}
		assertPath(path);
		const len = path.length;
		if (len === 0) continue;
		let rootEnd = 0;
		let device = "";
		let isAbsolute = false;
		const code = path.charCodeAt(0);
		if (len > 1) {
			if (isPathSeparator(code)) {
				isAbsolute = true;
				if (isPathSeparator(path.charCodeAt(1))) {
					let j = 2;
					let last = j;
					for (; j < len; ++j) {
						if (isPathSeparator(path.charCodeAt(j))) break;
					}
					if (j < len && j !== last) {
						const firstPart = path.slice(last, j);
						last = j;
						for (; j < len; ++j) {
							if (!isPathSeparator(path.charCodeAt(j))) break;
						}
						if (j < len && j !== last) {
							last = j;
							for (; j < len; ++j) {
								if (isPathSeparator(path.charCodeAt(j))) break;
							}
							if (j === len) {
								device = `\\\\${firstPart}\\${path.slice(last)}`;
								rootEnd = j;
							} else if (j !== last) {
								device = `\\\\${firstPart}\\${path.slice(last, j)}`;
								rootEnd = j;
							}
						}
					}
				} else {
					rootEnd = 1;
				}
			} else if (isWindowsDeviceRoot(code)) {
				if (path.charCodeAt(1) === 58) {
					device = path.slice(0, 2);
					rootEnd = 2;
					if (len > 2) {
						if (isPathSeparator(path.charCodeAt(2))) {
							isAbsolute = true;
							rootEnd = 3;
						}
					}
				}
			}
		} else if (isPathSeparator(code)) {
			rootEnd = 1;
			isAbsolute = true;
		}
		if (
			device.length > 0 &&
			resolvedDevice.length > 0 &&
			device.toLowerCase() !== resolvedDevice.toLowerCase()
		) {
			continue;
		}
		if (resolvedDevice.length === 0 && device.length > 0) {
			resolvedDevice = device;
		}
		if (!resolvedAbsolute) {
			resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
			resolvedAbsolute = isAbsolute;
		}
		if (resolvedAbsolute && resolvedDevice.length > 0) break;
	}
	resolvedTail = normalizeString(
		resolvedTail,
		!resolvedAbsolute,
		"\\",
		isPathSeparator,
	);
	return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize(path) {
	assertPath(path);
	const len = path.length;
	if (len === 0) return ".";
	let rootEnd = 0;
	let device;
	let isAbsolute = false;
	const code = path.charCodeAt(0);
	if (len > 1) {
		if (isPathSeparator(code)) {
			isAbsolute = true;
			if (isPathSeparator(path.charCodeAt(1))) {
				let j = 2;
				let last = j;
				for (; j < len; ++j) {
					if (isPathSeparator(path.charCodeAt(j))) break;
				}
				if (j < len && j !== last) {
					const firstPart = path.slice(last, j);
					last = j;
					for (; j < len; ++j) {
						if (!isPathSeparator(path.charCodeAt(j))) break;
					}
					if (j < len && j !== last) {
						last = j;
						for (; j < len; ++j) {
							if (isPathSeparator(path.charCodeAt(j))) break;
						}
						if (j === len) {
							return `\\\\${firstPart}\\${path.slice(last)}\\`;
						} else if (j !== last) {
							device = `\\\\${firstPart}\\${path.slice(last, j)}`;
							rootEnd = j;
						}
					}
				}
			} else {
				rootEnd = 1;
			}
		} else if (isWindowsDeviceRoot(code)) {
			if (path.charCodeAt(1) === 58) {
				device = path.slice(0, 2);
				rootEnd = 2;
				if (len > 2) {
					if (isPathSeparator(path.charCodeAt(2))) {
						isAbsolute = true;
						rootEnd = 3;
					}
				}
			}
		}
	} else if (isPathSeparator(code)) {
		return "\\";
	}
	let tail;
	if (rootEnd < len) {
		tail = normalizeString(
			path.slice(rootEnd),
			!isAbsolute,
			"\\",
			isPathSeparator,
		);
	} else {
		tail = "";
	}
	if (tail.length === 0 && !isAbsolute) tail = ".";
	if (tail.length > 0 && isPathSeparator(path.charCodeAt(len - 1))) {
		tail += "\\";
	}
	if (device === undefined) {
		if (isAbsolute) {
			if (tail.length > 0) return `\\${tail}`;
			else return "\\";
		} else if (tail.length > 0) {
			return tail;
		} else {
			return "";
		}
	} else if (isAbsolute) {
		if (tail.length > 0) return `${device}\\${tail}`;
		else return `${device}\\`;
	} else if (tail.length > 0) {
		return device + tail;
	} else {
		return device;
	}
}
function isAbsolute(path) {
	assertPath(path);
	const len = path.length;
	if (len === 0) return false;
	const code = path.charCodeAt(0);
	if (isPathSeparator(code)) {
		return true;
	} else if (isWindowsDeviceRoot(code)) {
		if (len > 2 && path.charCodeAt(1) === 58) {
			if (isPathSeparator(path.charCodeAt(2))) return true;
		}
	}
	return false;
}
function join(...paths) {
	const pathsCount = paths.length;
	if (pathsCount === 0) return ".";
	let joined;
	let firstPart = null;
	for (let i = 0; i < pathsCount; ++i) {
		const path = paths[i];
		assertPath(path);
		if (path.length > 0) {
			if (joined === undefined) joined = firstPart = path;
			else joined += `\\${path}`;
		}
	}
	if (joined === undefined) return ".";
	let needsReplace = true;
	let slashCount = 0;
	assert(firstPart != null);
	if (isPathSeparator(firstPart.charCodeAt(0))) {
		++slashCount;
		const firstLen = firstPart.length;
		if (firstLen > 1) {
			if (isPathSeparator(firstPart.charCodeAt(1))) {
				++slashCount;
				if (firstLen > 2) {
					if (isPathSeparator(firstPart.charCodeAt(2))) ++slashCount;
					else {
						needsReplace = false;
					}
				}
			}
		}
	}
	if (needsReplace) {
		for (; slashCount < joined.length; ++slashCount) {
			if (!isPathSeparator(joined.charCodeAt(slashCount))) break;
		}
		if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
	}
	return normalize(joined);
}
function relative(from, to) {
	assertPath(from);
	assertPath(to);
	if (from === to) return "";
	const fromOrig = resolve(from);
	const toOrig = resolve(to);
	if (fromOrig === toOrig) return "";
	from = fromOrig.toLowerCase();
	to = toOrig.toLowerCase();
	if (from === to) return "";
	let fromStart = 0;
	let fromEnd = from.length;
	for (; fromStart < fromEnd; ++fromStart) {
		if (from.charCodeAt(fromStart) !== 92) break;
	}
	for (; fromEnd - 1 > fromStart; --fromEnd) {
		if (from.charCodeAt(fromEnd - 1) !== 92) break;
	}
	const fromLen = fromEnd - fromStart;
	let toStart = 0;
	let toEnd = to.length;
	for (; toStart < toEnd; ++toStart) {
		if (to.charCodeAt(toStart) !== 92) break;
	}
	for (; toEnd - 1 > toStart; --toEnd) {
		if (to.charCodeAt(toEnd - 1) !== 92) break;
	}
	const toLen = toEnd - toStart;
	const length = fromLen < toLen ? fromLen : toLen;
	let lastCommonSep = -1;
	let i = 0;
	for (; i <= length; ++i) {
		if (i === length) {
			if (toLen > length) {
				if (to.charCodeAt(toStart + i) === 92) {
					return toOrig.slice(toStart + i + 1);
				} else if (i === 2) {
					return toOrig.slice(toStart + i);
				}
			}
			if (fromLen > length) {
				if (from.charCodeAt(fromStart + i) === 92) {
					lastCommonSep = i;
				} else if (i === 2) {
					lastCommonSep = 3;
				}
			}
			break;
		}
		const fromCode = from.charCodeAt(fromStart + i);
		const toCode = to.charCodeAt(toStart + i);
		if (fromCode !== toCode) break;
		else if (fromCode === 92) lastCommonSep = i;
	}
	if (i !== length && lastCommonSep === -1) {
		return toOrig;
	}
	let out = "";
	if (lastCommonSep === -1) lastCommonSep = 0;
	for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
		if (i === fromEnd || from.charCodeAt(i) === 92) {
			if (out.length === 0) out += "..";
			else out += "\\..";
		}
	}
	if (out.length > 0) {
		return out + toOrig.slice(toStart + lastCommonSep, toEnd);
	} else {
		toStart += lastCommonSep;
		if (toOrig.charCodeAt(toStart) === 92) ++toStart;
		return toOrig.slice(toStart, toEnd);
	}
}
function toNamespacedPath(path) {
	if (typeof path !== "string") return path;
	if (path.length === 0) return "";
	const resolvedPath = resolve(path);
	if (resolvedPath.length >= 3) {
		if (resolvedPath.charCodeAt(0) === 92) {
			if (resolvedPath.charCodeAt(1) === 92) {
				const code = resolvedPath.charCodeAt(2);
				if (code !== 63 && code !== 46) {
					return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
				}
			}
		} else if (isWindowsDeviceRoot(resolvedPath.charCodeAt(0))) {
			if (
				resolvedPath.charCodeAt(1) === 58 &&
				resolvedPath.charCodeAt(2) === 92
			) {
				return `\\\\?\\${resolvedPath}`;
			}
		}
	}
	return path;
}
function dirname(path) {
	assertPath(path);
	const len = path.length;
	if (len === 0) return ".";
	let rootEnd = -1;
	let end = -1;
	let matchedSlash = true;
	let offset = 0;
	const code = path.charCodeAt(0);
	if (len > 1) {
		if (isPathSeparator(code)) {
			rootEnd = offset = 1;
			if (isPathSeparator(path.charCodeAt(1))) {
				let j = 2;
				let last = j;
				for (; j < len; ++j) {
					if (isPathSeparator(path.charCodeAt(j))) break;
				}
				if (j < len && j !== last) {
					last = j;
					for (; j < len; ++j) {
						if (!isPathSeparator(path.charCodeAt(j))) break;
					}
					if (j < len && j !== last) {
						last = j;
						for (; j < len; ++j) {
							if (isPathSeparator(path.charCodeAt(j))) break;
						}
						if (j === len) {
							return path;
						}
						if (j !== last) {
							rootEnd = offset = j + 1;
						}
					}
				}
			}
		} else if (isWindowsDeviceRoot(code)) {
			if (path.charCodeAt(1) === 58) {
				rootEnd = offset = 2;
				if (len > 2) {
					if (isPathSeparator(path.charCodeAt(2))) rootEnd = offset = 3;
				}
			}
		}
	} else if (isPathSeparator(code)) {
		return path;
	}
	for (let i = len - 1; i >= offset; --i) {
		if (isPathSeparator(path.charCodeAt(i))) {
			if (!matchedSlash) {
				end = i;
				break;
			}
		} else {
			matchedSlash = false;
		}
	}
	if (end === -1) {
		if (rootEnd === -1) return ".";
		else end = rootEnd;
	}
	return path.slice(0, end);
}
function basename(path, ext = "") {
	if (ext !== undefined && typeof ext !== "string") {
		throw new TypeError('"ext" argument must be a string');
	}
	assertPath(path);
	let start = 0;
	let end = -1;
	let matchedSlash = true;
	let i;
	if (path.length >= 2) {
		const drive = path.charCodeAt(0);
		if (isWindowsDeviceRoot(drive)) {
			if (path.charCodeAt(1) === 58) start = 2;
		}
	}
	if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
		if (ext.length === path.length && ext === path) return "";
		let extIdx = ext.length - 1;
		let firstNonSlashEnd = -1;
		for (i = path.length - 1; i >= start; --i) {
			const code = path.charCodeAt(i);
			if (isPathSeparator(code)) {
				if (!matchedSlash) {
					start = i + 1;
					break;
				}
			} else {
				if (firstNonSlashEnd === -1) {
					matchedSlash = false;
					firstNonSlashEnd = i + 1;
				}
				if (extIdx >= 0) {
					if (code === ext.charCodeAt(extIdx)) {
						if (--extIdx === -1) {
							end = i;
						}
					} else {
						extIdx = -1;
						end = firstNonSlashEnd;
					}
				}
			}
		}
		if (start === end) end = firstNonSlashEnd;
		else if (end === -1) end = path.length;
		return path.slice(start, end);
	} else {
		for (i = path.length - 1; i >= start; --i) {
			if (isPathSeparator(path.charCodeAt(i))) {
				if (!matchedSlash) {
					start = i + 1;
					break;
				}
			} else if (end === -1) {
				matchedSlash = false;
				end = i + 1;
			}
		}
		if (end === -1) return "";
		return path.slice(start, end);
	}
}
function extname(path) {
	assertPath(path);
	let start = 0;
	let startDot = -1;
	let startPart = 0;
	let end = -1;
	let matchedSlash = true;
	let preDotState = 0;
	if (
		path.length >= 2 &&
		path.charCodeAt(1) === 58 &&
		isWindowsDeviceRoot(path.charCodeAt(0))
	) {
		start = startPart = 2;
	}
	for (let i = path.length - 1; i >= start; --i) {
		const code = path.charCodeAt(i);
		if (isPathSeparator(code)) {
			if (!matchedSlash) {
				startPart = i + 1;
				break;
			}
			continue;
		}
		if (end === -1) {
			matchedSlash = false;
			end = i + 1;
		}
		if (code === 46) {
			if (startDot === -1) startDot = i;
			else if (preDotState !== 1) preDotState = 1;
		} else if (startDot !== -1) {
			preDotState = -1;
		}
	}
	if (
		startDot === -1 ||
		end === -1 ||
		preDotState === 0 ||
		(preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)
	) {
		return "";
	}
	return path.slice(startDot, end);
}
function format1(pathObject) {
	if (pathObject === null || typeof pathObject !== "object") {
		throw new TypeError(
			`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`,
		);
	}
	return _format("\\", pathObject);
}
function parse1(path) {
	assertPath(path);
	const ret = {
		root: "",
		dir: "",
		base: "",
		ext: "",
		name: "",
	};
	const len = path.length;
	if (len === 0) return ret;
	let rootEnd = 0;
	let code = path.charCodeAt(0);
	if (len > 1) {
		if (isPathSeparator(code)) {
			rootEnd = 1;
			if (isPathSeparator(path.charCodeAt(1))) {
				let j = 2;
				let last = j;
				for (; j < len; ++j) {
					if (isPathSeparator(path.charCodeAt(j))) break;
				}
				if (j < len && j !== last) {
					last = j;
					for (; j < len; ++j) {
						if (!isPathSeparator(path.charCodeAt(j))) break;
					}
					if (j < len && j !== last) {
						last = j;
						for (; j < len; ++j) {
							if (isPathSeparator(path.charCodeAt(j))) break;
						}
						if (j === len) {
							rootEnd = j;
						} else if (j !== last) {
							rootEnd = j + 1;
						}
					}
				}
			}
		} else if (isWindowsDeviceRoot(code)) {
			if (path.charCodeAt(1) === 58) {
				rootEnd = 2;
				if (len > 2) {
					if (isPathSeparator(path.charCodeAt(2))) {
						if (len === 3) {
							ret.root = ret.dir = path;
							return ret;
						}
						rootEnd = 3;
					}
				} else {
					ret.root = ret.dir = path;
					return ret;
				}
			}
		}
	} else if (isPathSeparator(code)) {
		ret.root = ret.dir = path;
		return ret;
	}
	if (rootEnd > 0) ret.root = path.slice(0, rootEnd);
	let startDot = -1;
	let startPart = rootEnd;
	let end = -1;
	let matchedSlash = true;
	let i = path.length - 1;
	let preDotState = 0;
	for (; i >= rootEnd; --i) {
		code = path.charCodeAt(i);
		if (isPathSeparator(code)) {
			if (!matchedSlash) {
				startPart = i + 1;
				break;
			}
			continue;
		}
		if (end === -1) {
			matchedSlash = false;
			end = i + 1;
		}
		if (code === 46) {
			if (startDot === -1) startDot = i;
			else if (preDotState !== 1) preDotState = 1;
		} else if (startDot !== -1) {
			preDotState = -1;
		}
	}
	if (
		startDot === -1 ||
		end === -1 ||
		preDotState === 0 ||
		(preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)
	) {
		if (end !== -1) {
			ret.base = ret.name = path.slice(startPart, end);
		}
	} else {
		ret.name = path.slice(startPart, startDot);
		ret.base = path.slice(startPart, end);
		ret.ext = path.slice(startDot, end);
	}
	if (startPart > 0 && startPart !== rootEnd) {
		ret.dir = path.slice(0, startPart - 1);
	} else ret.dir = ret.root;
	return ret;
}
function fromFileUrl(url) {
	url = url instanceof URL ? url : new URL(url);
	if (url.protocol != "file:") {
		throw new TypeError("Must be a file URL.");
	}
	let path = decodeURIComponent(
		url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25"),
	).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
	if (url.hostname != "") {
		path = `\\\\${url.hostname}${path}`;
	}
	return path;
}
function toFileUrl(path) {
	if (!isAbsolute(path)) {
		throw new TypeError("Must be an absolute path.");
	}
	const [, hostname, pathname] = path.match(
		/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/,
	);
	const url = new URL("file:///");
	url.pathname = encodeWhitespace(pathname.replace(/%/g, "%25"));
	if (hostname != null && hostname != "localhost") {
		url.hostname = hostname;
		if (!url.hostname) {
			throw new TypeError("Invalid hostname.");
		}
	}
	return url;
}
const mod4 = {
	sep: sep,
	delimiter: delimiter,
	resolve: resolve,
	normalize: normalize,
	isAbsolute: isAbsolute,
	join: join,
	relative: relative,
	toNamespacedPath: toNamespacedPath,
	dirname: dirname,
	basename: basename,
	extname: extname,
	format: format1,
	parse: parse1,
	fromFileUrl: fromFileUrl,
	toFileUrl: toFileUrl,
};
const sep1 = "/";
const delimiter1 = ":";
function resolve1(...pathSegments) {
	let resolvedPath = "";
	let resolvedAbsolute = false;
	for (let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
		let path;
		if (i >= 0) path = pathSegments[i];
		else {
			const { Deno: Deno1 } = globalThis;
			if (typeof Deno1?.cwd !== "function") {
				throw new TypeError("Resolved a relative path without a CWD.");
			}
			path = Deno1.cwd();
		}
		assertPath(path);
		if (path.length === 0) {
			continue;
		}
		resolvedPath = `${path}/${resolvedPath}`;
		resolvedAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
	}
	resolvedPath = normalizeString(
		resolvedPath,
		!resolvedAbsolute,
		"/",
		isPosixPathSeparator,
	);
	if (resolvedAbsolute) {
		if (resolvedPath.length > 0) return `/${resolvedPath}`;
		else return "/";
	} else if (resolvedPath.length > 0) return resolvedPath;
	else return ".";
}
function normalize1(path) {
	assertPath(path);
	if (path.length === 0) return ".";
	const isAbsolute = path.charCodeAt(0) === 47;
	const trailingSeparator = path.charCodeAt(path.length - 1) === 47;
	path = normalizeString(path, !isAbsolute, "/", isPosixPathSeparator);
	if (path.length === 0 && !isAbsolute) path = ".";
	if (path.length > 0 && trailingSeparator) path += "/";
	if (isAbsolute) return `/${path}`;
	return path;
}
function isAbsolute1(path) {
	assertPath(path);
	return path.length > 0 && path.charCodeAt(0) === 47;
}
function join1(...paths) {
	if (paths.length === 0) return ".";
	let joined;
	for (let i = 0, len = paths.length; i < len; ++i) {
		const path = paths[i];
		assertPath(path);
		if (path.length > 0) {
			if (!joined) joined = path;
			else joined += `/${path}`;
		}
	}
	if (!joined) return ".";
	return normalize1(joined);
}
function relative1(from, to) {
	assertPath(from);
	assertPath(to);
	if (from === to) return "";
	from = resolve1(from);
	to = resolve1(to);
	if (from === to) return "";
	let fromStart = 1;
	const fromEnd = from.length;
	for (; fromStart < fromEnd; ++fromStart) {
		if (from.charCodeAt(fromStart) !== 47) break;
	}
	const fromLen = fromEnd - fromStart;
	let toStart = 1;
	const toEnd = to.length;
	for (; toStart < toEnd; ++toStart) {
		if (to.charCodeAt(toStart) !== 47) break;
	}
	const toLen = toEnd - toStart;
	const length = fromLen < toLen ? fromLen : toLen;
	let lastCommonSep = -1;
	let i = 0;
	for (; i <= length; ++i) {
		if (i === length) {
			if (toLen > length) {
				if (to.charCodeAt(toStart + i) === 47) {
					return to.slice(toStart + i + 1);
				} else if (i === 0) {
					return to.slice(toStart + i);
				}
			} else if (fromLen > length) {
				if (from.charCodeAt(fromStart + i) === 47) {
					lastCommonSep = i;
				} else if (i === 0) {
					lastCommonSep = 0;
				}
			}
			break;
		}
		const fromCode = from.charCodeAt(fromStart + i);
		const toCode = to.charCodeAt(toStart + i);
		if (fromCode !== toCode) break;
		else if (fromCode === 47) lastCommonSep = i;
	}
	let out = "";
	for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
		if (i === fromEnd || from.charCodeAt(i) === 47) {
			if (out.length === 0) out += "..";
			else out += "/..";
		}
	}
	if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
	else {
		toStart += lastCommonSep;
		if (to.charCodeAt(toStart) === 47) ++toStart;
		return to.slice(toStart);
	}
}
function toNamespacedPath1(path) {
	return path;
}
function dirname1(path) {
	assertPath(path);
	if (path.length === 0) return ".";
	const hasRoot = path.charCodeAt(0) === 47;
	let end = -1;
	let matchedSlash = true;
	for (let i = path.length - 1; i >= 1; --i) {
		if (path.charCodeAt(i) === 47) {
			if (!matchedSlash) {
				end = i;
				break;
			}
		} else {
			matchedSlash = false;
		}
	}
	if (end === -1) return hasRoot ? "/" : ".";
	if (hasRoot && end === 1) return "//";
	return path.slice(0, end);
}
function basename1(path, ext = "") {
	if (ext !== undefined && typeof ext !== "string") {
		throw new TypeError('"ext" argument must be a string');
	}
	assertPath(path);
	let start = 0;
	let end = -1;
	let matchedSlash = true;
	let i;
	if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
		if (ext.length === path.length && ext === path) return "";
		let extIdx = ext.length - 1;
		let firstNonSlashEnd = -1;
		for (i = path.length - 1; i >= 0; --i) {
			const code = path.charCodeAt(i);
			if (code === 47) {
				if (!matchedSlash) {
					start = i + 1;
					break;
				}
			} else {
				if (firstNonSlashEnd === -1) {
					matchedSlash = false;
					firstNonSlashEnd = i + 1;
				}
				if (extIdx >= 0) {
					if (code === ext.charCodeAt(extIdx)) {
						if (--extIdx === -1) {
							end = i;
						}
					} else {
						extIdx = -1;
						end = firstNonSlashEnd;
					}
				}
			}
		}
		if (start === end) end = firstNonSlashEnd;
		else if (end === -1) end = path.length;
		return path.slice(start, end);
	} else {
		for (i = path.length - 1; i >= 0; --i) {
			if (path.charCodeAt(i) === 47) {
				if (!matchedSlash) {
					start = i + 1;
					break;
				}
			} else if (end === -1) {
				matchedSlash = false;
				end = i + 1;
			}
		}
		if (end === -1) return "";
		return path.slice(start, end);
	}
}
function extname1(path) {
	assertPath(path);
	let startDot = -1;
	let startPart = 0;
	let end = -1;
	let matchedSlash = true;
	let preDotState = 0;
	for (let i = path.length - 1; i >= 0; --i) {
		const code = path.charCodeAt(i);
		if (code === 47) {
			if (!matchedSlash) {
				startPart = i + 1;
				break;
			}
			continue;
		}
		if (end === -1) {
			matchedSlash = false;
			end = i + 1;
		}
		if (code === 46) {
			if (startDot === -1) startDot = i;
			else if (preDotState !== 1) preDotState = 1;
		} else if (startDot !== -1) {
			preDotState = -1;
		}
	}
	if (
		startDot === -1 ||
		end === -1 ||
		preDotState === 0 ||
		(preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)
	) {
		return "";
	}
	return path.slice(startDot, end);
}
function format2(pathObject) {
	if (pathObject === null || typeof pathObject !== "object") {
		throw new TypeError(
			`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`,
		);
	}
	return _format("/", pathObject);
}
function parse2(path) {
	assertPath(path);
	const ret = {
		root: "",
		dir: "",
		base: "",
		ext: "",
		name: "",
	};
	if (path.length === 0) return ret;
	const isAbsolute = path.charCodeAt(0) === 47;
	let start;
	if (isAbsolute) {
		ret.root = "/";
		start = 1;
	} else {
		start = 0;
	}
	let startDot = -1;
	let startPart = 0;
	let end = -1;
	let matchedSlash = true;
	let i = path.length - 1;
	let preDotState = 0;
	for (; i >= start; --i) {
		const code = path.charCodeAt(i);
		if (code === 47) {
			if (!matchedSlash) {
				startPart = i + 1;
				break;
			}
			continue;
		}
		if (end === -1) {
			matchedSlash = false;
			end = i + 1;
		}
		if (code === 46) {
			if (startDot === -1) startDot = i;
			else if (preDotState !== 1) preDotState = 1;
		} else if (startDot !== -1) {
			preDotState = -1;
		}
	}
	if (
		startDot === -1 ||
		end === -1 ||
		preDotState === 0 ||
		(preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)
	) {
		if (end !== -1) {
			if (startPart === 0 && isAbsolute) {
				ret.base = ret.name = path.slice(1, end);
			} else {
				ret.base = ret.name = path.slice(startPart, end);
			}
		}
	} else {
		if (startPart === 0 && isAbsolute) {
			ret.name = path.slice(1, startDot);
			ret.base = path.slice(1, end);
		} else {
			ret.name = path.slice(startPart, startDot);
			ret.base = path.slice(startPart, end);
		}
		ret.ext = path.slice(startDot, end);
	}
	if (startPart > 0) ret.dir = path.slice(0, startPart - 1);
	else if (isAbsolute) ret.dir = "/";
	return ret;
}
function fromFileUrl1(url) {
	url = url instanceof URL ? url : new URL(url);
	if (url.protocol != "file:") {
		throw new TypeError("Must be a file URL.");
	}
	return decodeURIComponent(
		url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"),
	);
}
function toFileUrl1(path) {
	if (!isAbsolute1(path)) {
		throw new TypeError("Must be an absolute path.");
	}
	const url = new URL("file:///");
	url.pathname = encodeWhitespace(
		path.replace(/%/g, "%25").replace(/\\/g, "%5C"),
	);
	return url;
}
const mod5 = {
	sep: sep1,
	delimiter: delimiter1,
	resolve: resolve1,
	normalize: normalize1,
	isAbsolute: isAbsolute1,
	join: join1,
	relative: relative1,
	toNamespacedPath: toNamespacedPath1,
	dirname: dirname1,
	basename: basename1,
	extname: extname1,
	format: format2,
	parse: parse2,
	fromFileUrl: fromFileUrl1,
	toFileUrl: toFileUrl1,
};
const path = isWindows ? mod4 : mod5;
const { join: join2, normalize: normalize2 } = path;
const path1 = isWindows ? mod4 : mod5;
const {
	basename: basename2,
	delimiter: delimiter2,
	dirname: dirname2,
	extname: extname2,
	format: format3,
	fromFileUrl: fromFileUrl2,
	isAbsolute: isAbsolute2,
	join: join3,
	normalize: normalize3,
	parse: parse3,
	relative: relative2,
	resolve: resolve2,
	sep: sep2,
	toFileUrl: toFileUrl2,
	toNamespacedPath: toNamespacedPath2,
} = path1;
class DeferredStack {
	#elements;
	#creator;
	#max_size;
	#queue;
	#size;
	constructor(max, ls, creator) {
		this.#elements = ls ? [...ls] : [];
		this.#creator = creator;
		this.#max_size = max || 10;
		this.#queue = [];
		this.#size = this.#elements.length;
	}
	get available() {
		return this.#elements.length;
	}
	async pop() {
		if (this.#elements.length > 0) {
			return this.#elements.pop();
		} else if (this.#size < this.#max_size && this.#creator) {
			this.#size++;
			return await this.#creator();
		}
		const d = deferred();
		this.#queue.push(d);
		return await d;
	}
	push(value) {
		if (this.#queue.length > 0) {
			const d = this.#queue.shift();
			d.resolve(value);
		} else {
			this.#elements.push(value);
		}
	}
	get size() {
		return this.#size;
	}
}
class DeferredAccessStack {
	#elements;
	#initializeElement;
	#checkElementInitialization;
	#queue;
	#size;
	get available() {
		return this.#elements.length;
	}
	get size() {
		return this.#size;
	}
	constructor(elements, initCallback, checkInitCallback) {
		this.#checkElementInitialization = checkInitCallback;
		this.#elements = elements;
		this.#initializeElement = initCallback;
		this.#queue = [];
		this.#size = elements.length;
	}
	async initialized() {
		const initialized = await Promise.all(
			this.#elements.map((e) => this.#checkElementInitialization(e)),
		);
		return initialized.filter((initialized) => initialized === true).length;
	}
	async pop() {
		let element;
		if (this.available > 0) {
			element = this.#elements.pop();
		} else {
			const d = deferred();
			this.#queue.push(d);
			element = await d;
		}
		if (!(await this.#checkElementInitialization(element))) {
			await this.#initializeElement(element);
		}
		return element;
	}
	push(value) {
		if (this.#queue.length > 0) {
			const d = this.#queue.shift();
			d.resolve(value);
		} else {
			this.#elements.push(value);
		}
	}
}
function readInt16BE(buffer, offset) {
	offset = offset >>> 0;
	const val = buffer[offset + 1] | (buffer[offset] << 8);
	return val & 0x8000 ? val | 0xffff0000 : val;
}
function readInt32BE(buffer, offset) {
	offset = offset >>> 0;
	return (
		(buffer[offset] << 24) |
		(buffer[offset + 1] << 16) |
		(buffer[offset + 2] << 8) |
		buffer[offset + 3]
	);
}
function readUInt32BE(buffer, offset) {
	offset = offset >>> 0;
	return (
		buffer[offset] * 0x1000000 +
		((buffer[offset + 1] << 16) |
			(buffer[offset + 2] << 8) |
			buffer[offset + 3])
	);
}
function parseConnectionUri(uri) {
	const parsed_uri = uri.match(
		/(?<driver>\w+):\/{2}((?<user>[^\/?#\s:]+?)?(:(?<password>[^\/?#\s]+)?)?@)?(?<full_host>[^\/?#\s]+)?(\/(?<path>[^?#\s]*))?(\?(?<params>[^#\s]+))?.*/,
	);
	if (!parsed_uri) throw new Error("Could not parse the provided URL");
	let {
		driver = "",
		full_host = "",
		params = "",
		password = "",
		path = "",
		user = "",
	} = parsed_uri.groups ?? {};
	const parsed_host = full_host.match(
		/(?<host>(\[.+\])|(.*?))(:(?<port>[\w]*))?$/,
	);
	if (!parsed_host) throw new Error(`Could not parse "${full_host}" host`);
	let { host = "", port = "" } = parsed_host.groups ?? {};
	try {
		if (host) {
			host = decodeURIComponent(host);
		}
	} catch (_e) {
		console.error(
			bold(yellow("Failed to decode URL host") + "\nDefaulting to raw host"),
		);
	}
	if (port && Number.isNaN(Number(port))) {
		throw new Error(`The provided port "${port}" is not a valid number`);
	}
	try {
		if (password) {
			password = decodeURIComponent(password);
		}
	} catch (_e1) {
		console.error(
			bold(
				yellow("Failed to decode URL password") +
					"\nDefaulting to raw password",
			),
		);
	}
	return {
		driver,
		host,
		params: Object.fromEntries(new URLSearchParams(params).entries()),
		password,
		path,
		port,
		user,
	};
}
function isTemplateString(template) {
	if (!Array.isArray(template)) {
		return false;
	}
	return true;
}
const getSocketName = (port) => `.s.PGSQL.${port}`;
class PacketReader {
	#buffer;
	#decoder = new TextDecoder();
	#offset = 0;
	constructor(buffer) {
		this.#buffer = buffer;
	}
	readInt16() {
		const value = readInt16BE(this.#buffer, this.#offset);
		this.#offset += 2;
		return value;
	}
	readInt32() {
		const value = readInt32BE(this.#buffer, this.#offset);
		this.#offset += 4;
		return value;
	}
	readByte() {
		return this.readBytes(1)[0];
	}
	readBytes(length) {
		const start = this.#offset;
		const end = start + length;
		const slice = this.#buffer.slice(start, end);
		this.#offset = end;
		return slice;
	}
	readAllBytes() {
		const slice = this.#buffer.slice(this.#offset);
		this.#offset = this.#buffer.length;
		return slice;
	}
	readString(length) {
		const bytes = this.readBytes(length);
		return this.#decoder.decode(bytes);
	}
	readCString() {
		const start = this.#offset;
		const end = this.#buffer.indexOf(0, start);
		const slice = this.#buffer.slice(start, end);
		this.#offset = end + 1;
		return this.#decoder.decode(slice);
	}
}
class PacketWriter {
	#buffer;
	#encoder = new TextEncoder();
	#headerPosition;
	#offset;
	#size;
	constructor(size) {
		this.#size = size || 1024;
		this.#buffer = new Uint8Array(this.#size + 5);
		this.#offset = 5;
		this.#headerPosition = 0;
	}
	#ensure(size) {
		const remaining = this.#buffer.length - this.#offset;
		if (remaining < size) {
			const oldBuffer = this.#buffer;
			const newSize = oldBuffer.length + (oldBuffer.length >> 1) + size;
			this.#buffer = new Uint8Array(newSize);
			copy(oldBuffer, this.#buffer);
		}
	}
	addInt32(num) {
		this.#ensure(4);
		this.#buffer[this.#offset++] = (num >>> 24) & 0xff;
		this.#buffer[this.#offset++] = (num >>> 16) & 0xff;
		this.#buffer[this.#offset++] = (num >>> 8) & 0xff;
		this.#buffer[this.#offset++] = (num >>> 0) & 0xff;
		return this;
	}
	addInt16(num) {
		this.#ensure(2);
		this.#buffer[this.#offset++] = (num >>> 8) & 0xff;
		this.#buffer[this.#offset++] = (num >>> 0) & 0xff;
		return this;
	}
	addCString(string) {
		if (!string) {
			this.#ensure(1);
		} else {
			const encodedStr = this.#encoder.encode(string);
			this.#ensure(encodedStr.byteLength + 1);
			copy(encodedStr, this.#buffer, this.#offset);
			this.#offset += encodedStr.byteLength;
		}
		this.#buffer[this.#offset++] = 0;
		return this;
	}
	addChar(c) {
		if (c.length != 1) {
			throw new Error("addChar requires single character strings");
		}
		this.#ensure(1);
		copy(this.#encoder.encode(c), this.#buffer, this.#offset);
		this.#offset++;
		return this;
	}
	addString(string) {
		string = string || "";
		const encodedStr = this.#encoder.encode(string);
		this.#ensure(encodedStr.byteLength);
		copy(encodedStr, this.#buffer, this.#offset);
		this.#offset += encodedStr.byteLength;
		return this;
	}
	add(otherBuffer) {
		this.#ensure(otherBuffer.length);
		copy(otherBuffer, this.#buffer, this.#offset);
		this.#offset += otherBuffer.length;
		return this;
	}
	clear() {
		this.#offset = 5;
		this.#headerPosition = 0;
	}
	addHeader(code, last) {
		const origOffset = this.#offset;
		this.#offset = this.#headerPosition;
		this.#buffer[this.#offset++] = code;
		this.addInt32(origOffset - (this.#headerPosition + 1));
		this.#headerPosition = origOffset;
		this.#offset = origOffset;
		if (!last) {
			this.#ensure(5);
			this.#offset += 5;
		}
		return this;
	}
	join(code) {
		if (code) {
			this.addHeader(code, true);
		}
		return this.#buffer.slice(code ? 0 : 5, this.#offset);
	}
	flush(code) {
		const result = this.join(code);
		this.clear();
		return result;
	}
}
const Oid = {
	bool: 16,
	bytea: 17,
	char: 18,
	name: 19,
	int8: 20,
	int2: 21,
	_int2vector_0: 22,
	int4: 23,
	regproc: 24,
	text: 25,
	oid: 26,
	tid: 27,
	xid: 28,
	_cid_0: 29,
	_oidvector_0: 30,
	_pg_ddl_command: 32,
	_pg_type: 71,
	_pg_attribute: 75,
	_pg_proc: 81,
	_pg_class: 83,
	json: 114,
	_xml_0: 142,
	_xml_1: 143,
	_pg_node_tree: 194,
	json_array: 199,
	_smgr: 210,
	_index_am_handler: 325,
	point: 600,
	lseg: 601,
	path: 602,
	box: 603,
	polygon: 604,
	line: 628,
	line_array: 629,
	cidr: 650,
	cidr_array: 651,
	float4: 700,
	float8: 701,
	_abstime_0: 702,
	_reltime_0: 703,
	_tinterval_0: 704,
	_unknown: 705,
	circle: 718,
	circle_array: 719,
	_money_0: 790,
	_money_1: 791,
	macaddr: 829,
	inet: 869,
	bool_array: 1000,
	byte_array: 1001,
	char_array: 1002,
	name_array: 1003,
	int2_array: 1005,
	_int2vector_1: 1006,
	int4_array: 1007,
	regproc_array: 1008,
	text_array: 1009,
	tid_array: 1010,
	xid_array: 1011,
	_cid_1: 1012,
	_oidvector_1: 1013,
	bpchar_array: 1014,
	varchar_array: 1015,
	int8_array: 1016,
	point_array: 1017,
	lseg_array: 1018,
	path_array: 1019,
	box_array: 1020,
	float4_array: 1021,
	float8_array: 1022,
	_abstime_1: 1023,
	_reltime_1: 1024,
	_tinterval_1: 1025,
	polygon_array: 1027,
	oid_array: 1028,
	_aclitem_0: 1033,
	_aclitem_1: 1034,
	macaddr_array: 1040,
	inet_array: 1041,
	bpchar: 1042,
	varchar: 1043,
	date: 1082,
	time: 1083,
	timestamp: 1114,
	timestamp_array: 1115,
	date_array: 1182,
	time_array: 1183,
	timestamptz: 1184,
	timestamptz_array: 1185,
	_interval_0: 1186,
	_interval_1: 1187,
	numeric_array: 1231,
	_pg_database: 1248,
	_cstring_0: 1263,
	timetz: 1266,
	timetz_array: 1270,
	_bit_0: 1560,
	_bit_1: 1561,
	_varbit_0: 1562,
	_varbit_1: 1563,
	numeric: 1700,
	_refcursor_0: 1790,
	_refcursor_1: 2201,
	regprocedure: 2202,
	regoper: 2203,
	regoperator: 2204,
	regclass: 2205,
	regtype: 2206,
	regprocedure_array: 2207,
	regoper_array: 2208,
	regoperator_array: 2209,
	regclass_array: 2210,
	regtype_array: 2211,
	_record_0: 2249,
	_cstring_1: 2275,
	_any: 2276,
	_anyarray: 2277,
	void: 2278,
	_trigger: 2279,
	_language_handler: 2280,
	_internal: 2281,
	_opaque: 2282,
	_anyelement: 2283,
	_record_1: 2287,
	_anynonarray: 2776,
	_pg_authid: 2842,
	_pg_auth_members: 2843,
	_txid_snapshot_0: 2949,
	uuid: 2950,
	uuid_array: 2951,
	_txid_snapshot_1: 2970,
	_fdw_handler: 3115,
	_pg_lsn_0: 3220,
	_pg_lsn_1: 3221,
	_tsm_handler: 3310,
	_anyenum: 3500,
	_tsvector_0: 3614,
	_tsquery_0: 3615,
	_gtsvector_0: 3642,
	_tsvector_1: 3643,
	_gtsvector_1: 3644,
	_tsquery_1: 3645,
	regconfig: 3734,
	regconfig_array: 3735,
	regdictionary: 3769,
	regdictionary_array: 3770,
	jsonb: 3802,
	jsonb_array: 3807,
	_anyrange: 3831,
	_event_trigger: 3838,
	_int4range_0: 3904,
	_int4range_1: 3905,
	_numrange_0: 3906,
	_numrange_1: 3907,
	_tsrange_0: 3908,
	_tsrange_1: 3909,
	_tstzrange_0: 3910,
	_tstzrange_1: 3911,
	_daterange_0: 3912,
	_daterange_1: 3913,
	_int8range_0: 3926,
	_int8range_1: 3927,
	_pg_shseclabel: 4066,
	regnamespace: 4089,
	regnamespace_array: 4090,
	regrole: 4096,
	regrole_array: 4097,
};
function parseArray(source, transform, separator = ",") {
	return new ArrayParser(source, transform, separator).parse();
}
class ArrayParser {
	position;
	entries;
	recorded;
	dimension;
	constructor(source, transform, separator) {
		this.source = source;
		this.transform = transform;
		this.separator = separator;
		this.position = 0;
		this.entries = [];
		this.recorded = [];
		this.dimension = 0;
	}
	isEof() {
		return this.position >= this.source.length;
	}
	nextCharacter() {
		const character = this.source[this.position++];
		if (character === "\\") {
			return {
				value: this.source[this.position++],
				escaped: true,
			};
		}
		return {
			value: character,
			escaped: false,
		};
	}
	record(character) {
		this.recorded.push(character);
	}
	newEntry(includeEmpty = false) {
		let entry;
		if (this.recorded.length > 0 || includeEmpty) {
			entry = this.recorded.join("");
			if (entry === "NULL" && !includeEmpty) {
				entry = null;
			}
			if (entry !== null) entry = this.transform(entry);
			this.entries.push(entry);
			this.recorded = [];
		}
	}
	consumeDimensions() {
		if (this.source[0] === "[") {
			while (!this.isEof()) {
				const __char = this.nextCharacter();
				if (__char.value === "=") break;
			}
		}
	}
	parse(nested = false) {
		let character, parser, quote;
		this.consumeDimensions();
		while (!this.isEof()) {
			character = this.nextCharacter();
			if (character.value === "{" && !quote) {
				this.dimension++;
				if (this.dimension > 1) {
					parser = new ArrayParser(
						this.source.substr(this.position - 1),
						this.transform,
						this.separator,
					);
					this.entries.push(parser.parse(true));
					this.position += parser.position - 2;
				}
			} else if (character.value === "}" && !quote) {
				this.dimension--;
				if (!this.dimension) {
					this.newEntry();
					if (nested) return this.entries;
				}
			} else if (character.value === '"' && !character.escaped) {
				if (quote) this.newEntry(true);
				quote = !quote;
			} else if (character.value === this.separator && !quote) {
				this.newEntry();
			} else {
				this.record(character.value);
			}
		}
		if (this.dimension !== 0) {
			throw new Error("array dimension not balanced");
		}
		return this.entries;
	}
	source;
	transform;
	separator;
}
const BC_RE = /BC$/;
const DATETIME_RE =
	/^(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?/;
const HEX = 16;
const HEX_PREFIX_REGEX = /^\\x/;
const TIMEZONE_RE = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/;
function decodeBigint(value) {
	return BigInt(value);
}
function decodeBigintArray(value) {
	return parseArray(value, (x) => BigInt(x));
}
function decodeBoolean(value) {
	return value[0] === "t";
}
function decodeBooleanArray(value) {
	return parseArray(value, (x) => x[0] === "t");
}
function decodeBox(value) {
	const [a, b] = value.match(/\(.*?\)/g) || [];
	return {
		a: decodePoint(a),
		b: decodePoint(b),
	};
}
function decodeBoxArray(value) {
	return parseArray(value, decodeBox, ";");
}
function decodeBytea(byteaStr) {
	if (HEX_PREFIX_REGEX.test(byteaStr)) {
		return decodeByteaHex(byteaStr);
	} else {
		return decodeByteaEscape(byteaStr);
	}
}
function decodeByteaArray(value) {
	return parseArray(value, decodeBytea);
}
function decodeByteaEscape(byteaStr) {
	const bytes = [];
	let i = 0;
	let k = 0;
	while (i < byteaStr.length) {
		if (byteaStr[i] !== "\\") {
			bytes.push(byteaStr.charCodeAt(i));
			++i;
		} else {
			if (/[0-7]{3}/.test(byteaStr.substr(i + 1, 3))) {
				bytes.push(parseInt(byteaStr.substr(i + 1, 3), 8));
				i += 4;
			} else {
				let backslashes = 1;
				while (
					i + backslashes < byteaStr.length &&
					byteaStr[i + backslashes] === "\\"
				) {
					backslashes++;
				}
				for (k = 0; k < Math.floor(backslashes / 2); ++k) {
					bytes.push(92);
				}
				i += Math.floor(backslashes / 2) * 2;
			}
		}
	}
	return new Uint8Array(bytes);
}
function decodeByteaHex(byteaStr) {
	const bytesStr = byteaStr.slice(2);
	const bytes = new Uint8Array(bytesStr.length / 2);
	for (let i = 0, j = 0; i < bytesStr.length; i += 2, j++) {
		bytes[j] = parseInt(bytesStr[i] + bytesStr[i + 1], HEX);
	}
	return bytes;
}
function decodeCircle(value) {
	const [point, radius] = value.substring(1, value.length - 1).split(
		/,(?![^(]*\))/,
	);
	return {
		point: decodePoint(point),
		radius: radius,
	};
}
function decodeCircleArray(value) {
	return parseArray(value, decodeCircle);
}
function decodeDate(dateStr) {
	if (dateStr === "infinity") {
		return Number(Infinity);
	} else if (dateStr === "-infinity") {
		return Number(-Infinity);
	}
	return mod2.parse(dateStr, "yyyy-MM-dd");
}
function decodeDateArray(value) {
	return parseArray(value, decodeDate);
}
function decodeDatetime(dateStr) {
	const matches = DATETIME_RE.exec(dateStr);
	if (!matches) {
		return decodeDate(dateStr);
	}
	const isBC = BC_RE.test(dateStr);
	const year = parseInt(matches[1], 10) * (isBC ? -1 : 1);
	const month = parseInt(matches[2], 10) - 1;
	const day = parseInt(matches[3], 10);
	const hour = parseInt(matches[4], 10);
	const minute = parseInt(matches[5], 10);
	const second = parseInt(matches[6], 10);
	const msMatch = matches[7];
	const ms = msMatch ? 1000 * parseFloat(msMatch) : 0;
	let date;
	const offset = decodeTimezoneOffset(dateStr);
	if (offset === null) {
		date = new Date(year, month, day, hour, minute, second, ms);
	} else {
		const utc = Date.UTC(year, month, day, hour, minute, second, ms);
		date = new Date(utc + offset);
	}
	date.setUTCFullYear(year);
	return date;
}
function decodeDatetimeArray(value) {
	return parseArray(value, decodeDatetime);
}
function decodeInt(value) {
	return parseInt(value, 10);
}
function decodeIntArray(value) {
	if (!value) return null;
	return parseArray(value, decodeInt);
}
function decodeJson(value) {
	return JSON.parse(value);
}
function decodeJsonArray(value) {
	return parseArray(value, JSON.parse);
}
function decodeLine(value) {
	const [a, b, c] = value.substring(1, value.length - 1).split(",");
	return {
		a: a,
		b: b,
		c: c,
	};
}
function decodeLineArray(value) {
	return parseArray(value, decodeLine);
}
function decodeLineSegment(value) {
	const [a, b] = value.substring(1, value.length - 1).match(/\(.*?\)/g) || [];
	return {
		a: decodePoint(a),
		b: decodePoint(b),
	};
}
function decodeLineSegmentArray(value) {
	return parseArray(value, decodeLineSegment);
}
function decodePath(value) {
	const points = value.substring(1, value.length - 1).split(/,(?![^(]*\))/);
	return points.map(decodePoint);
}
function decodePathArray(value) {
	return parseArray(value, decodePath);
}
function decodePoint(value) {
	const [x, y] = value.substring(1, value.length - 1).split(",");
	if (Number.isNaN(parseFloat(x)) || Number.isNaN(parseFloat(y))) {
		throw new Error(
			`Invalid point value: "${Number.isNaN(parseFloat(x)) ? x : y}"`,
		);
	}
	return {
		x: x,
		y: y,
	};
}
function decodePointArray(value) {
	return parseArray(value, decodePoint);
}
function decodePolygon(value) {
	return decodePath(value);
}
function decodePolygonArray(value) {
	return parseArray(value, decodePolygon);
}
function decodeStringArray(value) {
	if (!value) return null;
	return parseArray(value, (value) => value);
}
function decodeTimezoneOffset(dateStr) {
	const timeStr = dateStr.split(" ")[1];
	const matches = TIMEZONE_RE.exec(timeStr);
	if (!matches) {
		return null;
	}
	const type = matches[1];
	if (type === "Z") {
		return 0;
	}
	const sign = type === "-" ? 1 : -1;
	const hours = parseInt(matches[2], 10);
	const minutes = parseInt(matches[3] || "0", 10);
	const seconds = parseInt(matches[4] || "0", 10);
	const offset = hours * 3600 + minutes * 60 + seconds;
	return sign * offset * 1000;
}
function decodeTid(value) {
	const [x, y] = value.substring(1, value.length - 1).split(",");
	return [BigInt(x), BigInt(y)];
}
function decodeTidArray(value) {
	return parseArray(value, decodeTid);
}
class Column {
	constructor(
		name,
		tableOid,
		index,
		typeOid,
		columnLength,
		typeModifier,
		format,
	) {
		this.name = name;
		this.tableOid = tableOid;
		this.index = index;
		this.typeOid = typeOid;
		this.columnLength = columnLength;
		this.typeModifier = typeModifier;
		this.format = format;
	}
	name;
	tableOid;
	index;
	typeOid;
	columnLength;
	typeModifier;
	format;
}
var Format;
(function (Format) {
	Format[(Format["TEXT"] = 0)] = "TEXT";
	Format[(Format["BINARY"] = 1)] = "BINARY";
})(Format || (Format = {}));
const decoder = new TextDecoder();
function decodeBinary() {
	throw new Error("Not implemented!");
}
function decodeText(value, typeOid) {
	const strValue = decoder.decode(value);
	switch (typeOid) {
		case Oid.bpchar:
		case Oid.char:
		case Oid.cidr:
		case Oid.float4:
		case Oid.float8:
		case Oid.inet:
		case Oid.macaddr:
		case Oid.name:
		case Oid.numeric:
		case Oid.oid:
		case Oid.regclass:
		case Oid.regconfig:
		case Oid.regdictionary:
		case Oid.regnamespace:
		case Oid.regoper:
		case Oid.regoperator:
		case Oid.regproc:
		case Oid.regprocedure:
		case Oid.regrole:
		case Oid.regtype:
		case Oid.text:
		case Oid.time:
		case Oid.timetz:
		case Oid.uuid:
		case Oid.varchar:
		case Oid.void:
			return strValue;
		case Oid.bpchar_array:
		case Oid.char_array:
		case Oid.cidr_array:
		case Oid.float4_array:
		case Oid.float8_array:
		case Oid.inet_array:
		case Oid.macaddr_array:
		case Oid.name_array:
		case Oid.numeric_array:
		case Oid.oid_array:
		case Oid.regclass_array:
		case Oid.regconfig_array:
		case Oid.regdictionary_array:
		case Oid.regnamespace_array:
		case Oid.regoper_array:
		case Oid.regoperator_array:
		case Oid.regproc_array:
		case Oid.regprocedure_array:
		case Oid.regrole_array:
		case Oid.regtype_array:
		case Oid.text_array:
		case Oid.time_array:
		case Oid.timetz_array:
		case Oid.uuid_array:
		case Oid.varchar_array:
			return decodeStringArray(strValue);
		case Oid.int2:
		case Oid.int4:
		case Oid.xid:
			return decodeInt(strValue);
		case Oid.int2_array:
		case Oid.int4_array:
		case Oid.xid_array:
			return decodeIntArray(strValue);
		case Oid.bool:
			return decodeBoolean(strValue);
		case Oid.bool_array:
			return decodeBooleanArray(strValue);
		case Oid.box:
			return decodeBox(strValue);
		case Oid.box_array:
			return decodeBoxArray(strValue);
		case Oid.circle:
			return decodeCircle(strValue);
		case Oid.circle_array:
			return decodeCircleArray(strValue);
		case Oid.bytea:
			return decodeBytea(strValue);
		case Oid.byte_array:
			return decodeByteaArray(strValue);
		case Oid.date:
			return decodeDate(strValue);
		case Oid.date_array:
			return decodeDateArray(strValue);
		case Oid.int8:
			return decodeBigint(strValue);
		case Oid.int8_array:
			return decodeBigintArray(strValue);
		case Oid.json:
		case Oid.jsonb:
			return decodeJson(strValue);
		case Oid.json_array:
		case Oid.jsonb_array:
			return decodeJsonArray(strValue);
		case Oid.line:
			return decodeLine(strValue);
		case Oid.line_array:
			return decodeLineArray(strValue);
		case Oid.lseg:
			return decodeLineSegment(strValue);
		case Oid.lseg_array:
			return decodeLineSegmentArray(strValue);
		case Oid.path:
			return decodePath(strValue);
		case Oid.path_array:
			return decodePathArray(strValue);
		case Oid.point:
			return decodePoint(strValue);
		case Oid.point_array:
			return decodePointArray(strValue);
		case Oid.polygon:
			return decodePolygon(strValue);
		case Oid.polygon_array:
			return decodePolygonArray(strValue);
		case Oid.tid:
			return decodeTid(strValue);
		case Oid.tid_array:
			return decodeTidArray(strValue);
		case Oid.timestamp:
		case Oid.timestamptz:
			return decodeDatetime(strValue);
		case Oid.timestamp_array:
		case Oid.timestamptz_array:
			return decodeDatetimeArray(strValue);
		default:
			return strValue;
	}
}
function decode2(value, column) {
	if (column.format === Format.BINARY) {
		return decodeBinary();
	} else if (column.format === Format.TEXT) {
		return decodeText(value, column.typeOid);
	} else {
		throw new Error(`Unknown column format: ${column.format}`);
	}
}
function pad(number, digits) {
	let padded = "" + number;
	while (padded.length < digits) {
		padded = "0" + padded;
	}
	return padded;
}
function encodeDate(date) {
	const year = pad(date.getFullYear(), 4);
	const month = pad(date.getMonth() + 1, 2);
	const day = pad(date.getDate(), 2);
	const hour = pad(date.getHours(), 2);
	const min = pad(date.getMinutes(), 2);
	const sec = pad(date.getSeconds(), 2);
	const ms = pad(date.getMilliseconds(), 3);
	const encodedDate = `${year}-${month}-${day}T${hour}:${min}:${sec}.${ms}`;
	const offset = date.getTimezoneOffset();
	const tzSign = offset > 0 ? "-" : "+";
	const absOffset = Math.abs(offset);
	const tzHours = pad(Math.floor(absOffset / 60), 2);
	const tzMinutes = pad(Math.floor(absOffset % 60), 2);
	const encodedTz = `${tzSign}${tzHours}:${tzMinutes}`;
	return encodedDate + encodedTz;
}
function escapeArrayElement(value) {
	const strValue = value.toString();
	const escapedValue = strValue.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
	return `"${escapedValue}"`;
}
function encodeArray(array) {
	let encodedArray = "{";
	array.forEach((element, index) => {
		if (index > 0) {
			encodedArray += ",";
		}
		if (element === null || typeof element === "undefined") {
			encodedArray += "NULL";
		} else if (Array.isArray(element)) {
			encodedArray += encodeArray(element);
		} else if (element instanceof Uint8Array) {
			throw new Error("Can't encode array of buffers.");
		} else {
			const encodedElement = encodeArgument(element);
			encodedArray += escapeArrayElement(encodedElement);
		}
	});
	encodedArray += "}";
	return encodedArray;
}
function encodeBytes(value) {
	const hex = Array.from(value)
		.map((val) => (val < 0x10 ? `0${val.toString(16)}` : val.toString(16)))
		.join("");
	return `\\x${hex}`;
}
function encodeArgument(value) {
	if (value === null || typeof value === "undefined") {
		return null;
	} else if (value instanceof Uint8Array) {
		return encodeBytes(value);
	} else if (value instanceof Date) {
		return encodeDate(value);
	} else if (value instanceof Array) {
		return encodeArray(value);
	} else if (value instanceof Object) {
		return JSON.stringify(value);
	} else {
		return String(value);
	}
}
const commandTagRegexp = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/;
var ResultType;
(function (ResultType) {
	ResultType[(ResultType["ARRAY"] = 0)] = "ARRAY";
	ResultType[(ResultType["OBJECT"] = 1)] = "OBJECT";
})(ResultType || (ResultType = {}));
class RowDescription {
	constructor(columnCount, columns) {
		this.columnCount = columnCount;
		this.columns = columns;
	}
	columnCount;
	columns;
}
function templateStringToQuery(template, args, result_type) {
	const text = template.reduce((curr, next, index) => {
		return `${curr}$${index}${next}`;
	});
	return new Query(text, result_type, args);
}
function objectQueryToQueryArgs(query, args) {
	args = normalizeObjectQueryArgs(args);
	let counter = 0;
	const clean_args = [];
	const clean_query = query.replaceAll(/(?<=\$)\w+/g, (match) => {
		match = match.toLowerCase();
		if (match in args) {
			clean_args.push(args[match]);
		} else {
			throw new Error(
				`No value was provided for the query argument "${match}"`,
			);
		}
		return String(++counter);
	});
	return [clean_query, clean_args];
}
function normalizeObjectQueryArgs(args) {
	const normalized_args = Object.fromEntries(
		Object.entries(args).map(([key, value]) => [key.toLowerCase(), value]),
	);
	if (Object.keys(normalized_args).length !== Object.keys(args).length) {
		throw new Error(
			"The arguments provided for the query must be unique (insensitive)",
		);
	}
	return normalized_args;
}
class QueryResult {
	command;
	rowCount;
	#row_description;
	warnings;
	get rowDescription() {
		return this.#row_description;
	}
	set rowDescription(row_description) {
		if (row_description && !this.#row_description) {
			this.#row_description = row_description;
		}
	}
	constructor(query) {
		this.query = query;
		this.warnings = [];
	}
	loadColumnDescriptions(description) {
		this.rowDescription = description;
	}
	handleCommandComplete(commandTag) {
		const match = commandTagRegexp.exec(commandTag);
		if (match) {
			this.command = match[1];
			if (match[3]) {
				this.rowCount = parseInt(match[3], 10);
			} else {
				this.rowCount = parseInt(match[2], 10);
			}
		}
	}
	insertRow(_row) {
		throw new Error("No implementation for insertRow is defined");
	}
	query;
}
class QueryArrayResult extends QueryResult {
	rows = [];
	insertRow(row_data) {
		if (!this.rowDescription) {
			throw new Error(
				"The row descriptions required to parse the result data weren't initialized",
			);
		}
		const row = row_data.map((raw_value, index) => {
			const column = this.rowDescription.columns[index];
			if (raw_value === null) {
				return null;
			}
			return decode2(raw_value, column);
		});
		this.rows.push(row);
	}
}
function findDuplicatesInArray(array) {
	return array.reduce((duplicates, item, index) => {
		const is_duplicate = array.indexOf(item) !== index;
		if (is_duplicate && !duplicates.includes(item)) {
			duplicates.push(item);
		}
		return duplicates;
	}, []);
}
function snakecaseToCamelcase(input) {
	return input.split("_").reduce((res, word, i) => {
		if (i !== 0) {
			word = word[0].toUpperCase() + word.slice(1);
		}
		res += word;
		return res;
	}, "");
}
class QueryObjectResult extends QueryResult {
	columns;
	rows = [];
	insertRow(row_data) {
		if (!this.rowDescription) {
			throw new Error(
				"The row description required to parse the result data wasn't initialized",
			);
		}
		if (!this.columns) {
			if (this.query.fields) {
				if (this.rowDescription.columns.length !== this.query.fields.length) {
					throw new RangeError(
						"The fields provided for the query don't match the ones returned as a result " +
							`(${this.rowDescription.columns.length} expected, ${this.query.fields.length} received)`,
					);
				}
				this.columns = this.query.fields;
			} else {
				let column_names;
				if (this.query.camelcase) {
					column_names = this.rowDescription.columns.map(
						(column) => snakecaseToCamelcase(column.name),
					);
				} else {
					column_names = this.rowDescription.columns.map(
						(column) => column.name,
					);
				}
				const duplicates = findDuplicatesInArray(column_names);
				if (duplicates.length) {
					throw new Error(
						`Field names ${duplicates.map((str) => `"${str}"`).join(
							", ",
						)} are duplicated in the result of the query`,
					);
				}
				this.columns = column_names;
			}
		}
		const columns = this.columns;
		if (columns.length !== row_data.length) {
			throw new RangeError(
				"The result fields returned by the database don't match the defined structure of the result",
			);
		}
		const row = row_data.reduce((row, raw_value, index) => {
			const current_column = this.rowDescription.columns[index];
			if (raw_value === null) {
				row[columns[index]] = null;
			} else {
				row[columns[index]] = decode2(raw_value, current_column);
			}
			return row;
		}, {});
		this.rows.push(row);
	}
}
class Query {
	args;
	camelcase;
	fields;
	result_type;
	text;
	constructor(config_or_text, result_type, args = []) {
		this.result_type = result_type;
		if (typeof config_or_text === "string") {
			if (!Array.isArray(args)) {
				[config_or_text, args] = objectQueryToQueryArgs(config_or_text, args);
			}
			this.text = config_or_text;
			this.args = args.map(encodeArgument);
		} else {
			let {
				args: args1 = [],
				camelcase,
				encoder = encodeArgument,
				fields,
				name,
				text,
			} = config_or_text;
			if (fields) {
				const fields_are_clean = fields.every(
					(field) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field),
				);
				if (!fields_are_clean) {
					throw new TypeError(
						"The fields provided for the query must contain only letters and underscores",
					);
				}
				if (new Set(fields).size !== fields.length) {
					throw new TypeError(
						"The fields provided for the query must be unique",
					);
				}
				this.fields = fields;
			}
			this.camelcase = camelcase;
			if (!Array.isArray(args1)) {
				[text, args1] = objectQueryToQueryArgs(text, args1);
			}
			this.args = args1.map(encoder);
			this.text = text;
		}
	}
}
class Message {
	reader;
	constructor(type, byteCount, body) {
		this.type = type;
		this.byteCount = byteCount;
		this.body = body;
		this.reader = new PacketReader(body);
	}
	type;
	byteCount;
	body;
}
function parseBackendKeyMessage(message) {
	return {
		pid: message.reader.readInt32(),
		secret_key: message.reader.readInt32(),
	};
}
function parseCommandCompleteMessage(message) {
	return message.reader.readString(message.byteCount);
}
function parseNoticeMessage(message) {
	const error_fields = {};
	let __byte;
	let field_code;
	let field_value;
	while ((__byte = message.reader.readByte())) {
		field_code = String.fromCharCode(__byte);
		field_value = message.reader.readCString();
		switch (field_code) {
			case "S":
				error_fields.severity = field_value;
				break;
			case "C":
				error_fields.code = field_value;
				break;
			case "M":
				error_fields.message = field_value;
				break;
			case "D":
				error_fields.detail = field_value;
				break;
			case "H":
				error_fields.hint = field_value;
				break;
			case "P":
				error_fields.position = field_value;
				break;
			case "p":
				error_fields.internalPosition = field_value;
				break;
			case "q":
				error_fields.internalQuery = field_value;
				break;
			case "W":
				error_fields.where = field_value;
				break;
			case "s":
				error_fields.schema = field_value;
				break;
			case "t":
				error_fields.table = field_value;
				break;
			case "c":
				error_fields.column = field_value;
				break;
			case "d":
				error_fields.dataTypeName = field_value;
				break;
			case "n":
				error_fields.constraint = field_value;
				break;
			case "F":
				error_fields.file = field_value;
				break;
			case "L":
				error_fields.line = field_value;
				break;
			case "R":
				error_fields.routine = field_value;
				break;
			default:
				break;
		}
	}
	return error_fields;
}
function parseRowDataMessage(message) {
	const field_count = message.reader.readInt16();
	const row = [];
	for (let i = 0; i < field_count; i++) {
		const col_length = message.reader.readInt32();
		if (col_length == -1) {
			row.push(null);
			continue;
		}
		row.push(message.reader.readBytes(col_length));
	}
	return row;
}
function parseRowDescriptionMessage(message) {
	const column_count = message.reader.readInt16();
	const columns = [];
	for (let i = 0; i < column_count; i++) {
		const column = new Column(
			message.reader.readCString(),
			message.reader.readInt32(),
			message.reader.readInt16(),
			message.reader.readInt32(),
			message.reader.readInt16(),
			message.reader.readInt32(),
			message.reader.readInt16(),
		);
		columns.push(column);
	}
	return new RowDescription(column_count, columns);
}
const defaultNonceSize = 16;
const text_encoder = new TextEncoder();
var AuthenticationState;
(function (AuthenticationState) {
	AuthenticationState[(AuthenticationState["Init"] = 0)] = "Init";
	AuthenticationState[(AuthenticationState["ClientChallenge"] = 1)] =
		"ClientChallenge";
	AuthenticationState[(AuthenticationState["ServerChallenge"] = 2)] =
		"ServerChallenge";
	AuthenticationState[(AuthenticationState["ClientResponse"] = 3)] =
		"ClientResponse";
	AuthenticationState[(AuthenticationState["ServerResponse"] = 4)] =
		"ServerResponse";
	AuthenticationState[(AuthenticationState["Failed"] = 5)] = "Failed";
})(AuthenticationState || (AuthenticationState = {}));
var Reason;
(function (Reason) {
	Reason["BadMessage"] = "server sent an ill-formed message";
	Reason["BadServerNonce"] = "server sent an invalid nonce";
	Reason["BadSalt"] = "server specified an invalid salt";
	Reason["BadIterationCount"] = "server specified an invalid iteration count";
	Reason["BadVerifier"] = "server sent a bad verifier";
	Reason["Rejected"] = "rejected by server";
})(Reason || (Reason = {}));
function assert1(cond) {
	if (!cond) {
		throw new Error("Scram protocol assertion failed");
	}
}
function assertValidScramString(str) {
	const unsafe = /[^\x21-\x7e]/;
	if (unsafe.test(str)) {
		throw new Error(
			"scram username/password is currently limited to safe ascii characters",
		);
	}
}
async function computeScramSignature(message, raw_key) {
	const key = await crypto.subtle.importKey(
		"raw",
		raw_key,
		{
			name: "HMAC",
			hash: "SHA-256",
		},
		false,
		["sign"],
	);
	return new Uint8Array(
		await crypto.subtle.sign(
			{
				name: "HMAC",
				hash: "SHA-256",
			},
			key,
			text_encoder.encode(message),
		),
	);
}
function computeScramProof(signature, key) {
	const digest = new Uint8Array(signature.length);
	for (let i = 0; i < digest.length; i++) {
		digest[i] = signature[i] ^ key[i];
	}
	return digest;
}
async function deriveKeySignatures(password, salt, iterations) {
	const pbkdf2_password = await crypto.subtle.importKey(
		"raw",
		text_encoder.encode(password),
		"PBKDF2",
		false,
		["deriveBits", "deriveKey"],
	);
	const key = await crypto.subtle.deriveKey(
		{
			hash: "SHA-256",
			iterations,
			name: "PBKDF2",
			salt,
		},
		pbkdf2_password,
		{
			name: "HMAC",
			hash: "SHA-256",
		},
		false,
		["sign"],
	);
	const client = new Uint8Array(
		await crypto.subtle.sign("HMAC", key, text_encoder.encode("Client Key")),
	);
	const server = new Uint8Array(
		await crypto.subtle.sign("HMAC", key, text_encoder.encode("Server Key")),
	);
	const stored = new Uint8Array(await crypto.subtle.digest("SHA-256", client));
	return {
		client,
		server,
		stored,
	};
}
function escape(str) {
	return str.replace(/=/g, "=3D").replace(/,/g, "=2C");
}
function generateRandomNonce(size) {
	return mod.encode(crypto.getRandomValues(new Uint8Array(size)));
}
function parseScramAttributes(message) {
	const attrs = {};
	for (const entry of message.split(",")) {
		const pos = entry.indexOf("=");
		if (pos < 1) {
			throw new Error(Reason.BadMessage);
		}
		const key = entry.substr(0, pos);
		const value = entry.substr(pos + 1);
		attrs[key] = value;
	}
	return attrs;
}
class Client {
	#auth_message;
	#client_nonce;
	#key_signatures;
	#password;
	#server_nonce;
	#state;
	#username;
	constructor(username, password, nonce) {
		assertValidScramString(password);
		assertValidScramString(username);
		this.#auth_message = "";
		this.#client_nonce = nonce ?? generateRandomNonce(defaultNonceSize);
		this.#password = password;
		this.#state = AuthenticationState.Init;
		this.#username = escape(username);
	}
	composeChallenge() {
		assert1(this.#state === AuthenticationState.Init);
		try {
			const header = "n,,";
			const challenge = `n=${this.#username},r=${this.#client_nonce}`;
			const message = header + challenge;
			this.#auth_message += challenge;
			this.#state = AuthenticationState.ClientChallenge;
			return message;
		} catch (e) {
			this.#state = AuthenticationState.Failed;
			throw e;
		}
	}
	async receiveChallenge(challenge) {
		assert1(this.#state === AuthenticationState.ClientChallenge);
		try {
			const attrs = parseScramAttributes(challenge);
			const nonce = attrs.r;
			if (!attrs.r || !attrs.r.startsWith(this.#client_nonce)) {
				throw new Error(Reason.BadServerNonce);
			}
			this.#server_nonce = nonce;
			let salt;
			if (!attrs.s) {
				throw new Error(Reason.BadSalt);
			}
			try {
				salt = mod.decode(attrs.s);
			} catch {
				throw new Error(Reason.BadSalt);
			}
			const iterCount = parseInt(attrs.i) | 0;
			if (iterCount <= 0) {
				throw new Error(Reason.BadIterationCount);
			}
			this.#key_signatures = await deriveKeySignatures(
				this.#password,
				salt,
				iterCount,
			);
			this.#auth_message += "," + challenge;
			this.#state = AuthenticationState.ServerChallenge;
		} catch (e) {
			this.#state = AuthenticationState.Failed;
			throw e;
		}
	}
	async composeResponse() {
		assert1(this.#state === AuthenticationState.ServerChallenge);
		assert1(this.#key_signatures);
		assert1(this.#server_nonce);
		try {
			const responseWithoutProof = `c=biws,r=${this.#server_nonce}`;
			this.#auth_message += "," + responseWithoutProof;
			const proof = mod.encode(
				computeScramProof(
					await computeScramSignature(
						this.#auth_message,
						this.#key_signatures.stored,
					),
					this.#key_signatures.client,
				),
			);
			const message = `${responseWithoutProof},p=${proof}`;
			this.#state = AuthenticationState.ClientResponse;
			return message;
		} catch (e) {
			this.#state = AuthenticationState.Failed;
			throw e;
		}
	}
	async receiveResponse(response) {
		assert1(this.#state === AuthenticationState.ClientResponse);
		assert1(this.#key_signatures);
		try {
			const attrs = parseScramAttributes(response);
			if (attrs.e) {
				throw new Error(attrs.e ?? Reason.Rejected);
			}
			const verifier = mod.encode(
				await computeScramSignature(
					this.#auth_message,
					this.#key_signatures.server,
				),
			);
			if (attrs.v !== verifier) {
				throw new Error(Reason.BadVerifier);
			}
			this.#state = AuthenticationState.ServerResponse;
		} catch (e) {
			this.#state = AuthenticationState.Failed;
			throw e;
		}
	}
}
class ConnectionError extends Error {
	constructor(message) {
		super(message);
		this.name = "ConnectionError";
	}
}
class ConnectionParamsError extends Error {
	constructor(message, cause) {
		super(message, {
			cause,
		});
		this.name = "ConnectionParamsError";
	}
}
class PostgresError extends Error {
	fields;
	constructor(fields) {
		super(fields.message);
		this.fields = fields;
		this.name = "PostgresError";
	}
}
class TransactionError extends Error {
	constructor(transaction_name, cause) {
		super(`The transaction "${transaction_name}" has been aborted`, {
			cause,
		});
		this.name = "TransactionError";
	}
}
const ERROR_MESSAGE = "E";
const AUTHENTICATION_TYPE = {
	CLEAR_TEXT: 3,
	GSS_CONTINUE: 8,
	GSS_STARTUP: 7,
	MD5: 5,
	NO_AUTHENTICATION: 0,
	SASL_CONTINUE: 11,
	SASL_FINAL: 12,
	SASL_STARTUP: 10,
	SCM: 6,
	SSPI: 9,
};
const INCOMING_AUTHENTICATION_MESSAGES = {
	AUTHENTICATION: "R",
	BACKEND_KEY: "K",
	PARAMETER_STATUS: "S",
	READY: "Z",
};
const INCOMING_TLS_MESSAGES = {
	ACCEPTS_TLS: "S",
	NO_ACCEPTS_TLS: "N",
};
const INCOMING_QUERY_MESSAGES = {
	BIND_COMPLETE: "2",
	PARSE_COMPLETE: "1",
	COMMAND_COMPLETE: "C",
	DATA_ROW: "D",
	EMPTY_QUERY: "I",
	NO_DATA: "n",
	NOTICE_WARNING: "N",
	PARAMETER_STATUS: "S",
	READY: "Z",
	ROW_DESCRIPTION: "T",
};
const encoder = new TextEncoder();
const decoder1 = new TextDecoder();
async function md5(bytes) {
	return decoder1.decode(
		mod1.encode(new Uint8Array(await stdCrypto.subtle.digest("MD5", bytes))),
	);
}
async function hashMd5Password(password, username, salt) {
	const innerHash = await md5(encoder.encode(password + username));
	const innerBytes = encoder.encode(innerHash);
	const outerBuffer = new Uint8Array(innerBytes.length + salt.length);
	outerBuffer.set(innerBytes);
	outerBuffer.set(salt, innerBytes.length);
	const outerHash = await md5(outerBuffer);
	return "md5" + outerHash;
}
function assertSuccessfulStartup(msg) {
	switch (msg.type) {
		case ERROR_MESSAGE:
			throw new PostgresError(parseNoticeMessage(msg));
	}
}
function assertSuccessfulAuthentication(auth_message) {
	if (auth_message.type === ERROR_MESSAGE) {
		throw new PostgresError(parseNoticeMessage(auth_message));
	}
	if (auth_message.type !== INCOMING_AUTHENTICATION_MESSAGES.AUTHENTICATION) {
		throw new Error(`Unexpected auth response: ${auth_message.type}.`);
	}
	const responseCode = auth_message.reader.readInt32();
	if (responseCode !== 0) {
		throw new Error(`Unexpected auth response code: ${responseCode}.`);
	}
}
function logNotice(notice) {
	console.error(`${bold(yellow(notice.severity))}: ${notice.message}`);
}
const decoder2 = new TextDecoder();
const encoder1 = new TextEncoder();
class Connection {
	#bufReader;
	#bufWriter;
	#conn;
	connected = false;
	#connection_params;
	#message_header = new Uint8Array(5);
	#onDisconnection;
	#packetWriter = new PacketWriter();
	#pid;
	#queryLock = new DeferredStack(1, [undefined]);
	#secretKey;
	#tls;
	#transport;
	get pid() {
		return this.#pid;
	}
	get tls() {
		return this.#tls;
	}
	get transport() {
		return this.#transport;
	}
	constructor(connection_params, disconnection_callback) {
		this.#connection_params = connection_params;
		this.#onDisconnection = disconnection_callback;
	}
	async #readMessage() {
		this.#message_header.fill(0);
		await this.#bufReader.readFull(this.#message_header);
		const type = decoder2.decode(this.#message_header.slice(0, 1));
		if (type === "\x00") {
			throw new ConnectionError("The session was terminated unexpectedly");
		}
		const length = readUInt32BE(this.#message_header, 1) - 4;
		const body = new Uint8Array(length);
		await this.#bufReader.readFull(body);
		return new Message(type, length, body);
	}
	async #serverAcceptsTLS() {
		const writer = this.#packetWriter;
		writer.clear();
		writer.addInt32(8).addInt32(80877103).join();
		await this.#bufWriter.write(writer.flush());
		await this.#bufWriter.flush();
		const response = new Uint8Array(1);
		await this.#conn.read(response);
		switch (String.fromCharCode(response[0])) {
			case INCOMING_TLS_MESSAGES.ACCEPTS_TLS:
				return true;
			case INCOMING_TLS_MESSAGES.NO_ACCEPTS_TLS:
				return false;
			default:
				throw new Error(
					`Could not check if server accepts SSL connections, server responded with: ${response}`,
				);
		}
	}
	async #sendStartupMessage() {
		const writer1 = this.#packetWriter;
		writer1.clear();
		writer1.addInt16(3).addInt16(0);
		writer1.addCString("client_encoding").addCString("'utf-8'");
		writer1.addCString("user").addCString(this.#connection_params.user);
		writer1.addCString("database").addCString(this.#connection_params.database);
		writer1.addCString("application_name").addCString(
			this.#connection_params.applicationName,
		);
		const connection_options = Object.entries(this.#connection_params.options);
		if (connection_options.length > 0) {
			writer1.addCString("options").addCString(
				connection_options.map(([key, value]) => `--${key}=${value}`).join(" "),
			);
		}
		writer1.addCString("");
		const bodyBuffer = writer1.flush();
		const bodyLength = bodyBuffer.length + 4;
		writer1.clear();
		const finalBuffer = writer1.addInt32(bodyLength).add(bodyBuffer).join();
		await this.#bufWriter.write(finalBuffer);
		await this.#bufWriter.flush();
		return await this.#readMessage();
	}
	async #openConnection(options) {
		this.#conn = await Deno.connect(options);
		this.#bufWriter = new BufWriter(this.#conn);
		this.#bufReader = new BufReader(this.#conn);
	}
	async #openSocketConnection(path2, port) {
		if (Deno.build.os === "windows") {
			throw new Error("Socket connection is only available on UNIX systems");
		}
		const socket = await Deno.stat(path2);
		if (socket.isFile) {
			await this.#openConnection({
				path: path2,
				transport: "unix",
			});
		} else {
			const socket_guess = join3(path2, getSocketName(port));
			try {
				await this.#openConnection({
					path: socket_guess,
					transport: "unix",
				});
			} catch (e) {
				if (e instanceof Deno.errors.NotFound) {
					throw new ConnectionError(
						`Could not open socket in path "${socket_guess}"`,
					);
				}
				throw e;
			}
		}
	}
	async #openTlsConnection(connection, options1) {
		this.#conn = await Deno.startTls(connection, options1);
		this.#bufWriter = new BufWriter(this.#conn);
		this.#bufReader = new BufReader(this.#conn);
	}
	#resetConnectionMetadata() {
		this.connected = false;
		this.#packetWriter = new PacketWriter();
		this.#pid = undefined;
		this.#queryLock = new DeferredStack(1, [undefined]);
		this.#secretKey = undefined;
		this.#tls = undefined;
		this.#transport = undefined;
	}
	#closeConnection() {
		try {
			this.#conn.close();
		} catch (_e) {
		} finally {
			this.#resetConnectionMetadata();
		}
	}
	async #startup() {
		this.#closeConnection();
		const {
			hostname,
			host_type,
			port: port1,
			tls: { enabled: tls_enabled, enforce: tls_enforced, caCertificates },
		} = this.#connection_params;
		if (host_type === "socket") {
			await this.#openSocketConnection(hostname, port1);
			this.#tls = undefined;
			this.#transport = "socket";
		} else {
			await this.#openConnection({
				hostname,
				port: port1,
				transport: "tcp",
			});
			this.#tls = false;
			this.#transport = "tcp";
			if (tls_enabled) {
				const accepts_tls = await this.#serverAcceptsTLS().catch((e) => {
					this.#closeConnection();
					throw e;
				});
				if (accepts_tls) {
					try {
						await this.#openTlsConnection(this.#conn, {
							hostname,
							caCerts: caCertificates,
						});
						this.#tls = true;
					} catch (e1) {
						if (!tls_enforced) {
							console.error(
								bold(yellow("TLS connection failed with message: ")) +
									e1.message +
									"\n" +
									bold("Defaulting to non-encrypted connection"),
							);
							await this.#openConnection({
								hostname,
								port: port1,
								transport: "tcp",
							});
							this.#tls = false;
						} else {
							throw e1;
						}
					}
				} else if (tls_enforced) {
					this.#closeConnection();
					throw new Error(
						"The server isn't accepting TLS connections. Change the client configuration so TLS configuration isn't required to connect",
					);
				}
			}
		}
		try {
			let startup_response;
			try {
				startup_response = await this.#sendStartupMessage();
			} catch (e2) {
				this.#closeConnection();
				if (e2 instanceof Deno.errors.InvalidData && tls_enabled) {
					if (tls_enforced) {
						throw new Error(
							"The certificate used to secure the TLS connection is invalid.",
						);
					} else {
						console.error(
							bold(yellow("TLS connection failed with message: ")) +
								e2.message +
								"\n" +
								bold("Defaulting to non-encrypted connection"),
						);
						await this.#openConnection({
							hostname,
							port: port1,
							transport: "tcp",
						});
						this.#tls = false;
						this.#transport = "tcp";
						startup_response = await this.#sendStartupMessage();
					}
				} else {
					throw e2;
				}
			}
			assertSuccessfulStartup(startup_response);
			await this.#authenticate(startup_response);
			let message = await this.#readMessage();
			while (message.type !== INCOMING_AUTHENTICATION_MESSAGES.READY) {
				switch (message.type) {
					case ERROR_MESSAGE:
						await this.#processErrorUnsafe(message, false);
						break;
					case INCOMING_AUTHENTICATION_MESSAGES.BACKEND_KEY: {
						const { pid, secret_key } = parseBackendKeyMessage(message);
						this.#pid = pid;
						this.#secretKey = secret_key;
						break;
					}
					case INCOMING_AUTHENTICATION_MESSAGES.PARAMETER_STATUS:
						break;
					default:
						throw new Error(`Unknown response for startup: ${message.type}`);
				}
				message = await this.#readMessage();
			}
			this.connected = true;
		} catch (e3) {
			this.#closeConnection();
			throw e3;
		}
	}
	async startup(is_reconnection) {
		if (is_reconnection && this.#connection_params.connection.attempts === 0) {
			throw new Error(
				"The client has been disconnected from the database. Enable reconnection in the client to attempt reconnection after failure",
			);
		}
		let reconnection_attempts = 0;
		const max_reconnections = this.#connection_params.connection.attempts;
		let error;
		if (!is_reconnection && this.#connection_params.connection.attempts === 0) {
			try {
				await this.#startup();
			} catch (e) {
				error = e;
			}
		} else {
			let interval =
				typeof this.#connection_params.connection.interval === "number"
					? this.#connection_params.connection.interval
					: 0;
			while (reconnection_attempts < max_reconnections) {
				if (reconnection_attempts > 0) {
					if (
						typeof this.#connection_params.connection.interval === "function"
					) {
						interval = this.#connection_params.connection.interval(interval);
					}
					if (interval > 0) {
						await delay(interval);
					}
				}
				try {
					await this.#startup();
					break;
				} catch (e1) {
					reconnection_attempts++;
					if (reconnection_attempts === max_reconnections) {
						error = e1;
					}
				}
			}
		}
		if (error) {
			await this.end();
			throw error;
		}
	}
	async #authenticate(authentication_request) {
		const authentication_type = authentication_request.reader.readInt32();
		let authentication_result;
		switch (authentication_type) {
			case AUTHENTICATION_TYPE.NO_AUTHENTICATION:
				authentication_result = authentication_request;
				break;
			case AUTHENTICATION_TYPE.CLEAR_TEXT:
				authentication_result = await this.#authenticateWithClearPassword();
				break;
			case AUTHENTICATION_TYPE.MD5: {
				const salt = authentication_request.reader.readBytes(4);
				authentication_result = await this.#authenticateWithMd5(salt);
				break;
			}
			case AUTHENTICATION_TYPE.SCM:
				throw new Error(
					"Database server expected SCM authentication, which is not supported at the moment",
				);
			case AUTHENTICATION_TYPE.GSS_STARTUP:
				throw new Error(
					"Database server expected GSS authentication, which is not supported at the moment",
				);
			case AUTHENTICATION_TYPE.GSS_CONTINUE:
				throw new Error(
					"Database server expected GSS authentication, which is not supported at the moment",
				);
			case AUTHENTICATION_TYPE.SSPI:
				throw new Error(
					"Database server expected SSPI authentication, which is not supported at the moment",
				);
			case AUTHENTICATION_TYPE.SASL_STARTUP:
				authentication_result = await this.#authenticateWithSasl();
				break;
			default:
				throw new Error(`Unknown auth message code ${authentication_type}`);
		}
		await assertSuccessfulAuthentication(authentication_result);
	}
	async #authenticateWithClearPassword() {
		this.#packetWriter.clear();
		const password = this.#connection_params.password || "";
		const buffer = this.#packetWriter.addCString(password).flush(0x70);
		await this.#bufWriter.write(buffer);
		await this.#bufWriter.flush();
		return this.#readMessage();
	}
	async #authenticateWithMd5(salt1) {
		this.#packetWriter.clear();
		if (!this.#connection_params.password) {
			throw new ConnectionParamsError(
				"Attempting MD5 authentication with unset password",
			);
		}
		const password1 = await hashMd5Password(
			this.#connection_params.password,
			this.#connection_params.user,
			salt1,
		);
		const buffer1 = this.#packetWriter.addCString(password1).flush(0x70);
		await this.#bufWriter.write(buffer1);
		await this.#bufWriter.flush();
		return this.#readMessage();
	}
	async #authenticateWithSasl() {
		if (!this.#connection_params.password) {
			throw new ConnectionParamsError(
				"Attempting SASL auth with unset password",
			);
		}
		const client = new Client(
			this.#connection_params.user,
			this.#connection_params.password,
		);
		const utf8 = new TextDecoder("utf-8");
		const clientFirstMessage = client.composeChallenge();
		this.#packetWriter.clear();
		this.#packetWriter.addCString("SCRAM-SHA-256");
		this.#packetWriter.addInt32(clientFirstMessage.length);
		this.#packetWriter.addString(clientFirstMessage);
		this.#bufWriter.write(this.#packetWriter.flush(0x70));
		this.#bufWriter.flush();
		const maybe_sasl_continue = await this.#readMessage();
		switch (maybe_sasl_continue.type) {
			case INCOMING_AUTHENTICATION_MESSAGES.AUTHENTICATION: {
				const authentication_type1 = maybe_sasl_continue.reader.readInt32();
				if (authentication_type1 !== AUTHENTICATION_TYPE.SASL_CONTINUE) {
					throw new Error(
						`Unexpected authentication type in SASL negotiation: ${authentication_type1}`,
					);
				}
				break;
			}
			case ERROR_MESSAGE:
				throw new PostgresError(parseNoticeMessage(maybe_sasl_continue));
			default:
				throw new Error(
					`Unexpected message in SASL negotiation: ${maybe_sasl_continue.type}`,
				);
		}
		const sasl_continue = utf8.decode(
			maybe_sasl_continue.reader.readAllBytes(),
		);
		await client.receiveChallenge(sasl_continue);
		this.#packetWriter.clear();
		this.#packetWriter.addString(await client.composeResponse());
		this.#bufWriter.write(this.#packetWriter.flush(0x70));
		this.#bufWriter.flush();
		const maybe_sasl_final = await this.#readMessage();
		switch (maybe_sasl_final.type) {
			case INCOMING_AUTHENTICATION_MESSAGES.AUTHENTICATION: {
				const authentication_type2 = maybe_sasl_final.reader.readInt32();
				if (authentication_type2 !== AUTHENTICATION_TYPE.SASL_FINAL) {
					throw new Error(
						`Unexpected authentication type in SASL finalization: ${authentication_type2}`,
					);
				}
				break;
			}
			case ERROR_MESSAGE:
				throw new PostgresError(parseNoticeMessage(maybe_sasl_final));
			default:
				throw new Error(
					`Unexpected message in SASL finalization: ${maybe_sasl_continue.type}`,
				);
		}
		const sasl_final = utf8.decode(maybe_sasl_final.reader.readAllBytes());
		await client.receiveResponse(sasl_final);
		return this.#readMessage();
	}
	async #simpleQuery(query) {
		this.#packetWriter.clear();
		const buffer2 = this.#packetWriter.addCString(query.text).flush(0x51);
		await this.#bufWriter.write(buffer2);
		await this.#bufWriter.flush();
		let result;
		if (query.result_type === ResultType.ARRAY) {
			result = new QueryArrayResult(query);
		} else {
			result = new QueryObjectResult(query);
		}
		let error;
		let current_message = await this.#readMessage();
		while (current_message.type !== INCOMING_QUERY_MESSAGES.READY) {
			switch (current_message.type) {
				case ERROR_MESSAGE:
					error = new PostgresError(parseNoticeMessage(current_message));
					break;
				case INCOMING_QUERY_MESSAGES.COMMAND_COMPLETE: {
					result.handleCommandComplete(
						parseCommandCompleteMessage(current_message),
					);
					break;
				}
				case INCOMING_QUERY_MESSAGES.DATA_ROW: {
					const row_data = parseRowDataMessage(current_message);
					try {
						result.insertRow(row_data);
					} catch (e4) {
						error = e4;
					}
					break;
				}
				case INCOMING_QUERY_MESSAGES.EMPTY_QUERY:
					break;
				case INCOMING_QUERY_MESSAGES.NOTICE_WARNING: {
					const notice = parseNoticeMessage(current_message);
					logNotice(notice);
					result.warnings.push(notice);
					break;
				}
				case INCOMING_QUERY_MESSAGES.PARAMETER_STATUS:
					break;
				case INCOMING_QUERY_MESSAGES.READY:
					break;
				case INCOMING_QUERY_MESSAGES.ROW_DESCRIPTION: {
					result.loadColumnDescriptions(
						parseRowDescriptionMessage(current_message),
					);
					break;
				}
				default:
					throw new Error(
						`Unexpected simple query message: ${current_message.type}`,
					);
			}
			current_message = await this.#readMessage();
		}
		if (error) throw error;
		return result;
	}
	async #appendQueryToMessage(query1) {
		this.#packetWriter.clear();
		const buffer3 = this.#packetWriter
			.addCString("")
			.addCString(query1.text)
			.addInt16(0)
			.flush(0x50);
		await this.#bufWriter.write(buffer3);
	}
	async #appendArgumentsToMessage(query2) {
		this.#packetWriter.clear();
		const hasBinaryArgs = query2.args.some((arg) => arg instanceof Uint8Array);
		this.#packetWriter.clear();
		this.#packetWriter.addCString("").addCString("");
		if (hasBinaryArgs) {
			this.#packetWriter.addInt16(query2.args.length);
			query2.args.forEach((arg) => {
				this.#packetWriter.addInt16(arg instanceof Uint8Array ? 1 : 0);
			});
		} else {
			this.#packetWriter.addInt16(0);
		}
		this.#packetWriter.addInt16(query2.args.length);
		query2.args.forEach((arg) => {
			if (arg === null || typeof arg === "undefined") {
				this.#packetWriter.addInt32(-1);
			} else if (arg instanceof Uint8Array) {
				this.#packetWriter.addInt32(arg.length);
				this.#packetWriter.add(arg);
			} else {
				const byteLength = encoder1.encode(arg).length;
				this.#packetWriter.addInt32(byteLength);
				this.#packetWriter.addString(arg);
			}
		});
		this.#packetWriter.addInt16(0);
		const buffer4 = this.#packetWriter.flush(0x42);
		await this.#bufWriter.write(buffer4);
	}
	async #appendDescribeToMessage() {
		this.#packetWriter.clear();
		const buffer5 = this.#packetWriter.addCString("P").flush(0x44);
		await this.#bufWriter.write(buffer5);
	}
	async #appendExecuteToMessage() {
		this.#packetWriter.clear();
		const buffer6 = this.#packetWriter.addCString("").addInt32(0).flush(0x45);
		await this.#bufWriter.write(buffer6);
	}
	async #appendSyncToMessage() {
		this.#packetWriter.clear();
		const buffer7 = this.#packetWriter.flush(0x53);
		await this.#bufWriter.write(buffer7);
	}
	async #processErrorUnsafe(msg, recoverable = true) {
		const error1 = new PostgresError(parseNoticeMessage(msg));
		if (recoverable) {
			let maybe_ready_message = await this.#readMessage();
			while (maybe_ready_message.type !== INCOMING_QUERY_MESSAGES.READY) {
				maybe_ready_message = await this.#readMessage();
			}
		}
		throw error1;
	}
	async #preparedQuery(query3) {
		await this.#appendQueryToMessage(query3);
		await this.#appendArgumentsToMessage(query3);
		await this.#appendDescribeToMessage();
		await this.#appendExecuteToMessage();
		await this.#appendSyncToMessage();
		await this.#bufWriter.flush();
		let result1;
		if (query3.result_type === ResultType.ARRAY) {
			result1 = new QueryArrayResult(query3);
		} else {
			result1 = new QueryObjectResult(query3);
		}
		let error2;
		let current_message1 = await this.#readMessage();
		while (current_message1.type !== INCOMING_QUERY_MESSAGES.READY) {
			switch (current_message1.type) {
				case ERROR_MESSAGE: {
					error2 = new PostgresError(parseNoticeMessage(current_message1));
					break;
				}
				case INCOMING_QUERY_MESSAGES.BIND_COMPLETE:
					break;
				case INCOMING_QUERY_MESSAGES.COMMAND_COMPLETE: {
					result1.handleCommandComplete(
						parseCommandCompleteMessage(current_message1),
					);
					break;
				}
				case INCOMING_QUERY_MESSAGES.DATA_ROW: {
					const row_data1 = parseRowDataMessage(current_message1);
					try {
						result1.insertRow(row_data1);
					} catch (e5) {
						error2 = e5;
					}
					break;
				}
				case INCOMING_QUERY_MESSAGES.NO_DATA:
					break;
				case INCOMING_QUERY_MESSAGES.NOTICE_WARNING: {
					const notice1 = parseNoticeMessage(current_message1);
					logNotice(notice1);
					result1.warnings.push(notice1);
					break;
				}
				case INCOMING_QUERY_MESSAGES.PARAMETER_STATUS:
					break;
				case INCOMING_QUERY_MESSAGES.PARSE_COMPLETE:
					break;
				case INCOMING_QUERY_MESSAGES.ROW_DESCRIPTION: {
					result1.loadColumnDescriptions(
						parseRowDescriptionMessage(current_message1),
					);
					break;
				}
				default:
					throw new Error(
						`Unexpected prepared query message: ${current_message1.type}`,
					);
			}
			current_message1 = await this.#readMessage();
		}
		if (error2) throw error2;
		return result1;
	}
	async query(query) {
		if (!this.connected) {
			await this.startup(true);
		}
		await this.#queryLock.pop();
		try {
			if (query.args.length === 0) {
				return await this.#simpleQuery(query);
			} else {
				return await this.#preparedQuery(query);
			}
		} catch (e) {
			if (e instanceof ConnectionError) {
				await this.end();
			}
			throw e;
		} finally {
			this.#queryLock.push(undefined);
		}
	}
	async end() {
		if (this.connected) {
			const terminationMessage = new Uint8Array([0x58, 0x00, 0x00, 0x00, 0x04]);
			await this.#bufWriter.write(terminationMessage);
			try {
				await this.#bufWriter.flush();
			} catch (_e) {
			} finally {
				this.#closeConnection();
				this.#onDisconnection();
			}
		}
	}
}
function getPgEnv() {
	return {
		applicationName: Deno.env.get("PGAPPNAME"),
		database: Deno.env.get("PGDATABASE"),
		hostname: Deno.env.get("PGHOST"),
		options: Deno.env.get("PGOPTIONS"),
		password: Deno.env.get("PGPASSWORD"),
		port: Deno.env.get("PGPORT"),
		user: Deno.env.get("PGUSER"),
	};
}
function formatMissingParams(missingParams) {
	return `Missing connection parameters: ${missingParams.join(", ")}`;
}
function assertRequiredOptions(options, requiredKeys, has_env_access) {
	const missingParams = [];
	for (const key of requiredKeys) {
		if (
			options[key] === "" ||
			options[key] === null ||
			options[key] === undefined
		) {
			missingParams.push(key);
		}
	}
	if (missingParams.length) {
		let missing_params_message = formatMissingParams(missingParams);
		if (!has_env_access) {
			missing_params_message +=
				"\nConnection parameters can be read from environment variables only if Deno is run with env permission";
		}
		throw new ConnectionParamsError(missing_params_message);
	}
}
function parseOptionsArgument(options) {
	const args = options.split(" ");
	const transformed_args = [];
	for (let x = 0; x < args.length; x++) {
		if (/^-\w/.test(args[x])) {
			if (args[x] === "-c") {
				if (args[x + 1] === undefined) {
					throw new Error(
						`No provided value for "${args[x]}" in options parameter`,
					);
				}
				transformed_args.push(args[x + 1]);
				x++;
			} else {
				throw new Error(
					`Argument "${args[x]}" is not supported in options parameter`,
				);
			}
		} else if (/^--\w/.test(args[x])) {
			transformed_args.push(args[x].slice(2));
		} else {
			throw new Error(`Value "${args[x]}" is not a valid options argument`);
		}
	}
	return transformed_args.reduce((options, x) => {
		if (!/.+=.+/.test(x)) {
			throw new Error(`Value "${x}" is not a valid options argument`);
		}
		const key = x.slice(0, x.indexOf("="));
		const value = x.slice(x.indexOf("=") + 1);
		options[key] = value;
		return options;
	}, {});
}
function parseOptionsFromUri(connection_string) {
	let postgres_uri;
	try {
		const uri = parseConnectionUri(connection_string);
		postgres_uri = {
			application_name: uri.params.application_name,
			dbname: uri.path || uri.params.dbname,
			driver: uri.driver,
			host: uri.host || uri.params.host,
			options: uri.params.options,
			password: uri.password || uri.params.password,
			port: uri.port || uri.params.port,
			sslmode: uri.params.ssl === "true" ? "require" : uri.params.sslmode,
			user: uri.user || uri.params.user,
		};
	} catch (e) {
		throw new ConnectionParamsError(`Could not parse the connection string`, e);
	}
	if (!["postgres", "postgresql"].includes(postgres_uri.driver)) {
		throw new ConnectionParamsError(
			`Supplied DSN has invalid driver: ${postgres_uri.driver}.`,
		);
	}
	const host_type = postgres_uri.host
		? isAbsolute2(postgres_uri.host)
			? "socket"
			: "tcp"
		: "socket";
	const options = postgres_uri.options
		? parseOptionsArgument(postgres_uri.options)
		: {};
	let tls;
	switch (postgres_uri.sslmode) {
		case undefined: {
			break;
		}
		case "disable": {
			tls = {
				enabled: false,
				enforce: false,
				caCertificates: [],
			};
			break;
		}
		case "prefer": {
			tls = {
				enabled: true,
				enforce: false,
				caCertificates: [],
			};
			break;
		}
		case "require":
		case "verify-ca":
		case "verify-full": {
			tls = {
				enabled: true,
				enforce: true,
				caCertificates: [],
			};
			break;
		}
		default: {
			throw new ConnectionParamsError(
				`Supplied DSN has invalid sslmode '${postgres_uri.sslmode}'`,
			);
		}
	}
	return {
		applicationName: postgres_uri.application_name,
		database: postgres_uri.dbname,
		hostname: postgres_uri.host,
		host_type,
		options,
		password: postgres_uri.password,
		port: postgres_uri.port,
		tls,
		user: postgres_uri.user,
	};
}
const DEFAULT_OPTIONS = {
	applicationName: "deno_postgres",
	connection: {
		attempts: 1,
		interval: (previous_interval) => previous_interval + 500,
	},
	host: "127.0.0.1",
	socket: "/tmp",
	host_type: "socket",
	options: {},
	port: 5432,
	tls: {
		enabled: true,
		enforce: false,
		caCertificates: [],
	},
};
function createParams(params = {}) {
	if (typeof params === "string") {
		params = parseOptionsFromUri(params);
	}
	let pgEnv = {};
	let has_env_access = true;
	try {
		pgEnv = getPgEnv();
	} catch (e) {
		if (e instanceof Deno.errors.PermissionDenied) {
			has_env_access = false;
		} else {
			throw e;
		}
	}
	const provided_host = params.hostname ?? pgEnv.hostname;
	const host_type =
		params.host_type ?? (provided_host ? "tcp" : DEFAULT_OPTIONS.host_type);
	if (!["tcp", "socket"].includes(host_type)) {
		throw new ConnectionParamsError(`"${host_type}" is not a valid host type`);
	}
	let host;
	if (host_type === "socket") {
		const socket = provided_host ?? DEFAULT_OPTIONS.socket;
		try {
			if (!isAbsolute2(socket)) {
				const parsed_host = new URL(socket, Deno.mainModule);
				if (parsed_host.protocol === "file:") {
					host = fromFileUrl2(parsed_host);
				} else {
					throw new ConnectionParamsError(
						"The provided host is not a file path",
					);
				}
			} else {
				host = socket;
			}
		} catch (e1) {
			throw new ConnectionParamsError(`Could not parse host "${socket}"`, e1);
		}
	} else {
		host = provided_host ?? DEFAULT_OPTIONS.host;
	}
	const provided_options = params.options ?? pgEnv.options;
	let options;
	if (provided_options) {
		if (typeof provided_options === "string") {
			options = parseOptionsArgument(provided_options);
		} else {
			options = provided_options;
		}
	} else {
		options = {};
	}
	for (const key in options) {
		if (!/^\w+$/.test(key)) {
			throw new Error(`The "${key}" key in the options argument is invalid`);
		}
		options[key] = options[key].replaceAll(" ", "\\ ");
	}
	let port;
	if (params.port) {
		port = Number(params.port);
	} else if (pgEnv.port) {
		port = Number(pgEnv.port);
	} else {
		port = DEFAULT_OPTIONS.port;
	}
	if (Number.isNaN(port) || port === 0) {
		throw new ConnectionParamsError(
			`"${params.port ?? pgEnv.port}" is not a valid port number`,
		);
	}
	if (host_type === "socket" && params?.tls) {
		throw new ConnectionParamsError(
			`No TLS options are allowed when host type is set to "socket"`,
		);
	}
	const tls_enabled = !!(params?.tls?.enabled ?? DEFAULT_OPTIONS.tls.enabled);
	const tls_enforced = !!(params?.tls?.enforce ?? DEFAULT_OPTIONS.tls.enforce);
	if (!tls_enabled && tls_enforced) {
		throw new ConnectionParamsError(
			"Can't enforce TLS when client has TLS encryption is disabled",
		);
	}
	const connection_options = {
		applicationName:
			params.applicationName ??
			pgEnv.applicationName ??
			DEFAULT_OPTIONS.applicationName,
		connection: {
			attempts:
				params?.connection?.attempts ?? DEFAULT_OPTIONS.connection.attempts,
			interval:
				params?.connection?.interval ?? DEFAULT_OPTIONS.connection.interval,
		},
		database: params.database ?? pgEnv.database,
		hostname: host,
		host_type,
		options,
		password: params.password ?? pgEnv.password,
		port,
		tls: {
			enabled: tls_enabled,
			enforce: tls_enforced,
			caCertificates: params?.tls?.caCertificates ?? [],
		},
		user: params.user ?? pgEnv.user,
	};
	assertRequiredOptions(
		connection_options,
		["applicationName", "database", "hostname", "host_type", "port", "user"],
		has_env_access,
	);
	return connection_options;
}
class Savepoint {
	#instance_count;
	#release_callback;
	#update_callback;
	constructor(name, update_callback, release_callback) {
		this.name = name;
		this.#instance_count = 0;
		this.#release_callback = release_callback;
		this.#update_callback = update_callback;
	}
	get instances() {
		return this.#instance_count;
	}
	async release() {
		if (this.#instance_count === 0) {
			throw new Error("This savepoint has no instances to release");
		}
		await this.#release_callback(this.name);
		--this.#instance_count;
	}
	async update() {
		await this.#update_callback(this.name);
		++this.#instance_count;
	}
	name;
}
class Transaction {
	#client;
	#executeQuery;
	#isolation_level;
	#read_only;
	#savepoints;
	#snapshot;
	#updateClientLock;
	constructor(
		name,
		options,
		client,
		execute_query_callback,
		update_client_lock_callback,
	) {
		this.name = name;
		this.#savepoints = [];
		this.#committed = false;
		this.#client = client;
		this.#executeQuery = execute_query_callback;
		this.#isolation_level = options?.isolation_level ?? "read_committed";
		this.#read_only = options?.read_only ?? false;
		this.#snapshot = options?.snapshot;
		this.#updateClientLock = update_client_lock_callback;
	}
	get isolation_level() {
		return this.#isolation_level;
	}
	get savepoints() {
		return this.#savepoints;
	}
	#assertTransactionOpen() {
		if (this.#client.session.current_transaction !== this.name) {
			throw new Error(
				`This transaction has not been started yet, make sure to use the "begin" method to do so`,
			);
		}
	}
	#resetTransaction() {
		this.#savepoints = [];
	}
	async begin() {
		if (this.#client.session.current_transaction !== null) {
			if (this.#client.session.current_transaction === this.name) {
				throw new Error("This transaction is already open");
			}
			throw new Error(
				`This client already has an ongoing transaction "${this.#client.session.current_transaction}"`,
			);
		}
		let isolation_level;
		switch (this.#isolation_level) {
			case "read_committed": {
				isolation_level = "READ COMMITTED";
				break;
			}
			case "repeatable_read": {
				isolation_level = "REPEATABLE READ";
				break;
			}
			case "serializable": {
				isolation_level = "SERIALIZABLE";
				break;
			}
			default:
				throw new Error(
					`Unexpected isolation level "${this.#isolation_level}"`,
				);
		}
		let permissions;
		if (this.#read_only) {
			permissions = "READ ONLY";
		} else {
			permissions = "READ WRITE";
		}
		let snapshot = "";
		if (this.#snapshot) {
			snapshot = `SET TRANSACTION SNAPSHOT '${this.#snapshot}'`;
		}
		try {
			await this.#client.queryArray(
				`BEGIN ${permissions} ISOLATION LEVEL ${isolation_level};${snapshot}`,
			);
		} catch (e) {
			if (e instanceof PostgresError) {
				throw new TransactionError(this.name, e);
			} else {
				throw e;
			}
		}
		this.#updateClientLock(this.name);
	}
	#committed;
	async commit(options) {
		this.#assertTransactionOpen();
		const chain = options?.chain ?? false;
		if (!this.#committed) {
			this.#committed = true;
			try {
				await this.queryArray(`COMMIT ${chain ? "AND CHAIN" : ""}`);
			} catch (e) {
				if (e instanceof PostgresError) {
					throw new TransactionError(this.name, e);
				} else {
					throw e;
				}
			}
		}
		this.#resetTransaction();
		if (!chain) {
			this.#updateClientLock(null);
		}
	}
	getSavepoint(name) {
		return this.#savepoints.find((sv) => sv.name === name.toLowerCase());
	}
	getSavepoints() {
		return this.#savepoints.filter(({ instances }) => instances > 0).map(
			({ name }) => name,
		);
	}
	async getSnapshot() {
		this.#assertTransactionOpen();
		const { rows } = await this
			.queryObject`SELECT PG_EXPORT_SNAPSHOT() AS SNAPSHOT;`;
		return rows[0].snapshot;
	}
	async queryArray(query_template_or_config, ...args) {
		this.#assertTransactionOpen();
		let query;
		if (typeof query_template_or_config === "string") {
			query = new Query(query_template_or_config, ResultType.ARRAY, args[0]);
		} else if (isTemplateString(query_template_or_config)) {
			query = templateStringToQuery(
				query_template_or_config,
				args,
				ResultType.ARRAY,
			);
		} else {
			query = new Query(query_template_or_config, ResultType.ARRAY);
		}
		try {
			return await this.#executeQuery(query);
		} catch (e) {
			if (e instanceof PostgresError) {
				await this.commit();
				throw new TransactionError(this.name, e);
			} else {
				throw e;
			}
		}
	}
	async queryObject(query_template_or_config, ...args) {
		this.#assertTransactionOpen();
		let query;
		if (typeof query_template_or_config === "string") {
			query = new Query(query_template_or_config, ResultType.OBJECT, args[0]);
		} else if (isTemplateString(query_template_or_config)) {
			query = templateStringToQuery(
				query_template_or_config,
				args,
				ResultType.OBJECT,
			);
		} else {
			query = new Query(query_template_or_config, ResultType.OBJECT);
		}
		try {
			return await this.#executeQuery(query);
		} catch (e) {
			if (e instanceof PostgresError) {
				await this.commit();
				throw new TransactionError(this.name, e);
			} else {
				throw e;
			}
		}
	}
	async rollback(savepoint_or_options) {
		this.#assertTransactionOpen();
		let savepoint_option;
		if (
			typeof savepoint_or_options === "string" ||
			savepoint_or_options instanceof Savepoint
		) {
			savepoint_option = savepoint_or_options;
		} else {
			savepoint_option = savepoint_or_options?.savepoint;
		}
		let savepoint_name;
		if (savepoint_option instanceof Savepoint) {
			savepoint_name = savepoint_option.name;
		} else if (typeof savepoint_option === "string") {
			savepoint_name = savepoint_option.toLowerCase();
		}
		let chain_option = false;
		if (typeof savepoint_or_options === "object") {
			chain_option = savepoint_or_options?.chain ?? false;
		}
		if (chain_option && savepoint_name) {
			throw new Error(
				"The chain option can't be used alongside a savepoint on a rollback operation",
			);
		}
		if (typeof savepoint_option !== "undefined") {
			const ts_savepoint = this.#savepoints.find(
				({ name }) => name === savepoint_name,
			);
			if (!ts_savepoint) {
				throw new Error(
					`There is no "${savepoint_name}" savepoint registered in this transaction`,
				);
			}
			if (!ts_savepoint.instances) {
				throw new Error(
					`There are no savepoints of "${savepoint_name}" left to rollback to`,
				);
			}
			await this.queryArray(`ROLLBACK TO ${savepoint_name}`);
			return;
		}
		try {
			await this.queryArray(`ROLLBACK ${chain_option ? "AND CHAIN" : ""}`);
		} catch (e) {
			if (e instanceof PostgresError) {
				await this.commit();
				throw new TransactionError(this.name, e);
			} else {
				throw e;
			}
		}
		this.#resetTransaction();
		if (!chain_option) {
			this.#updateClientLock(null);
		}
	}
	async savepoint(name) {
		this.#assertTransactionOpen();
		if (!/^[a-zA-Z_]{1}[\w]{0,62}$/.test(name)) {
			if (!Number.isNaN(Number(name[0]))) {
				throw new Error("The savepoint name can't begin with a number");
			}
			if (name.length > 63) {
				throw new Error(
					"The savepoint name can't be longer than 63 characters",
				);
			}
			throw new Error(
				"The savepoint name can only contain alphanumeric characters",
			);
		}
		name = name.toLowerCase();
		let savepoint = this.#savepoints.find((sv) => sv.name === name);
		if (savepoint) {
			try {
				await savepoint.update();
			} catch (e) {
				if (e instanceof PostgresError) {
					await this.commit();
					throw new TransactionError(this.name, e);
				} else {
					throw e;
				}
			}
		} else {
			savepoint = new Savepoint(
				name,
				async (name) => {
					await this.queryArray(`SAVEPOINT ${name}`);
				},
				async (name) => {
					await this.queryArray(`RELEASE SAVEPOINT ${name}`);
				},
			);
			try {
				await savepoint.update();
			} catch (e1) {
				if (e1 instanceof PostgresError) {
					await this.commit();
					throw new TransactionError(this.name, e1);
				} else {
					throw e1;
				}
			}
			this.#savepoints.push(savepoint);
		}
		return savepoint;
	}
	name;
}
class QueryClient {
	#connection;
	#terminated = false;
	#transaction = null;
	constructor(connection) {
		this.#connection = connection;
	}
	get connected() {
		return this.#connection.connected;
	}
	get session() {
		return {
			current_transaction: this.#transaction,
			pid: this.#connection.pid,
			tls: this.#connection.tls,
			transport: this.#connection.transport,
		};
	}
	#assertOpenConnection() {
		if (this.#terminated) {
			throw new Error("Connection to the database has been terminated");
		}
	}
	async closeConnection() {
		if (this.connected) {
			await this.#connection.end();
		}
		this.resetSessionMetadata();
	}
	createTransaction(name, options) {
		this.#assertOpenConnection();
		return new Transaction(name, options, this, this.#executeQuery.bind(this), (
			name,
		) => {
			this.#transaction = name;
		});
	}
	async connect() {
		if (!this.connected) {
			await this.#connection.startup(false);
			this.#terminated = false;
		}
	}
	async end() {
		await this.closeConnection();
		this.#terminated = true;
	}
	async #executeQuery(query4) {
		return await this.#connection.query(query4);
	}
	async queryArray(query_template_or_config, ...args) {
		this.#assertOpenConnection();
		if (this.#transaction !== null) {
			throw new Error(
				`This connection is currently locked by the "${this.#transaction}" transaction`,
			);
		}
		let query;
		if (typeof query_template_or_config === "string") {
			query = new Query(query_template_or_config, ResultType.ARRAY, args[0]);
		} else if (isTemplateString(query_template_or_config)) {
			query = templateStringToQuery(
				query_template_or_config,
				args,
				ResultType.ARRAY,
			);
		} else {
			query = new Query(query_template_or_config, ResultType.ARRAY);
		}
		return await this.#executeQuery(query);
	}
	async queryObject(query_template_or_config, ...args) {
		this.#assertOpenConnection();
		if (this.#transaction !== null) {
			throw new Error(
				`This connection is currently locked by the "${this.#transaction}" transaction`,
			);
		}
		let query;
		if (typeof query_template_or_config === "string") {
			query = new Query(query_template_or_config, ResultType.OBJECT, args[0]);
		} else if (isTemplateString(query_template_or_config)) {
			query = templateStringToQuery(
				query_template_or_config,
				args,
				ResultType.OBJECT,
			);
		} else {
			query = new Query(query_template_or_config, ResultType.OBJECT);
		}
		return await this.#executeQuery(query);
	}
	resetSessionMetadata() {
		this.#transaction = null;
	}
}
class PoolClient extends QueryClient {
	#release;
	constructor(config, releaseCallback) {
		super(
			new Connection(config, async () => {
				await this.closeConnection();
			}),
		);
		this.#release = releaseCallback;
	}
	release() {
		this.#release();
		this.resetSessionMetadata();
	}
}
class Pool {
	#available_connections;
	#connection_params;
	#ended = false;
	#lazy;
	#ready;
	#size;
	get available() {
		if (!this.#available_connections) {
			return 0;
		}
		return this.#available_connections.available;
	}
	get size() {
		if (!this.#available_connections) {
			return 0;
		}
		return this.#available_connections.size;
	}
	constructor(connection_params, size, lazy = false) {
		this.#connection_params = createParams(connection_params);
		this.#lazy = lazy;
		this.#size = size;
		this.#ready = this.#initialize();
	}
	async connect() {
		if (this.#ended) {
			this.#ready = this.#initialize();
		}
		await this.#ready;
		return this.#available_connections.pop();
	}
	async end() {
		if (this.#ended) {
			throw new Error("Pool connections have already been terminated");
		}
		await this.#ready;
		while (this.available > 0) {
			const client = await this.#available_connections.pop();
			await client.end();
		}
		this.#available_connections = undefined;
		this.#ended = true;
	}
	async #initialize() {
		const initialized = this.#lazy ? 0 : this.#size;
		const clients = Array.from(
			{
				length: this.#size,
			},
			async (_e, index) => {
				const client = new PoolClient(
					this.#connection_params,
					() => this.#available_connections.push(client),
				);
				if (index < initialized) {
					await client.connect();
				}
				return client;
			},
		);
		this.#available_connections = new DeferredAccessStack(
			await Promise.all(clients),
			(client) => client.connect(),
			(client) => client.connected,
		);
		this.#ended = false;
	}
	async initialized() {
		if (!this.#available_connections) {
			return 0;
		}
		return await this.#available_connections.initialized();
	}
}
class ErrorReplyError extends Error {}
class InvalidStateError extends Error {
	constructor(message) {
		const base = "Invalid state";
		super(message ? `${base}: ${message}` : base);
	}
}
const encoder2 = new TextEncoder();
const decoder3 = new TextDecoder();
":".charCodeAt(0);
"$".charCodeAt(0);
const SimpleStringCode = "+".charCodeAt(0);
"*".charCodeAt(0);
const ErrorReplyCode = "-".charCodeAt(0);
class BaseReply {
	constructor(code) {
		this.code = code;
	}
	buffer() {
		throw createDecodeError(this.code, "buffer");
	}
	string() {
		throw createDecodeError(this.code, "string");
	}
	bulk() {
		throw createDecodeError(this.code, "bulk");
	}
	integer() {
		throw createDecodeError(this.code, "integer");
	}
	array() {
		throw createDecodeError(this.code, "array");
	}
	code;
}
class SimpleStringReply extends BaseReply {
	static async decode(reader) {
		const body = await readSimpleStringReplyBody(reader);
		return new SimpleStringReply(body);
	}
	#body;
	constructor(body) {
		super(SimpleStringCode);
		this.#body = body;
	}
	bulk() {
		return this.string();
	}
	buffer() {
		return this.#body;
	}
	string() {
		return decoder3.decode(this.#body);
	}
	value() {
		return this.string();
	}
}
async function readSimpleStringReplyBody(reader) {
	const line = await readLine(reader);
	if (line == null) {
		throw new InvalidStateError();
	}
	if (line[0] !== SimpleStringCode) {
		tryParseErrorReply(line);
	}
	return line.subarray(1, line.length);
}
new SimpleStringReply(encoder2.encode("OK"));
function tryParseErrorReply(line) {
	const code = line[0];
	if (code === ErrorReplyCode) {
		throw new ErrorReplyError(decoder3.decode(line));
	}
	throw new Error(`invalid line: ${line}`);
}
async function readLine(reader) {
	const result = await reader.readLine();
	if (result == null) {
		throw new InvalidStateError();
	}
	const { line } = result;
	return line;
}
function createDecodeError(code, expectedType) {
	return new InvalidStateError(
		`cannot decode '${String.fromCharCode(
			code,
		)}' type as \`${expectedType}\` value`,
	);
}
encoder2.encode("\r\n");
encoder2.encode("*");
encoder2.encode("$");
"\r".charCodeAt(0);
"\n".charCodeAt(0);
const importMeta = {
	url: "https://deno.land/x/denomailer@1.3.0/client/worker/worker.ts",
	main: false,
};
class SMTPWorker {
	id = 1;
	#timeout;
	constructor(config) {
		this.#config = config;
		this.#timeout = config.pool.timeout;
	}
	#w;
	#idleTO = null;
	#idleMode2 = false;
	#noCon = true;
	#config;
	#resolver = new Map();
	#startup() {
		this.#w = new Worker(new URL("./worker-file.ts", importMeta.url), {
			type: "module",
			deno: {
				permissions: {
					net: "inherit",
					read: true,
				},
				namespace: true,
			},
		});
		this.#w.addEventListener("message", (ev) => {
			if (typeof ev.data === "object") {
				if ("err" in ev.data) {
					this.#resolver.get(ev.data.__ret)?.rej(ev.data.err);
				}
				if ("res" in ev.data) {
					this.#resolver.get(ev.data.__ret)?.res(ev.data.res);
				}
				this.#resolver.delete(ev.data.__ret);
				return;
			}
			if (ev.data) {
				this.#stopIdle();
			} else {
				if (this.#idleMode2) {
					this.#cleanup();
				} else {
					this.#startIdle();
				}
			}
		});
		this.#w.postMessage({
			__setup: {
				...this.#config,
				client: {
					...this.#config.client,
					preprocessors: [],
				},
			},
		});
		this.#noCon = false;
	}
	#startIdle() {
		console.log("started idle");
		if (this.#idleTO) {
			return;
		}
		this.#idleTO = setTimeout(() => {
			console.log("idle mod 2");
			this.#idleMode2 = true;
			this.#w.postMessage({
				__check_idle: true,
			});
		}, this.#timeout);
	}
	#stopIdle() {
		if (this.#idleTO) {
			clearTimeout(this.#idleTO);
		}
		this.#idleMode2 = false;
		this.#idleTO = null;
	}
	#cleanup() {
		console.log("killed");
		this.#w.terminate();
		this.#stopIdle();
	}
	send(mail) {
		const myID = this.id;
		this.id++;
		this.#stopIdle();
		if (this.#noCon) {
			this.#startup();
		}
		this.#w.postMessage({
			__mail: myID,
			mail,
		});
		return new Promise((res, rej) => {
			this.#resolver.set(myID, {
				res,
				rej,
			});
		});
	}
	close() {
		if (this.#w) this.#w.terminate();
		if (this.#idleTO) {
			clearTimeout(this.#idleTO);
		}
	}
}
"\r".charCodeAt(0);
"\n".charCodeAt(0);
" ".charCodeAt(0);
"\t".charCodeAt(0);
":".charCodeAt(0);
new TextDecoder();
new TextEncoder();
class QUE {
	running = false;
	#que = [];
	idle = Promise.resolve();
	#idbleCB;
	que() {
		if (!this.running) {
			this.running = true;
			this.idle = new Promise((res) => {
				this.#idbleCB = res;
			});
			return Promise.resolve();
		}
		return new Promise((res) => {
			this.#que.push(res);
		});
	}
	next() {
		if (this.#que.length === 0) {
			this.running = false;
			if (this.#idbleCB) this.#idbleCB();
			return;
		}
		this.#que[0]();
		this.#que.splice(0, 1);
	}
}
new TextEncoder();
const __default = (x) => {
	return x && !["0", "false", "off"].includes(x.trim().toLowerCase());
};
var env;
({ env } = Deno);
const __default1 = new Proxy(
	{},
	{
		get: (_, key) => {
			return env.get(key);
		},
	},
);
var DEBUG = __default(__default1.DEBUG);
var LI;
LI = "DB HOST PORT PASSWORD USER POOL_CONN".split(" ");
const __default2 = (prefix, conn) => {
	var database, hostname, password, pool, port, q, user;
	[database, hostname, port, password, user, conn] = LI.map((i) => {
		return __default1[prefix + i];
	});
	pool = new Pool(
		{
			database,
			hostname,
			password,
			port,
			user,
		},
		parseInt(conn),
		true,
	);
	q = async (sql, ...args) => {
		var c, r;
		c = await pool.connect();
		try {
			r = await c.queryArray(sql, args);
		} finally {
			c.release();
		}
		return r.rows;
	};
	return [
		q,
		async (...args) => {
			var i, r, ref;
			r = [];
			ref = await q(...args);
			for (i of ref) {
				r.push(i[0]);
			}
			return r;
		},
	];
};
[Q, Q0] = __default2("PG_");
var Q;
var Q0;
const __default3 = {
	sign: {
		mail: (account, password, signUp) => {
			console.log("mail signUp");
			[account, password];
			return Q0(
				"select schema_name from information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')",
			);
		},
		phone: (area, phone, password, signUp) => {
			console.log("phone ", signUp);
			return [area, phone, password, signUp];
		},
	},
};
const __default4 = {
	auth: __default3,
};
var obj2map;
obj2map = (obj, chain) => {
	var k, map, ref, v, x;
	map = new Map();
	ref = Object.entries(obj);
	for (x of ref) {
		[k, v] = x;
		map.set(k, v instanceof Function ? [v, chain] : obj2map(v, chain));
	}
	return map;
};
const __default5 = obj2map(__default4, [
	(o) => {
		if (o !== void 0) {
			return JSON.stringify(o);
		} else {
			return "";
		}
	},
]);
var API_PORT, HEADERS, _serveHttp, conn, response1, serve, serveHttp, server;
({ API_PORT } = __default1);
({ serveHttp } = Deno);
console.log(`listen port ${API_PORT}`);
server = Deno.listen({
	port: parseInt(API_PORT),
});
HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "*",
};
if (DEBUG) {
	HEADERS["Access-Control-Allow-Private-Network"] = true;
}
response1 = (status, body) => {
	return new Response(body, {
		status,
		headers: HEADERS,
	});
};
_serveHttp = async ({ request: req, respondWith }) => {
	var body,
		code,
		content_type,
		err,
		f,
		func,
		headers,
		i,
		isJSON,
		li,
		method,
		path,
		pathname,
		r,
		ref,
		ref1,
		text,
		url;
	({ headers, method, url } = req);
	if (method === "OPTIONS") {
		code = 200;
		body = "";
	} else {
		({ pathname } = new URL(url));
		content_type = req.headers.get("content-type");
		isJSON =
			!content_type ||
			content_type.endsWith("json" || content_type.startsWith("text/"));
		if (isJSON) {
			try {
				text = await req.text();
				if (text) {
					r = JSON.parse(text);
				}
			} catch (error) {
				err = error;
				respondWith(response1(500, `${text} NOT JSON\n`));
				return;
			}
			path = pathname.slice(1);
			if (path) {
				li = __default5;
				ref = path.split(".");
				for (i of ref) {
					li = li.get(i);
					if (!li) {
						break;
					}
				}
			}
			if (li) {
				func = li[0];
				try {
					if (r) {
						if (Array.isArray(r)) {
							body = func(...r);
						} else {
							body = func(r);
						}
					} else {
						body = func();
					}
					body = await body;
					ref1 = li[1];
					for (f of ref1) {
						body = f(body);
					}
					code = 200;
				} catch (error1) {
					err = error1;
					[path, r, err].map((e) => {
						console.error(e);
					});
					code = 500;
					body = err;
				}
			} else {
				code = 404;
				body = `${path} not exist`;
			}
		} else {
			code = 404;
			body = `Content-Type ${content_type} Not Support`;
		}
	}
	respondWith(response1(code, body));
};
serve = async (conn) => {
	var ref, req;
	ref = serveHttp(conn);
	for await (req of ref) {
		_serveHttp(req);
	}
};
while (true) {
	for await (conn of server) {
		serve(conn);
	}
}
