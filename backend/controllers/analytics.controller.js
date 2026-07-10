import { getUserAnalyticsOverview, getUserExerciseAnalytics } from "../services/analytics.services.js";

export const analyticsOverview = async (req, res) => {
    const userId = req.user.userId;
    const analytics = await getUserAnalyticsOverview(userId);

    if (analytics.error) {
        return res.status(500).json({ message: analytics.error.message });
    }

    return res.status(200).json({ data: analytics.data });
};

export const exerciseAnalytics = async (req, res) => {
    const userId = req.user.userId;
    const exerciseId = req.params.exerciseId;

    const analytics = await getUserExerciseAnalytics(userId, exerciseId);

    if (analytics.error) {
        const status = analytics.error.message === "Exercise analytics not found" ? 404 : 500;

        return res.status(status).json({ message: analytics.error.message });
    }

    return res.status(200).json({ data: analytics.data });
};
