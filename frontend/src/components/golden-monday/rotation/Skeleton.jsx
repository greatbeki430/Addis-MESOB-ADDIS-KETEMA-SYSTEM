// src/components/golden-monday/rotation/Skeleton.jsx

export function ShimmerBlock({ height = 60, borderRadius = 14, delay = 0 }) {
  return (
    <div
      style={{
        height,
        borderRadius,
        background:
          "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
        backgroundSize: "200% 100%",
        animation: `shimmer 1.5s ease-in-out infinite ${delay}s`,
      }}
    />
  );
}

export function PresenterSkeleton() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <ShimmerBlock height={100} />
      <ShimmerBlock height={60} delay={0.3} />
    </div>
  );
}

export function RankingSkeleton() {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <ShimmerBlock key={i} height={52} borderRadius={12} delay={i * 0.05} />
      ))}
    </div>
  );
}

export function RecordingsSkeleton() {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {[1, 2].map((i) => (
        <ShimmerBlock key={i} height={76} borderRadius={12} delay={i * 0.1} />
      ))}
    </div>
  );
}
