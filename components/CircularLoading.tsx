interface CircularLoadingProps {
  size?: number;
  color?: string;
}

export default function CircularLoading({
  size = 40,
  color = "blue",
}: CircularLoadingProps) {
  const colorClasses = {
    blue: "border-blue-500",
    green: "border-green-500",
    red: "border-red-500",
    gray: "border-gray-500",
  };

  return (
    <div className="flex justify-center items-center">
      <div
        style={{ width: size, height: size }}
        className={`border-4 ${colorClasses[color as keyof typeof colorClasses]} border-t-transparent rounded-full animate-spin`}
      ></div>
    </div>
  );
}
