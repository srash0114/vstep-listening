interface AvatarProps {
  src?: string | null;
  initials: string;
  size?: "sm" | "lg";
  className?: string;
  style?: React.CSSProperties;
}

export default function Avatar({ src, initials, size = "lg", className = "", style }: AvatarProps) {
  const dim = size === "sm" ? "w-7 h-7 text-xs rounded-lg" : "w-20 h-20 text-2xl rounded-2xl";

  const base: React.CSSProperties = {
    background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
    flexShrink: 0,
    ...style,
  };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={initials}
        className={`${dim} object-cover shrink-0 ${className}`}
        style={{ border: style?.border as string, boxShadow: style?.boxShadow as string }}
        onError={(e) => {
          // Nếu ảnh lỗi thì fallback về div initials
          const target = e.currentTarget;
          const parent = target.parentElement;
          if (!parent) return;
          const div = document.createElement("div");
          div.className = target.className;
          div.style.cssText = `background: linear-gradient(135deg, #7c3aed, #06b6d4); display: flex; align-items: center; justify-content: center; font-weight: 900; color: #fff;`;
          div.textContent = initials;
          parent.replaceChild(div, target);
        }}
      />
    );
  }

  return (
    <div
      className={`${dim} flex items-center justify-center font-black text-white ${className}`}
      style={base}
    >
      {initials}
    </div>
  );
}
