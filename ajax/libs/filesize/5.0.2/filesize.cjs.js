'use strict';

const b = /^(b|B)$/,
	symbol = {
		iec: {
			bits: ["b", "Kib", "Mib", "Gib", "Tib", "Pib", "Eib", "Zib", "Yib"],
			bytes: ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"]
		},
		jedec: {
			bits: ["b", "Kb", "Mb", "Gb", "Tb", "Pb", "Eb", "Zb", "Yb"],
			bytes: ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
		}
	},
	fullform = {
		iec: ["", "kibi", "mebi", "gibi", "tebi", "pebi", "exbi", "zebi", "yobi"],
		jedec: ["", "kilo", "mega", "giga", "tera", "peta", "exa", "zetta", "yotta"]
	};

function filesize (arg, descriptor = {}) {
	if (isNaN(arg)) {
		throw new TypeError("Invalid number");
	}

	let result = [],
		val = 0,
		bits = descriptor.bits === true,
		unix = descriptor.unix === true,
		base = descriptor.base || 2,
		round = descriptor.round !== void 0 ? descriptor.round : unix ? 1 : 2,
		locale = descriptor.locale !== void 0 ? descriptor.locale : "",
		localeOptions = descriptor.localeOptions || {},
		separator = descriptor.separator !== void 0 ? descriptor.separator : "",
		spacer = descriptor.spacer !== void 0 ? descriptor.spacer : unix ? "" : " ",
		symbols = descriptor.symbols || {},
		standard = base === 2 ? descriptor.standard || "jedec" : "jedec",
		output = descriptor.output || "string",
		full = descriptor.fullform === true,
		fullforms = descriptor.fullforms instanceof Array ? descriptor.fullforms : [],
		e = descriptor.exponent !== void 0 ? descriptor.exponent : -1,
		num = Number(arg),
		neg = num < 0,
		ceil = base > 2 ? 1000 : 1024;

	// Flipping a negative number to determine the size
	if (neg) {
		num = -num;
	}

	// Determining the exponent
	if (e === -1 || isNaN(e)) {
		e = Math.floor(Math.log(num) / Math.log(ceil));

		if (e < 0) {
			e = 0;
		}
	}

	// Exceeding supported length, time to reduce & multiply
	if (e > 8) {
		e = 8;
	}

	if (output === "exponent") {
		return e;
	}

	// Zero is now a special case because bytes divide by 1
	if (num === 0) {
		result[0] = 0;
		result[1] = unix ? "" : symbol[standard][bits ? "bits" : "bytes"][e];
	} else {
		val = num / (base === 2 ? Math.pow(2, e * 10) : Math.pow(1000, e));

		if (bits) {
			val = val * 8;

			if (val >= ceil && e < 8) {
				val = val / ceil;
				e++;
			}
		}

		result[0] = Number(val.toFixed(e > 0 ? round : 0));

		if (result[0] === ceil && e < 8 && descriptor.exponent === void 0) {
			result[0] = 1;
			e++;
		}

		result[1] = base === 10 && e === 1 ? bits ? "kb" : "kB" : symbol[standard][bits ? "bits" : "bytes"][e];

		if (unix) {
			result[1] = standard === "jedec" ? result[1].charAt(0) : e > 0 ? result[1].replace(/B$/, "") : result[1];

			if (b.test(result[1])) {
				result[0] = Math.floor(result[0]);
				result[1] = "";
			}
		}
	}

	// Decorating a 'diff'
	if (neg) {
		result[0] = -result[0];
	}

	// Applying custom symbol
	result[1] = symbols[result[1]] || result[1];

	if (locale === true) {
		result[0] = result[0].toLocaleString();
	} else if (locale.length > 0) {
		result[0] = result[0].toLocaleString(locale, localeOptions);
	} else if (separator.length > 0) {
		result[0] = result[0].toString().replace(".", separator);
	}

	// Returning Array, Object, or String (default)
	if (output === "array") {
		return result;
	}

	if (full) {
		result[1] = fullforms[e] ? fullforms[e] : fullform[standard][e] + (bits ? "bit" : "byte") + (result[0] === 1 ? "" : "s");
	}

	if (output === "object") {
		return {value: result[0], symbol: result[1]};
	}

	return result.join(spacer);
}

// Partial application for functional programming
filesize.partial = opt => arg => filesize(arg, opt);

module.exports = filesize;
