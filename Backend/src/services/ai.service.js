// 
const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

let ai = null
const DEFAULT_GEMINI_MODEL = process.env.GOOGLE_GENAI_MODEL || "gemini-3-pro-preview"
const FALLBACK_GEMINI_MODEL = process.env.GOOGLE_GENAI_FALLBACK_MODEL || "gemini-3.1-pro-preview"
const SECONDARY_GEMINI_MODEL = process.env.GOOGLE_GENAI_SECONDARY_MODEL || "gemini-3.1-flash-lite-preview"

function getAiClient() {
    if (!ai) {
        ai = new GoogleGenAI({
            apiKey: process.env.GOOGLE_GENAI_API_KEY
        })
    }

    return ai
}

function parseJsonResponse(text) {
    try {
        return JSON.parse(text)
    } catch (error) {
        throw new Error(`Invalid JSON response from AI service: ${error.message}. Response text: ${text}`)
    }
}

function isModelFallbackError(error) {
    const message = error?.message?.toString?.() || ""
    return /no longer available|unavailable|not found|404|NOT_FOUND|quota/i.test(message)
}

async function generateAiContent({ prompt, schema, maxOutputTokens = 8192 }) {
    const models = [DEFAULT_GEMINI_MODEL]
    if (FALLBACK_GEMINI_MODEL && FALLBACK_GEMINI_MODEL !== DEFAULT_GEMINI_MODEL) {
        models.push(FALLBACK_GEMINI_MODEL)
    }
    if (SECONDARY_GEMINI_MODEL && SECONDARY_GEMINI_MODEL !== DEFAULT_GEMINI_MODEL && SECONDARY_GEMINI_MODEL !== FALLBACK_GEMINI_MODEL) {
        models.push(SECONDARY_GEMINI_MODEL)
    }

    let lastError = null
    for (let i = 0; i < models.length; i += 1) {
        const model = models[i]
        try {
            return await getAiClient().models.generateContent({
                model,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: zodToJsonSchema(schema),
                    maxOutputTokens,
                }
            })
        } catch (error) {
            lastError = error
            const shouldRetry = i < models.length - 1 && isModelFallbackError(error)
            if (!shouldRetry) {
                throw error
            }
            console.warn(`AI model ${model} failed, retrying with fallback model ${models[i + 1]}`)
        }
    }

    throw lastError
}

function normalizeInterviewReport(payload = {}, jobDescription = "") {
    const source = payload && typeof payload === "object" ? payload : {}

    const normalizedScore = Number.parseInt(source.matchScore, 10)
    const matchScore = Number.isFinite(normalizedScore) ? normalizedScore : 0

    const technicalQuestions = Array.isArray(source.technicalQuestions)
        ? source.technicalQuestions.filter((item) => item && typeof item === "object")
        : []

    const behavioralQuestions = Array.isArray(source.behavioralQuestions)
        ? source.behavioralQuestions.filter((item) => item && typeof item === "object")
        : []

    const skillGaps = Array.isArray(source.skillGaps)
        ? source.skillGaps.filter((item) => item && typeof item === "object")
        : []

    const preparationPlan = Array.isArray(source.preparationPlan)
        ? source.preparationPlan.filter((item) => item && typeof item === "object")
        : []

    const title = source.title || jobDescription?.trim() || "Interview Report"

    return {
        matchScore,
        technicalQuestions,
        behavioralQuestions,
        skillGaps,
        preparationPlan,
        title,
    }
}

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).min(6).describe("At least 6 technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).min(5).describe("At least 5 behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).min(4).describe("At least 4 skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).min(7).describe("A 7-day preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {


    const prompt = `You must respond with valid JSON only. Do not include markdown, extra text, or any commentary.
Return an object with exactly these fields:
- matchScore (number between 0 and 100)
- technicalQuestions (array of objects with question, intention, answer)
- behavioralQuestions (array of objects with question, intention, answer)
- skillGaps (array of objects with skill and severity)
- preparationPlan (array of objects with day, focus, tasks)
- title (string)

Rules:
1. Provide 6-8 technical questions.
2. Provide 5-6 behavioral questions.
3. Provide all relevant skill gaps found by comparing the resume with the job description.
4. Provide a 7-day preparation plan with actionable tasks for each day.
5. Use the job description to create a specific title for the role.
6. If any section is missing from the input, still return valid placeholder entries in that array.
7. Do not include markdown formatting, extra text, or commentary.
8. Use only the candidate details and job description to infer the report.

Example response format:
{
  "matchScore": 85,
  "technicalQuestions": [
    {
      "question": "Describe a time you optimized a production system.",
      "intention": "Assess system design and performance optimization skills.",
      "answer": "Explain the challenge, your approach, impact, and metrics."
    },
    {
      "question": "Describe how you implemented a scalable microservice architecture.",
      "intention": "Assess cloud architecture and scalability skills.",
      "answer": "Describe the architecture, tradeoffs, and operational results."
    }
  ],
  "behavioralQuestions": [
    {
      "question": "Describe a time you led a difficult cross-functional project.",
      "intention": "Assess leadership, collaboration, and communication.",
      "answer": "Use the STAR method and focus on the result and learning."
    },
    {
      "question": "Explain how you handled a tight deadline while maintaining quality.",
      "intention": "Assess time management and prioritization.",
      "answer": "Outline the challenge, tradeoffs, and outcome."
    }
  ],
  "skillGaps": [
    { "skill": "System design", "severity": "high" },
    { "skill": "Cloud architecture", "severity": "medium" }
  ],
  "preparationPlan": [
    { "day": 1, "focus": "Review job requirements and core skills", "tasks": ["Analyze the job description", "Map your resume experience to required skills"] },
    { "day": 2, "focus": "Refresh technical fundamentals", "tasks": ["Review algorithms and data structures", "Solve interview coding problems"] }
  ],
  "title": "Senior Backend Engineer"
}

Generate a realistic interview report for a candidate with the following details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}
`

    const response = await generateAiContent({
        prompt,
        schema: interviewReportSchema,
    })

    console.log("AI finish reason:", response?.candidates?.[0]?.finishReason)
    console.log("AI raw response length:", response?.text?.length)

    const parsedResponse = response?.text ? parseJsonResponse(response.text) : {}
    return normalizeInterviewReport(parsedResponse, jobDescription)

}



async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await generateAiContent({
        prompt,
        schema: resumePdfSchema,
        maxOutputTokens: 16384,
    })

    const jsonContent = parseJsonResponse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf, normalizeInterviewReport }