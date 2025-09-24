import { Request, Response } from "express";
import { IssueModel } from "../models/issue.model";
import { MultimediaModel } from "../models/multimedia.model";

export const createIssue = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);
    const files = (req.files as Express.Multer.File[]) || [];

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
    let parsedLocation: any;

if (typeof location === "string") {
  try {
    parsedLocation = JSON.parse(location);
  } catch (err) {
    console.error("Failed to parse location:", location);
    res.status(400).json({ message: "Invalid location JSON format" });
    return;
  }
} else if (typeof location === "object" && location !== null) {
  parsedLocation = location;
} else {
  res.status(400).json({ message: "Location is missing or invalid" });
  return;
}

    if (
      !title ||
      !description ||
      !parsedLocation ||
      !parsedLocation.latitude ||
      !parsedLocation.longitude ||
      !issueType
    ) {
      res.status(400).json({ message: "Please fill all the required fields " });
      return;
    }

    const existingIssue = await IssueModel.findOne({ title });
    if (existingIssue) {
      res
        .status(400)
        .json({ message: " Issue with this title already exists" });
      return;
    }

    const issue = await IssueModel.create({
      citizenId: (req as any).citizenId, // Adapt as per your auth
      issueType,
      title,
      description,
      location: parsedLocation,
      status: "Reported",
      multimediaId: (req as any).multimediaId,
      language: language || "en",
    });

    const mediaDocs = await Promise.all(
      files.map((file) =>
        MultimediaModel.create({
          issueID: issue._id,
          fileType: file.mimetype.startsWith("video") ? "video" : "image",
          url: file.path,
          filename: file.originalname,
        })
      )
    );
    console.log("Response body:", {
      message: "Issue created",
      media: mediaDocs,
    });

    res.status(200).json({ message: "Issue created", issue, media: mediaDocs });
  } catch (error) {
    console.error("Error creating issue:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getIssues = async (req: Request, res: Response) => {
  try {
    const { language } = req.query;
    
    // Build filter object
    const filter: any = {};
    if (language && ["en", "hi", "kn"].includes(language as string)) {
      filter.language = language;
    }
    
    const issues = await IssueModel.find(filter)
      .populate("citizenId", "fullName")
      .lean();

    const issuesWithMedia = await Promise.all(
      issues.map(async (issue) => {
        const media = await MultimediaModel.find({ issueID: issue._id });
        // Build absolute URL if needed
        const firstUrl = media.length > 0 ? (media[0] as any).url : null;
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
          reportedBy: (issue.citizenId as any)?.fullName || "Anonymous",
          reportedAt: issue.createdAt,
          image: imageUrl,
          status: issue.status,
          hypePoints: issue.hypePoints || 0,
          userHasHyped: Array.isArray((issue as any).hypedBy)
            ? (issue as any).hypedBy.some((id: any) => id?.toString() === req.citizenId)
            : false,
        };
      })
    );

    res.json({ issues: issuesWithMedia });
  } catch (err) {
    console.error("Error fetching issues:", err);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const hypeIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const citizenId = req.citizenId;

    if (!citizenId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Attempt atomic update: only hype if user hasn't hyped before
    const updated = await IssueModel.findOneAndUpdate(
      { _id: id, hypedBy: { $ne: citizenId } },
      { $addToSet: { hypedBy: citizenId }, $inc: { hypePoints: 1 } },
      { new: true }
    ).lean();

    if (!updated) {
      // Either issue not found or already hyped by this user
      const existing = await IssueModel.findById(id).lean();
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
  } catch (error) {
    console.error("Error hyping issue:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
