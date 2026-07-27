export function LoadingSpinner({ size = 64, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/loading/loading.gif"
      alt="Loading"
      width={size}
      height={size * (180 / 260)}
      className={className}
    />
  );
}
