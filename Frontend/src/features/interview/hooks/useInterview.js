import { getAllInterviewReports, generateInterviewReport, getInterviewReportById } from "../services/interview.api";
import { useState } from "react";
import { InterviewContext } from "../interview.context.jsx";



// export const useInterview = () => {

//     const [loading, setLoading] = useState(false)



import { useEffect } from 'react'
import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true
});

export const useInterview = () => {
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState(null)
    const [reports, setReports] = useState([])
    const [error, setError] = useState(null)

    const getReports = async () => {
        setLoading(true)
        setError(null)
        try {
            const { data } = await api.get('/api/interview')
            const nextReports = data?.interviewReports || []
            setReports(nextReports)
            return nextReports
        } catch (error) {
            console.error('Failed to fetch interview reports:', error)
            setReports([])
            setError('Unable to load your interview reports. Please try again.')
            return []
        } finally {
            setLoading(false)
        }
    }

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        setError(null)
        const formData = new FormData()

        formData.append('jobDescription', jobDescription || '')
        formData.append('selfDescription', selfDescription || '')

        if (resumeFile) {
            formData.append('resume', resumeFile)
        }

        try {
            const { data } = await api.post('/api/interview', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })

            const nextReport = data?.interviewReport || data || null
            if (nextReport) {
                setReport(nextReport)
                setReports((prev) => {
                    const filtered = prev.filter((item) => item?._id !== nextReport?._id)
                    return [nextReport, ...filtered]
                })
            }

            return nextReport
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to generate interview report. Please try again.'
            setError(message)
            console.error('Failed to generate interview report:', message)
            throw new Error(message)
        } finally {
            setLoading(false)
        }
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        setError(null)
        try {
            const { data } = await api.get(`/api/interview/report/${interviewId}`)
            const nextReport = data?.interviewReport || null
            setReport(nextReport)
            return nextReport
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                'Failed to fetch the interview report. Please try again.'
            setError(message)
            console.error('Failed to fetch interview report:', message)
            setReport(null)
            throw new Error(message)
        } finally {
            setLoading(false)
        }
    }

    const getResumePdf = async (interviewId) => {
        try {
            const { data } = await api.post(`/api/interview/resume/pdf/${interviewId}`, {}, {
                responseType: 'blob',
            })

            const fileUrl = window.URL.createObjectURL(new Blob([data]))
            const link = document.createElement('a')
            link.href = fileUrl
            link.setAttribute('download', `resume_${interviewId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(fileUrl)
        } catch (error) {
            console.error('Failed to download resume PDF:', error)
            throw error
        }
    }

    useEffect(() => {
        getReports()
    }, [])

    return {
        loading,
        report,
        reports,
        error,
        generateReport,
        getReportById,
        getResumePdf,
        getReports,
    }
}
