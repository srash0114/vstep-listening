interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded disabled:opacity-50 transition-all"
        style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
        onMouseEnter={e => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLElement).style.background = "var(--bg-overlay)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
      >
        Previous
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className="px-4 py-2 rounded transition-all"
          style={
            page === currentPage
              ? { background: "var(--accent-violet)", color: "#fff", border: "1px solid var(--accent-violet)" }
              : { background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }
          }
          onMouseEnter={e => { if (page !== currentPage) (e.currentTarget as HTMLElement).style.background = "var(--bg-overlay)"; }}
          onMouseLeave={e => { if (page !== currentPage) (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded disabled:opacity-50 transition-all"
        style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
        onMouseEnter={e => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLElement).style.background = "var(--bg-overlay)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
      >
        Next
      </button>
    </div>
  );
}
