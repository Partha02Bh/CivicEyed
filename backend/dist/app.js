"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const citizen_routes_1 = __importDefault(require("./routes/citizen.routes"));
const issue_routes_1 = __importDefault(require("./routes/issue.routes"));
const announcement_routes_1 = __importDefault(require("./routes/announcement.routes"));
const issue_model_1 = require("./models/issue.model");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static("public"));
app.use((0, cookie_parser_1.default)());
// routes declaration
app.use("/api/v1", citizen_routes_1.default);
app.use("/api/v1", admin_routes_1.default);
app.use("/api/v1", issue_routes_1.default);
app.use("/api/v1", announcement_routes_1.default);
app.use("/api", (_req, res) => {
    res.status(404).json({ message: "API route not found" });
});
app.get('/', (req, res) => {
    res.send('Civic Issue Reporter Backend is Running');
});
exports.default = app;
// One-time startup migration to backfill hype fields for existing issues
function ensureHypeFields() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield issue_model_1.IssueModel.updateMany({ hypePoints: { $exists: false } }, { $set: { hypePoints: 0 } });
            yield issue_model_1.IssueModel.updateMany({ hypedBy: { $exists: false } }, { $set: { hypedBy: [] } });
            yield issue_model_1.IssueModel.updateMany({ language: { $exists: false } }, { $set: { language: "en" } });
        }
        catch (err) {
            console.error("Failed to ensure hype and language fields:", err);
        }
    });
}
// Fire and forget; do not block server start
ensureHypeFields();
