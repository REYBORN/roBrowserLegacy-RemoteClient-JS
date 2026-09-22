// src/controllers/grfController.js
const { GrfNode } = require("@chicowall/grf-loader");

const fs = require("fs");
const path = require("path");
const iconv = require("iconv-lite");
const logger = require("../utils/logger");

<<<<<<< HEAD
const SUPPORTED_FILENAME_ENCODINGS = new Set(["auto", "utf-8", "cp949", "euc-kr"]);

function getFilenameEncoding() {
	const requested = (process.env.GRF_FILENAME_ENCODING || "auto").trim().toLowerCase();
	if (!SUPPORTED_FILENAME_ENCODINGS.has(requested)) {
		logger.warn(`Unsupported GRF_FILENAME_ENCODING "${requested}"; using auto detection.`);
		return "auto";
	}
	return requested;
}
=======
const NUL = Buffer.from([0]);
>>>>>>> cf105965e96341efd9195b3fc6864b1434d50cae

class Grf {
	constructor(filePath) {
		this.fileName = path.basename(filePath);
		this.filePath = filePath;
		this.grf = null;
		this.loaded = false;
	}

	async load() {
		if (!fs.existsSync(this.filePath)) {
			logger.error(`GRF file not found: ${this.filePath}`);
			return;
		}

		try {
			const fd = fs.openSync(this.filePath, "r");
			const filenameEncoding = getFilenameEncoding();
			this.grf = new GrfNode(fd, { filenameEncoding });
			await this.grf.load();
			this.loaded = true;
			logger.info(`Loaded ${this.fileName} with ${filenameEncoding} filename encoding`);
		} catch (error) {
			logger.error("Error loading GRF file:", error);
		}
	}

	async getFile(filename) {
		if (!this.loaded || !this.grf) {
			logger.error("GRF not loaded or not initialized");
			return null;
		}
		try {
			const { data, error } = await this.grf.getFile(filename);
			if (error) {
				return null;
			}
			return Buffer.from(data);
		} catch (error) {
			logger.error(`Error extracting file: ${error}`);
			return null;
		}
	}

	listFiles() {
		if (!this.loaded || !this.grf) {
			logger.error("GRF not loaded or not initialized");
			return [];
		}

		return Array.from(this.grf.files.keys());
	}

	/**
	 * Every name in the archive as roBrowser keeps them for search (GameFile.js, `table.data`): the raw
	 * name bytes, one character per byte, each followed by a NUL, in table order.
	 *
	 * Built from the bytes on disk rather than by re-encoding the decoded names, so a search sees exactly
	 * what the client would, whatever encoding the loader detected.
	 */
	nameTable() {
		if (!this.loaded || !this.grf) return "";

		const parts = [];
		for (const [name, entry] of this.grf.files) {
			parts.push(entry.rawNameBytes || iconv.encode(name, "cp949"), NUL);
		}
		return Buffer.concat(parts).toString("latin1");
	}
}

module.exports = Grf;
