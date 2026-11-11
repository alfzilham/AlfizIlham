/** Landing-footer gradient as a fixed, slowly moving backdrop. Only transform and opacity animate. */
export function DashboardBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0a0a0a]">
      <div
        className="aiz-drift-a absolute -right-[10%] -bottom-[15%] h-[125%] w-[125%] will-change-transform"
        style={{ background: 'radial-gradient(95% 100% at 100% 100%, rgba(255,160,100,0.62) 0%, rgba(226,83,26,0.5) 24%, rgba(120,40,10,0.34) 50%, rgba(10,10,10,0) 78%)' }}
      />
      <div
        className="aiz-drift-b absolute -bottom-[15%] -left-[10%] h-[110%] w-[80%] will-change-transform"
        style={{ background: 'radial-gradient(70% 70% at 0% 100%, rgba(143,45,10,0.5), rgba(10,10,10,0) 70%)' }}
      />
      <div
        className="aiz-drift-c absolute inset-x-0 -bottom-[25%] h-[70%] will-change-transform"
        style={{ background: 'radial-gradient(45% 60% at 50% 100%, rgba(255,106,26,0.3), rgba(10,10,10,0) 70%)' }}
      />
    </div>
  );
}
