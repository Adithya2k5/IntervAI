const userModel = require('../models/user.model')
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require('../models/blacklist.model')


/**
 * @route POST /api/auth/
 * @description register a new user, expects username, password, and email
 * @access Public
 */

async function registerUserController(req, res) {

    const { username, email, password } = req.body

    if (!username || !email || !password) {
        return res.status(400).json({
            message: "Please provide username, email, and password"
        })
    }

    const isUserAlreadyExists = await userModel.findOne({
        $or: [
            { username },
            { email }
        ]
    })

    if (isUserAlreadyExists) {

        /* isUserAlreadyExists.username === username this works in this if condition */
        return res.status(400).json({
            message: "Account already exists with this username or email"
        })
    }

    const hash = await bcrypt.hash(password, 10)


    /* create a new user in the database */
    const user = await userModel.create({
        username,
        email,
        password: hash
    })

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none", maxAge: 24 * 60 * 60 * 1000 });

    res.status(201).json({
        message: "User registered successfully",
        user: {
            username: user.username,
            email: user.email,
            id: user._id
        }
    })



}

const loginUserController = async (req, res) => {
    const { email, password } = req.body

    const user = await userModel.findOne({ email })
    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

        res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none", maxAge: 24 * 60 * 60 * 1000 });    
        res.status(200).json({
        messsage: "User Logged-In Successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}

/**
 * @name logoutUserController
 * @description clear token from user cookie and the token in blacklist
 * @access public
 */
async function logoutUserController(req, res) {

    const token = req.cookies.token;

    const isBlacklisted = await tokenBlacklistModel.findOne({ token });

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Token is blacklisted"
        });
    }

    if (token) {
        await tokenBlacklistModel.create({ token })
    }

    res.clearCookie("token")

    res.status(200).json({
        message: " user logged out successfully "
    })
}

/**
 * @name getMeController
 * @description get the current logged in user details
 * @access private
 */

async function getMeController(req, res){

    const user = await userModel.findById(req.user.id)

    res.status(200).json({
        message: "user detail fetched successfully",
        user:{
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}