const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeInterviewReport } = require('../src/services/ai.service');

test('falls back to a title derived from the job description when the AI payload omits one', () => {
    const normalized = normalizeInterviewReport(
        { candidate_report: 'Candidate details' },
        'Senior Full Stack Engineer'
    );

    assert.equal(normalized.title, 'Senior Full Stack Engineer');
    assert.equal(normalized.matchScore, 0);
    assert.deepEqual(normalized.technicalQuestions, []);
    assert.deepEqual(normalized.behavioralQuestions, []);
    assert.deepEqual(normalized.skillGaps, []);
    assert.deepEqual(normalized.preparationPlan, []);
});

test('preserves an explicit title from the AI payload', () => {
    const normalized = normalizeInterviewReport({ title: 'Custom Job Title' }, 'Ignored Job');

    assert.equal(normalized.title, 'Custom Job Title');
});
