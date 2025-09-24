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
Object.defineProperty(exports, "__esModule", { value: true });
exports.hypeIssue = exports.getIssues = exports.createIssue = void 0;
const issue_model_1 = require("../models/issue.model");
const multimedia_model_1 = require("../models/multimedia.model");
const createIssue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("req.body:", req.body);
        console.log("req.files:", req.files);
        const files = req.files || [];
        const { title = "Untitled", description, location, issueType, language = "en" } = req.body;
        // location stuff
        // let parsedLocation = location;
        // if (typeof location === "string") {
        //   try {
        //     parsedLocation = JSON.parse(location);
        //   } catch {
        //     res.status(400).json({ message: "Invalid location JSON format" });
        //     return;
        //   }
        // }
        let parsedLocation;
        if (typeof location === "string") {
            try {
                parsedLocation = JSON.parse(location);
            }
            catch (err) {
                console.error("Failed to parse location:", location);
                res.status(400).json({ message: "Invalid location JSON format" });
                return;
            }
        }
        else if (typeof location === "object" && location !== null) {
            parsedLocation = location;
        }
        else {
            res.status(400).json({ message: "Location is missing or invalid" });
            return;
        }
        if (!title ||
            !description ||
            !parsedLocation ||
            !parsedLocation.latitude ||
            !parsedLocation.longitude ||
            !issueType) {
            res.status(400).json({ message: "Please fill all the required fields " });
            return;
        }
        const existingIssue = yield issue_model_1.IssueModel.findOne({ title });
        if (existingIssue) {
            res
                .status(400)
                .json({ message: " Issue with this title already exists" });
            return;
        }
        const issue = yield issue_model_1.IssueModel.create({
            citizenId: req.citizenId, // Adapt as per your auth
            issueType,
            title,
            description,
            location: parsedLocation,
            status: "Reported",
            multimediaId: req.multimediaId,
            language: language || "en",
        });
        const mediaDocs = yield Promise.all(files.map((file) => multimedia_model_1.MultimediaModel.create({
            issueID: issue._id,
            fileType: file.mimetype.startsWith("video") ? "video" : "image",
            url: file.path,
            filename: file.originalname,
        })));
        console.log("Response body:", {
            message: "Issue created",
            media: mediaDocs,
        });
        res.status(200).json({ message: "Issue created", issue, media: mediaDocs });
    }
    catch (error) {
        console.error("Error creating issue:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.createIssue = createIssue;
const getIssues = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { language } = req.query;
        // Build filter object
        const filter = {};
        if (language && ["en", "hi", "kn"].includes(language)) {
            filter.language = language;
        }
        const issues = yield issue_model_1.IssueModel.find(filter)
            .populate("citizenId", "fullName")
            .lean();
        const issuesWithMedia = yield Promise.all(issues.map((issue) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const media = yield multimedia_model_1.MultimediaModel.find({ issueID: issue._id });
            // Build absolute URL if needed
            const firstUrl = media.length > 0 ? media[0].url : null;
            const base = `${req.protocol}://${req.get("host")}`;
            const imageUrl = firstUrl
                ? (firstUrl.startsWith("http://") || firstUrl.startsWith("https://")
                    ? firstUrl
                    : `${base}/${firstUrl.replace(/^\//, "")}`)
                : null;
            return {
                _id: issue._id,
                title: issue.title,
                description: issue.description,
                type: issue.issueType,
                location: issue.location, //  send only address
                reportedBy: ((_a = issue.citizenId) === null || _a === void 0 ? void 0 : _a.fullName) || "Anonymous",
                reportedAt: issue.createdAt,
                image: imageUrl,
                status: issue.status,
                hypePoints: issue.hypePoints || 0,
                userHasHyped: Array.isArray(issue.hypedBy)
                    ? issue.hypedBy.some((id) => (id === null || id === void 0 ? void 0 : id.toString()) === req.citizenId)
                    : false,
            };
        })));
        res.json({ issues: issuesWithMedia });
    }
    catch (err) {
        console.error("Error fetching issues:", err);
        res.status(500).json({
            message: "Something went wrong",
        });
    }
});
exports.getIssues = getIssues;
const hypeIssue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const citizenId = req.citizenId;
        if (!citizenId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        // Attempt atomic update: only hype if user hasn't hyped before
        const updated = yield issue_model_1.IssueModel.findOneAndUpdate({ _id: id, hypedBy: { $ne: citizenId } }, { $addToSet: { hypedBy: citizenId }, $inc: { hypePoints: 1 } }, { new: true }).lean();
        if (!updated) {
            // Either issue not found or already hyped by this user
            const existing = yield issue_model_1.IssueModel.findById(id).lean();
            if (!existing) {
                res.status(404).json({ message: "Issue not found" });
                return;
            }
            res.status(200).json({
                message: "Already hyped",
                hypePoints: existing.hypePoints || 0,
                userHasHyped: true,
            });
            return;
        }
        res.status(200).json({
            message: "Hype added",
            hypePoints: updated.hypePoints || 0,
            userHasHyped: true,
        });
    }
    catch (error) {
        console.error("Error hyping issue:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.hypeIssue = hypeIssue;
