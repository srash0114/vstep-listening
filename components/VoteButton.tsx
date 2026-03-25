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
    <div className="flex items-center gap-2 bg-gray-100 rounded p-2 w-fit">
      <button
        onClick={onVoteUp}
        disabled={disabled}
        className="text-gray-600 hover:text-blue-600 transition disabled:opacity-50"
        title="Vote up"
      >
        ↑
      </button>
      <span className="font-semibold text-gray-700 w-6 text-center">{votes}</span>
      <button
        onClick={onVoteDown}
        disabled={disabled}
        className="text-gray-600 hover:text-red-600 transition disabled:opacity-50"
        title="Vote down"
      >
        ↓
      </button>
    </div>
  );
}
