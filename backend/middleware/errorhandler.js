


const errorhandler = (err, req, res, next) => {
    const status = err.status || 500
    const message = err.message || "Internal Server Error"
    const stack = err.stack

    console.error(`Error: ${status}: ${stack}`)

    res.status(status).json({
        status,
        message,
        stack
    })

}

export default errorhandler