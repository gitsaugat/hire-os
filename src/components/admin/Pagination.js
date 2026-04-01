'use client'

export default function Pagination({ currentPage, totalCount, pageSize, onPageChange }) {
  const totalPages = Math.ceil(totalCount / pageSize)
  
  if (totalPages <= 1) return null

  // Generate page numbers to show
  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-50 mt-auto">
      <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">
        Showing <span className="text-gray-900">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="text-gray-900">{totalCount}</span>
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-20 transition-all text-gray-500"
        >
          ←
        </button>
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`h-8 w-8 rounded-lg text-xs font-black transition-all ${
              currentPage === page 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-20 transition-all text-gray-500"
        >
          →
        </button>
      </div>
    </div>
  )
}
