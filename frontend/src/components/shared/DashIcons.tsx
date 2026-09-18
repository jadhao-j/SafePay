/**
 * DashIcons — shared SVG <symbol> sprite for the dashboard v3 icon system.
 * Render this ONCE near the top of UserShell (it's display:none, zero layout cost).
 * Then anywhere in the app use: <svg><use href="#icon-send" /></svg>
 *
 * All icons share: stroke-width 1.75, stroke-linecap round, stroke-linejoin round.
 */
export function DashIcons(): JSX.Element {
  return (
    <svg style={{ display: "none" }} aria-hidden="true">
      <defs>
        {/* ── Money / transfer ── */}
        <symbol id="icon-send" viewBox="0 0 24 24">
          <path d="M20.5 3.5L3.5 10.2c-.7.28-.67 1.28.05 1.5l6.2 1.9c.3.1.55.34.65.64l1.9 6.2c.22.72 1.22.75 1.5.05l6.7-17c.24-.62-.38-1.24-1-1z" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10.6 13.4L15 9" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>

        <symbol id="icon-scan" viewBox="0 0 24 24">
          <path d="M3.5 8V6a2.5 2.5 0 0 1 2.5-2.5h2" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 3.5h2A2.5 2.5 0 0 1 20.5 6v2" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20.5 16v2a2.5 2.5 0 0 1-2.5 2.5h-2" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 20.5H6A2.5 2.5 0 0 1 3.5 18v-2" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="8.75" y="8.75" width="6.5" height="6.5" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
        </symbol>

        <symbol id="icon-add-money" viewBox="0 0 24 24">
          <rect x="2.5" y="6" width="19" height="13" rx="3" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
          <path d="M2.5 10.5h19" fill="none" stroke="currentColor" strokeWidth="1.75"/>
          <path d="M16.5 14.5h1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        </symbol>

        <symbol id="icon-contacts" viewBox="0 0 24 24">
          <circle cx="9" cy="8" r="3.3" fill="none" stroke="currentColor" strokeWidth="1.75"/>
          <path d="M3.5 20c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
          <path d="M15.5 5.2a3.3 3.3 0 0 1 0 6.1" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
          <path d="M16.2 14.3c2.2.5 3.8 2.6 3.8 5.2" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        </symbol>

        <symbol id="icon-bills" viewBox="0 0 24 24">
          <path d="M6 2.5h9l4.5 4.5V20a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V4A1.5 1.5 0 0 1 6 2.5z" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
          <path d="M15 2.5V7h4.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
          <path d="M8 12.5h8M8 16h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        </symbol>

        <symbol id="icon-recharge" viewBox="0 0 24 24">
          <rect x="7" y="2" width="10" height="20" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.75"/>
          <path d="M12.8 7.5l-2.6 4.6h2.2l-1.4 4.4 3.8-5.4h-2.4l1.4-3.6z" fill="currentColor" stroke="currentColor" strokeWidth="0.6" strokeLinejoin="round"/>
        </symbol>

        <symbol id="icon-gift" viewBox="0 0 24 24">
          <rect x="3" y="9" width="18" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
          <path d="M4.5 13h15v6.5A1.5 1.5 0 0 1 18 21H6a1.5 1.5 0 0 1-1.5-1.5z" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
          <path d="M12 9v12" stroke="currentColor" strokeWidth="1.75"/>
          <path d="M12 9c0-2.4-1.6-4-3.4-4C7 5 6 6 6 7.2 6 8.7 7.4 9 9 9h3z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          <path d="M12 9c0-2.4 1.6-4 3.4-4C17 5 18 6 18 7.2 18 8.7 16.6 9 15 9h-3z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
        </symbol>

        {/* ── Security / trust ── */}
        <symbol id="icon-shield" viewBox="0 0 24 24">
          <path d="M12 2.5l7.5 3.1v5.6c0 5-3.3 8.7-7.5 10.3-4.2-1.6-7.5-5.3-7.5-10.3V5.6L12 2.5z" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
        </symbol>

        <symbol id="icon-shield-check" viewBox="0 0 24 24">
          <path d="M12 2.5l7.5 3.1v5.6c0 5-3.3 8.7-7.5 10.3-4.2-1.6-7.5-5.3-7.5-10.3V5.6L12 2.5z" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
          <path d="M8.6 12.2l2.3 2.3 4.3-4.6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>

        {/* ── Records / accounts ── */}
        <symbol id="icon-transactions" viewBox="0 0 24 24">
          <path d="M3.5 8h12.6M13.4 4.8L16.5 8l-3.1 3.2" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20.5 16H7.9M10.6 12.8L7.5 16l3.1 3.2" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>

        <symbol id="icon-card" viewBox="0 0 24 24">
          <rect x="2.5" y="5" width="19" height="14" rx="2.6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
          <path d="M2.5 9.5h19" stroke="currentColor" strokeWidth="1.75"/>
          <path d="M6 14.5h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        </symbol>

        <symbol id="icon-bank" viewBox="0 0 24 24">
          <path d="M12 2.5l9 5H3z" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
          <path d="M4 10v8.5M9 10v8.5M15 10v8.5M20 10v8.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
          <path d="M2.5 21.5h19" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        </symbol>

        <symbol id="icon-bar-chart" viewBox="0 0 24 24">
          <path d="M4 20.5V12M12 20.5V4M20 20.5v-7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>

        <symbol id="icon-settings" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.75"/>
          <path d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6M17.7 17.7l-1.6-1.6M7.9 7.9L6.3 6.3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        </symbol>

        <symbol id="icon-grid" viewBox="0 0 24 24">
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.75"/>
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.75"/>
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.75"/>
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.75"/>
        </symbol>

        {/* ── Utility / chrome ── */}
        <symbol id="icon-search" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.75"/>
          <path d="M20.5 20.5l-4.3-4.3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        </symbol>

        <symbol id="icon-bell" viewBox="0 0 24 24">
          <path d="M12 3a5 5 0 0 0-5 5v3.1c0 .9-.35 1.75-1 2.4L5 15h14l-1-1.5c-.65-.65-1-1.5-1-2.4V8a5 5 0 0 0-5-5z" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
          <path d="M9.6 18a2.4 2.4 0 0 0 4.8 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        </symbol>

        <symbol id="icon-moon" viewBox="0 0 24 24">
          <path d="M20 14.2A8.3 8.3 0 0 1 9.8 4 8.3 8.3 0 1 0 20 14.2z" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
        </symbol>

        <symbol id="icon-chevron-down" viewBox="0 0 24 24">
          <path d="M5.5 8.5L12 15l6.5-6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>

        <symbol id="icon-eye" viewBox="0 0 24 24">
          <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7z" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.75"/>
        </symbol>

        <symbol id="icon-eye-off" viewBox="0 0 24 24">
          <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
          <path d="M10.6 5.2c.45-.07.92-.1 1.4-.1 6.2 0 10 7 10 7a17.6 17.6 0 0 1-3.4 4.2M7.4 6.9C4.8 8.4 3 10.9 2 12c0 0 3.8 7 10 7 1.4 0 2.7-.3 3.9-.8" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9.9 10.1a2.8 2.8 0 0 0 4 4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        </symbol>

        <symbol id="icon-check" viewBox="0 0 24 24">
          <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>

        <symbol id="icon-plus" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
        </symbol>

        <symbol id="icon-clock" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.75"/>
          <path d="M12 7v5l3.3 2" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>

        <symbol id="icon-trend-up" viewBox="0 0 24 24">
          <path d="M3.5 17l6-6 4 4 7-7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14.5 7h6v6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>

        <symbol id="icon-pulse" viewBox="0 0 24 24">
          <path d="M3 12h4l2-7 4 14 2-7h4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>

        <symbol id="icon-cpu" viewBox="0 0 24 24">
          <rect x="7" y="7" width="10" height="10" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.75"/>
          <rect x="10" y="10" width="4" height="4" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.75"/>
          <path d="M9.5 3v2.3M14.5 3v2.3M9.5 18.7V21M14.5 18.7V21M3 9.5h2.3M3 14.5h2.3M18.7 9.5H21M18.7 14.5H21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        </symbol>

        <symbol id="icon-device" viewBox="0 0 24 24">
          <rect x="6" y="2.5" width="12" height="19" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.75"/>
          <path d="M11.3 18h1.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/>
        </symbol>

        <symbol id="icon-bag" viewBox="0 0 24 24">
          <path d="M6.5 8.5h11l1 12H5.5z" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
          <path d="M9 8.5V6.8a3 3 0 0 1 6 0v1.7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        </symbol>

        <symbol id="icon-utensils" viewBox="0 0 24 24">
          <path d="M7 2.5v8.4M4.7 2.5v5.6a2.3 2.3 0 0 0 4.6 0V2.5M7 10.9V21.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M17 2.5c-1.8 0-3 2-3 5s1 5 3 5v9" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </symbol>
      </defs>
    </svg>
  );
}
