import React from "react";

export type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
};

function Svg({ size = 20, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconSparkles(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2l1.2 4.2L17.4 8l-4.2 1.2L12 13.4l-1.2-4.2L6.6 8l4.2-1.8L12 2Z" />
      <path d="M19 13l.7 2.4L22 16l-2.3.6L19 19l-.7-2.4L16 16l2.3-.6L19 13Z" />
      <path d="M4.5 12.5l.7 2.4L7.5 15l-2.3.6L4.5 18l-.7-2.4L1.5 15l2.3-.6.7-1.9Z" />
    </Svg>
  );
}

export function IconBook(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 4h9a3 3 0 0 1 3 3v13H8a2 2 0 0 0-2 2V4Z" />
      <path d="M6 18h10" />
      <path d="M8 8h6" />
      <path d="M8 11h6" />
    </Svg>
  );
}

export function IconTarget(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3" />
      <path d="M22 12h-3" />
      <path d="M12 22v-3" />
      <path d="M2 12h3" />
    </Svg>
  );
}

export function IconCart(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6h15l-1.5 8.5H8L6 6Z" />
      <path d="M6 6 5 3H2" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="18" cy="19" r="1.5" />
    </Svg>
  );
}

export function IconClipboardCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 5h6a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path d="M9 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="m9.5 13 1.8 1.8 3.7-3.7" />
    </Svg>
  );
}

export function IconChart(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15v-5" />
      <path d="M12 19v-9" />
      <path d="M16 13v-4" />
    </Svg>
  );
}

// --- Educational / exam UI icons ---

export function IconStopwatch(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="13" r="8" />
      <path d="M9 2h6" />
      <path d="M12 13l3-2" />
      <path d="M16 5l1 1" />
    </Svg>
  );
}

export function IconBookStack(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 7h12a2 2 0 0 1 2 2v2H8a2 2 0 0 0-2 2V7Z" />
      <path d="M6 13h12a2 2 0 0 1 2 2v2H8a2 2 0 0 0-2 2v-6Z" />
      <path d="M8 9h6" />
      <path d="M8 15h6" />
    </Svg>
  );
}

export function IconNotebook(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 4h10a2 2 0 0 1 2 2v14H10a2 2 0 0 0-2 2V4Z" />
      <path d="M8 6H6a2 2 0 0 0-2 2v14h6" />
      <path d="M12 8h6" />
      <path d="M12 12h6" />
      <path d="M12 16h6" />
    </Svg>
  );
}

export function IconPencil(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
    </Svg>
  );
}

export function IconShieldLock(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4Z" />
      <rect x="9" y="11" width="6" height="6" rx="1.2" />
      <path d="M10.5 11V9.8a1.5 1.5 0 0 1 3 0V11" />
    </Svg>
  );
}

export function IconChartBars(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 19h16" />
      <path d="M7 19V10" />
      <path d="M12 19V6" />
      <path d="M17 19V13" />
    </Svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4Z" />
      <path d="m9 12 2 2 4-4" />
    </Svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 21a8 8 0 1 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </Svg>
  );
}

export function IconAdmin(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2 5 6v6c0 5 3 9 7 10 4-1 7-5 7-10V6l-7-4Z" />
      <path d="M12 10v4" />
      <path d="M10 12h4" />
    </Svg>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </Svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </Svg>
  );
}

export function IconArrowLeft(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 6 8 12l6 6" />
    </Svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Svg>
  );
}

export function IconMinus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
    </Svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 16h10l1-16" />
      <path d="M10 11v7" />
      <path d="M14 11v7" />
    </Svg>
  );
}

export function IconSun(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M4.93 19.07l1.41-1.41" />
      <path d="M17.66 6.34l1.41-1.41" />
    </Svg>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z" />
    </Svg>
  );
}

export function IconInstagram(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </Svg>
  );
}

export function IconRocket(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2c4.5 2 7 6 7 10l-3 3-3-3-3 3-3-3 3-3c4-1 8-3.5 10-7-2.5 7-7 9-11 10l-3 3c-4-1-6-3.5-7-7l3-3c.5-4 3-8.5 10-11Z" />
      <path d="M7 17l-1 4 4-1" />
    </Svg>
  );
}
