const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())


const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)


module.exports = app