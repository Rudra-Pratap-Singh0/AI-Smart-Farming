const healthCheck = (req, res) => {
    res.status(200).json({
        success: true,
        message: "Online Learning Platform Backend is running"
    });
};

module.exports = {
    healthCheck
};