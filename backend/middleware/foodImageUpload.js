import multer from "multer"

const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp"
])

const upload = multer({
    storage:multer.memoryStorage(),
    limits:{
        files:1,
        fields:3,
        fileSize:8 * 1024 * 1024
    },
    fileFilter:(req, file, callback) => {
        if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
            const error = new Error("Upload a JPEG, PNG, or WebP image")
            error.status = 400

            return callback(error)
        }

        callback(null, true)
    }
})

export const uploadFoodImage = (req, res, next) => {
    upload.single("image")(req, res, (error) => {
        if (!error) {
            return next()
        }

        if (error instanceof multer.MulterError) {
            const message = error.code === "LIMIT_FILE_SIZE"
                ? "Meal photos must be 8 MB or smaller"
                : "Could not upload that meal photo"

            return res.status(400).json({message})
        }

        return res.status(Number(error.status) || 400).json({
            message:error.message || "Could not upload that meal photo"
        })
    })
}
