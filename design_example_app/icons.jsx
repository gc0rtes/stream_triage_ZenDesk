// Tiny monochrome icons — stroke-based, use currentColor.

const Icon = ({ path, size = 14, fill = 'none', stroke = 'currentColor', sw = 1.6, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {path}
  </svg>
);

const IconSearch  = (p) => <Icon {...p} path={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>} />;
const IconClock   = (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>} />;
const IconLinear  = (p) => <Icon {...p} path={<><path d="M3 13a9 9 0 0 1 8 8"/><path d="M3 9a13 13 0 0 1 12 12"/><path d="M3 5a17 17 0 0 1 16 16"/></>} />;
const IconReply   = (p) => <Icon {...p} path={<><path d="M21 12a8 8 0 0 1-11.3 7.3L3 21l1.7-6.7A8 8 0 1 1 21 12z"/></>} />;
const IconAlert   = (p) => <Icon {...p} path={<><path d="M12 3 2 21h20z"/><path d="M12 10v5"/><circle cx="12" cy="18" r=".6" fill="currentColor"/></>} />;
const IconFlame   = (p) => <Icon {...p} path={<><path d="M12 3c2 4 6 5 6 10a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 2 4 -3z"/></>} />;
const IconPause   = (p) => <Icon {...p} path={<><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></>} />;
const IconSparkle = (p) => <Icon {...p} path={<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></>} />;
const IconHourglass = (p) => <Icon {...p} path={<><path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9"/></>} />;
const IconCheck   = (p) => <Icon {...p} path={<path d="M4 12.5 9.5 18 20 6"/>} />;
const IconX       = (p) => <Icon {...p} path={<><path d="M6 6l12 12"/><path d="M18 6l-6 6"/></>} />;
const IconFilter  = (p) => <Icon {...p} path={<path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/>} />;
const IconPlus    = (p) => <Icon {...p} path={<><path d="M12 5v14"/><path d="M5 12h14"/></>} />;
const IconRefresh = (p) => <Icon {...p} path={<><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>} />;
const IconDot     = (p) => <Icon {...p} fill="currentColor" stroke="none" path={<circle cx="12" cy="12" r="4"/>} />;
const IconSmile   = (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="10" r=".6" fill="currentColor"/><circle cx="15" cy="10" r=".6" fill="currentColor"/></>} />;
const IconMeh     = (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="9"/><path d="M8 15h8"/><circle cx="9" cy="10" r=".6" fill="currentColor"/><circle cx="15" cy="10" r=".6" fill="currentColor"/></>} />;
const IconFrown   = (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="9"/><path d="M8 16s1.5-2 4-2 4 2 4 2"/><circle cx="9" cy="10" r=".6" fill="currentColor"/><circle cx="15" cy="10" r=".6" fill="currentColor"/></>} />;

Object.assign(window, {
  IconSearch, IconClock, IconLinear, IconReply, IconAlert, IconFlame,
  IconPause, IconSparkle, IconHourglass, IconCheck, IconX, IconFilter,
  IconPlus, IconRefresh, IconDot, IconSmile, IconMeh, IconFrown,
});
