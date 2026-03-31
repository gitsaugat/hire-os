/**
 * Color-coded badge for CandidateStatus values.
 * @param {{ status: string, variant?: 'default' | 'light' }} props
 */
export default function StatusBadge({ status, variant = 'default' }) {
  const colorMap = {
    APPLIED:                { bg: 'bg-blue-100',    text: 'text-blue-800' },
    SCREENING:              { bg: 'bg-amber-100',   text: 'text-amber-800' },
    SCREENED:               { bg: 'bg-yellow-100',  text: 'text-yellow-800' },
    SCREENING_FAILED:       { bg: 'bg-red-100',     text: 'text-red-800' },
    SHORTLISTED:            { bg: 'bg-indigo-100',  text: 'text-indigo-800' },

    INTERVIEW_SCHEDULING:   { bg: 'bg-purple-100',  text: 'text-purple-800' },
    INTERVIEW_SCHEDULED:    { bg: 'bg-purple-100',  text: 'text-purple-800' },
    INTERVIEW_COMPLETED:    { bg: 'bg-teal-100',    text: 'text-teal-800' },
    OFFER_PENDING:          { bg: 'bg-orange-100',  text: 'text-orange-800' },
    OFFER_SENT:             { bg: 'bg-orange-100',  text: 'text-orange-800' },
    OFFER_SIGNED:           { bg: 'bg-green-100',   text: 'text-green-800' },
    ONBOARDED:              { bg: 'bg-green-100',   text: 'text-green-800' },
    REJECTED:               { bg: 'bg-red-100',     text: 'text-red-800' },

    // Offer Table Specific
    PENDING_REVIEW:         { bg: 'bg-amber-100',   text: 'text-amber-800' },
    SENT:                   { bg: 'bg-blue-100',    text: 'text-blue-800' },
    ACCEPTED:               { bg: 'bg-green-100',   text: 'text-green-800' },
    DECLINED:               { bg: 'bg-red-100',     text: 'text-red-800' },
  }

  const colors = colorMap[status] ?? { bg: 'bg-gray-100', text: 'text-gray-700' }

  // Light variant: white/translucent for use on dark backgrounds (e.g. gradient header)
  const classes = variant === 'light'
    ? 'bg-white/20 text-white backdrop-blur-sm'
    : `${colors.bg} ${colors.text}`

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
