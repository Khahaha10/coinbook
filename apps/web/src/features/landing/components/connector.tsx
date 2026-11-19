interface Curve {
  path: string;
  start: [number, number];
  head: string;
}

export interface ConnectorProps {
  id: string;
  desktop: Curve;
  mobile: Curve;
}

function Line({
  maskId,
  curve,
  viewBox,
  mask,
  r,
}: {
  maskId: string;
  curve: Curve;
  viewBox: string;
  mask: { w: number; h: number };
  r: [number, number];
}) {
  const end = curve.path.trim().split(/[ ,]+/).slice(-2).map(Number);
  return (
    <svg className={viewBox === '0 0 1000 220' ? 'lk-d' : 'lk-m'} viewBox={viewBox}>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="-20" y="-20" width={mask.w} height={mask.h}>
          <path className="ar-mask" pathLength={1} d={curve.path} />
        </mask>
      </defs>
      <circle cx={curve.start[0]} cy={curve.start[1]} r={r[0]} fill="#C8961E" />
      <path className="ar-dash" mask={`url(#${maskId})`} d={curve.path} />
      <circle className="ar-tip" r={r[1]} cx={end[0]} cy={end[1]} />
      <path className="ar-head on" d={curve.head} />
    </svg>
  );
}

export function Connector({ id, desktop, mobile }: ConnectorProps) {
  return (
    <div className="fx-link" aria-hidden="true" data-lk="">
      <Line
        maskId={`${id}d`}
        curve={desktop}
        viewBox="0 0 1000 220"
        mask={{ w: 1040, h: 260 }}
        r={[6, 7]}
      />
      <Line
        maskId={`${id}m`}
        curve={mobile}
        viewBox="0 0 300 160"
        mask={{ w: 340, h: 200 }}
        r={[5, 6]}
      />
    </div>
  );
}
