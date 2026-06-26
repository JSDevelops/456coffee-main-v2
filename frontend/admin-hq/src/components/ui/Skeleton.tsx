interface SkeletonProps {
  className?: string;
  rounded?: 'md' | 'lg' | 'xl' | 'full';
}

const radii = {
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

export function Skeleton({ className = '', rounded = 'lg' }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer ${className}`}
      style={{ borderRadius: radii[rounded] }}
    />
  );
}
