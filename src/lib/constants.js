/**
 * All status values for the candidate hiring pipeline.
 * Ordered to reflect the progression.
 */
export const CANDIDATE_STATUSES = [
  'APPLIED',
  'SCREENING',
  'SCREENED',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULING',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_COMPLETED',
  'INTERVIEW_DONE',
  'OFFER_PENDING',
  'OFFER_SENT',
  'OFFER_SIGNED',
  'ONBOARDED',
  'REJECTED',
]

export const ROLE_STATUSES = ['OPEN', 'CLOSED']

export const CHANGED_BY = {
  AI: 'AI',
  HUMAN: 'HUMAN',
}
