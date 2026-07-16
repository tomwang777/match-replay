/** Canada · Mexico · USA host-nation accent bar (WC 2026 tri-host). */
export function HostNationsStrip({ className }: { className?: string }) {
  return (
    <div
      className={`flex h-1 w-full ${className ?? ""}`}
      role="img"
      aria-label="Hosts: Canada, Mexico, United States"
    >
      <span className="flex-1 bg-host-can" />
      <span className="flex-1 bg-host-mex" />
      <span className="flex-1 bg-host-usa" />
    </div>
  );
}
