// src/controllers/grfController.js
const { GrfNode } = require("@chicowall/grf-loader");

const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

const SUPPORTED_FILENAME_ENCODINGS = new Set(["auto", "utf-8", "cp949", "euc-kr"]);

function getFilenameEncoding() {
	const requested = (process.env.GRF_FILENAME_ENCODING || "auto").trim().toLowerCase();
	if (!SUPPORTED_FILENAME_ENCODINGS.has(requested)) {
		logger.warn(`Unsupported GRF_FILENAME_ENCODING "${requested}"; using auto detection.`);
		return "auto";
	}
	return requested;
}

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
}

module.exports = Grf;
