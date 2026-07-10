import { checkIfEmailInUse, getUserById, updateUserById } from "../services/auth.services.js";
import { getNutritionProfile, updateNutritionProfileByUserId } from "../services/caltracker.services.js";

const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9
};

const buildNutritionProfile = (body, userId) => {
    const height = Number(body.height);
    const weight = Number(body.weight);
    const age = Number(body.age);
    const gender = body.gender;
    const goal_selection = body.goal_selection || body.goal;
    const goal_selection2 = Number(body.goal_selection2 ?? body.goalAdjustment ?? 0);
    const activity_level = body.activity_level || body.activityLevel;

    const weightKg = weight * 0.453592;
    const heightCm = height * 2.54;
    let bmr = 0;

    if (gender === "male") {
        bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
    } else {
        bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
    }

    const maintenanceCalories = bmr * activityMultipliers[activity_level];
    const protein = Math.round(weight * 1);
    const fats = Math.round(weight * 0.35);
    let targetCalories = maintenanceCalories;

    if (goal_selection === "bulk") {
        targetCalories += goal_selection2;
    }

    if (goal_selection === "cut") {
        targetCalories -= goal_selection2;
    }

    return {
        user_id: userId,
        height,
        weight,
        gender,
        age,
        goal_selection,
        goal_selection2,
        activity_level,
        calories: Math.round(targetCalories),
        protein,
        fats,
        carbs: Math.round((targetCalories - (protein * 4) - (fats * 9)) / 4)
    };
};

export const getProfile = async (req, res) => {
    const userId = req.user.userId;

    const user = await getUserById(userId);
    const nutritionProfile = await getNutritionProfile(userId);

    if (user.error) {
        return res.status(404).json({message:user.error.message});
    }

    if (nutritionProfile.error) {
        return res.status(500).json({message:nutritionProfile.error.message});
    }

    return res.status(200).json({
        user:user.data,
        nutritionProfile:nutritionProfile.data?.[0] || null
    });
};

export const updateProfileInfo = async (req, res) => {
    const userId = req.user.userId;
    const { username, email, first_name, last_name } = req.body;

    if (!username || !email || !first_name || !last_name) {
        return res.status(400).json({message:"Missing profile information"});
    }

    const currentUser = await getUserById(userId);

    if (currentUser.error) {
        return res.status(404).json({message:currentUser.error.message});
    }

    if (email !== currentUser.data.email) {
        const emailInUse = await checkIfEmailInUse(email);

        if (emailInUse) {
            return res.status(409).json({message:"Email already in use"});
        }
    }

    const updatedUser = await updateUserById(userId, {
        username,
        email,
        first_name,
        last_name
    });

    if (updatedUser.error) {
        return res.status(500).json({message:updatedUser.error.message});
    }

    return res.status(200).json({user:updatedUser.data});
};

export const updateProfileNutrition = async (req, res) => {
    const userId = req.user.userId;

    if (
        req.body.height === undefined ||
        req.body.weight === undefined ||
        req.body.gender === undefined ||
        req.body.age === undefined ||
        (req.body.goal_selection === undefined && req.body.goal === undefined) ||
        (req.body.goal_selection2 === undefined && req.body.goalAdjustment === undefined) ||
        (req.body.activity_level === undefined && req.body.activityLevel === undefined)
    ) {
        return res.status(400).json({message:"Missing nutrition profile information"});
    }

    const nutritionProfile = buildNutritionProfile(req.body, userId);
    const updatedProfile = await updateNutritionProfileByUserId(userId, nutritionProfile);

    if (updatedProfile.error) {
        return res.status(500).json({message:updatedProfile.error.message});
    }

    return res.status(200).json({nutritionProfile:updatedProfile.data?.[0] || null});
};
