interface VoteButtonProps {
  votes: number;
  onVoteUp?: () => void;
  onVoteDown?: () => void;
  disabled?: boolean;
}

export default function VoteButton({
  votes,
  onVoteUp,
  onVoteDown,
  disabled = false,
}: VoteButtonProps) {
  return (
    <div className="flex items-center gap-2 rounded p-2 w-fit" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
      <button
        onClick={onVoteUp}
        disabled={disabled}
        className="transition-colors disabled:opacity-50 hover:text-violet-500"
        style={{ color: "var(--text-muted)" }}
        title="Vote up"
      >
        ↑
      </button>
      <span className="font-semibold w-6 text-center" style={{ color: "var(--text-primary)" }}>{votes}</span>
      <button
        onClick={onVoteDown}
        disabled={disabled}
        className="transition-colors disabled:opacity-50 hover:text-red-500"
        style={{ color: "var(--text-muted)" }}
        title="Vote down"
      >
        ↓
      </button>
    </div>
  );
}
