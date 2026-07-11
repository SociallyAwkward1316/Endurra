import { getUserAnalyticsOverview, getUserExerciseAnalytics } from "../services/analytics.services.js";

export const analyticsOverview = async (req, res) => {
    const userId = req.user.userId;
    const { start, end } = req.query;

    if (!isValidDateRange(start, end)) {
        return res.status(400).json({ message: "A valid analytics date range is required" });
    }

    const analytics = await getUserAnalyticsOverview(userId, start, end);

    if (analytics.error) {
        return res.status(500).json({ message: analytics.error.message });
    }

    return res.status(200).json({ data: analytics.data });
};

export const exerciseAnalytics = async (req, res) => {
    const userId = req.user.userId;
    const exerciseId = req.params.exerciseId;
    const { start, end } = req.query;

    if (!isValidDateRange(start, end)) {
        return res.status(400).json({ message: "A valid analytics date range is required" });
    }

    const analytics = await getUserExerciseAnalytics(userId, exerciseId, start, end);

    if (analytics.error) {
        const status = analytics.error.message === "Exercise analytics not found" ? 404 : 500;

        return res.status(status).json({ message: analytics.error.message });
    }

    return res.status(200).json({ data: analytics.data });
};

const isValidDateRange = (start, end) => {
    if (typeof start !== "string" || typeof end !== "string") {
        return false;
    }

    const startTime = Date.parse(start);
    const endTime = Date.parse(end);

    return Number.isFinite(startTime) && Number.isFinite(endTime) && startTime < endTime;
};
