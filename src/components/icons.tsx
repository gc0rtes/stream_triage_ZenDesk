import type { CSSProperties, ReactNode } from 'react';

interface IconProps {
  size?: number;
  style?: CSSProperties;
  fill?: string;
  stroke?: string;
  sw?: number;
  path: ReactNode;
}

function Icon({ path, size = 14, fill = 'none', stroke = 'currentColor', sw = 1.6, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {path}
    </svg>
  );
}

interface BaseIconProps {
  size?: number;
  style?: CSSProperties;
}

export function IconSearch(p: BaseIconProps) {
  return <Icon {...p} path={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>} />;
}

export function IconClock(p: BaseIconProps) {
  return <Icon {...p} path={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>} />;
}

export function IconLinear(p: BaseIconProps) {
  return <Icon {...p} path={<><path d="M3 13a9 9 0 0 1 8 8"/><path d="M3 9a13 13 0 0 1 12 12"/><path d="M3 5a17 17 0 0 1 16 16"/></>} />;
}

export function IconReply(p: BaseIconProps) {
  return <Icon {...p} path={<><path d="M21 12a8 8 0 0 1-11.3 7.3L3 21l1.7-6.7A8 8 0 1 1 21 12z"/></>} />;
}

export function IconAlert(p: BaseIconProps) {
  return <Icon {...p} path={<><path d="M12 3 2 21h20z"/><path d="M12 10v5"/><circle cx="12" cy="18" r=".6" fill="currentColor"/></>} />;
}

export function IconFlame(p: BaseIconProps) {
  return <Icon {...p} path={<><path d="M12 3c2 4 6 5 6 10a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 2 4 -3z"/></>} />;
}

export function IconPause(p: BaseIconProps) {
  return <Icon {...p} path={<><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></>} />;
}

export function IconSparkle(p: BaseIconProps) {
  return <Icon {...p} path={<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></>} />;
}

export function IconHourglass(p: BaseIconProps) {
  return <Icon {...p} path={<><path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9"/></>} />;
}

export function IconCheck(p: BaseIconProps) {
  return <Icon {...p} path={<path d="M4 12.5 9.5 18 20 6"/>} />;
}

export function IconX(p: BaseIconProps) {
  return <Icon {...p} path={<><path d="M6 6l12 12"/><path d="M18 6l-6 6"/></>} />;
}

export function IconFilter(p: BaseIconProps) {
  return <Icon {...p} path={<path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/>} />;
}

export function IconPlus(p: BaseIconProps) {
  return <Icon {...p} path={<><path d="M12 5v14"/><path d="M5 12h14"/></>} />;
}

export function IconRefresh(p: BaseIconProps) {
  return <Icon {...p} path={<><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>} />;
}

export function IconCopy(p: BaseIconProps) {
  return <Icon {...p} path={<><rect x="9" y="9" width="11" height="11" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>} />;
}

export function IconExternalLink(p: BaseIconProps) {
  return <Icon {...p} path={<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></>} />;
}

export function IconDot(p: BaseIconProps) {
  return <Icon {...p} fill="currentColor" stroke="none" path={<circle cx="12" cy="12" r="4"/>} />;
}

/** Circle “i” for column routing / help tooltips */
export function IconInfo(p: BaseIconProps) {
  return (
    <Icon
      {...p}
      path={
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-5" />
          <circle cx="12" cy="7.5" r=".75" fill="currentColor" stroke="none" />
        </>
      }
    />
  );
}

export function IconColumns(p: BaseIconProps) {
  return <Icon {...p} path={<><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="18" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></>} />;
}

export function IconChevronLeft(p: BaseIconProps) {
  return <Icon {...p} path={<path d="M15 18l-6-6 6-6"/>} />;
}

export function IconChevronRight(p: BaseIconProps) {
  return <Icon {...p} path={<path d="M9 18l6-6-6-6"/>} />;
}

export function IconSmile(p: BaseIconProps) {
  return <Icon {...p} path={<><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="10" r=".6" fill="currentColor"/><circle cx="15" cy="10" r=".6" fill="currentColor"/></>} />;
}

export function IconMeh(p: BaseIconProps) {
  return <Icon {...p} path={<><circle cx="12" cy="12" r="9"/><path d="M8 15h8"/><circle cx="9" cy="10" r=".6" fill="currentColor"/><circle cx="15" cy="10" r=".6" fill="currentColor"/></>} />;
}

export function IconFrown(p: BaseIconProps) {
  return <Icon {...p} path={<><circle cx="12" cy="12" r="9"/><path d="M8 16s1.5-2 4-2 4 2 4 2"/><circle cx="9" cy="10" r=".6" fill="currentColor"/><circle cx="15" cy="10" r=".6" fill="currentColor"/></>} />;
}
export function IconSort(p: BaseIconProps) {
  return <Icon {...p} path={<><path d="M3 6h18M7 12h10M11 18h2"/></>} />;
}

export function IconBold(p: BaseIconProps) {
  return <Icon {...p} sw={2} path={<>
    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
    <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
  </>} />;
}

export function IconItalic(p: BaseIconProps) {
  return <Icon {...p} path={<>
    <line x1="19" y1="4" x2="10" y2="4"/>
    <line x1="14" y1="20" x2="5" y2="20"/>
    <line x1="15" y1="4" x2="9" y2="20"/>
  </>} />;
}

export function IconUnderline(p: BaseIconProps) {
  return <Icon {...p} path={<>
    <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
    <line x1="4" y1="21" x2="20" y2="21"/>
  </>} />;
}

export function IconStrikethrough(p: BaseIconProps) {
  return <Icon {...p} path={<>
    <path d="M16 4H9a3 3 0 0 0-2.83 4"/>
    <path d="M14 12a4 4 0 0 1 0 8H6"/>
    <line x1="4" y1="12" x2="20" y2="12"/>
  </>} />;
}

export function IconList(p: BaseIconProps) {
  return <Icon {...p} path={<>
    <line x1="9" y1="6" x2="20" y2="6"/>
    <line x1="9" y1="12" x2="20" y2="12"/>
    <line x1="9" y1="18" x2="20" y2="18"/>
    <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/>
  </>} />;
}

export function IconListOrdered(p: BaseIconProps) {
  return <Icon {...p} path={<>
    <line x1="10" y1="6" x2="21" y2="6"/>
    <line x1="10" y1="12" x2="21" y2="12"/>
    <line x1="10" y1="18" x2="21" y2="18"/>
    <path d="M4 6h1v4M4 10h2"/>
    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
  </>} />;
}

export function IconBlockquote(p: BaseIconProps) {
  return <Icon {...p} sw={1.4} path={<>
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
  </>} />;
}

export function IconCode(p: BaseIconProps) {
  return <Icon {...p} path={<>
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </>} />;
}

export function IconTerminal(p: BaseIconProps) {
  return <Icon {...p} path={<>
    <polyline points="4 17 10 11 4 5"/>
    <line x1="12" y1="19" x2="20" y2="19"/>
  </>} />;
}

export function IconEraser(p: BaseIconProps) {
  return <Icon {...p} path={<>
    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-.9 2.5-.9 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
    <path d="M22 21H7"/>
    <path d="m5 11 9 9"/>
  </>} />;
}

export function IconLink2(p: BaseIconProps) {
  return <Icon {...p} path={<>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </>} />;
}

export function IconHeading(p: BaseIconProps) {
  return <Icon {...p} path={<>
    <path d="M4 12h16"/>
    <path d="M4 18V6"/>
    <path d="M20 18V6"/>
  </>} />;
}

export function IconTable(p: BaseIconProps) {
  return <Icon {...p} path={<>
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
  </>} />;
}

export function IconGear(p: BaseIconProps) {
  return <Icon {...p} path={<>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </>} />;
}
