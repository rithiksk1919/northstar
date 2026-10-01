/**
 * Shared Tailwind (Play CDN) theme for every Northstar page.
 * Load right after https://cdn.tailwindcss.com. Tokens mirror css/app.css.
 */
window.tailwind = window.tailwind || {};
tailwind.config = {
  darkMode: 'class',
  // The Play CDN injects its CSS after css/app.css, so its preflight reset would
  // override component classes like .ns-btn. app.css carries its own base reset instead.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: { DEFAULT: '#111111', 2: '#3F3F3F' },
        muted: '#737373',
        cream: '#FFFFFF',
        paper: '#FFFFFF',
        sand: { DEFAULT: '#F2F2F2', deep: '#E6E6E6' },
        line: '#E8E8E8',
        amber: {
          DEFAULT: '#FFD43B',
          deep: '#111111',
          wash: '#FFF7D1',
          line: '#F2DC7A',
          ink: '#6B5500'
        },
        leaf: { DEFAULT: '#1E7B45', wash: '#FFFFFF', line: '#B9DEC6' },
        danger: { DEFAULT: '#B42318', wash: '#FEF3F2', line: '#FECDCA' }
      },
      borderRadius: {
        card: '18px',
        tile: '12px',
        field: '12px'
      },
      boxShadow: {
        card: 'none',
        lift: '0 1px 2px rgba(0,0,0,0.06), 0 6px 16px -8px rgba(0,0,0,0.22)',
        amber: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 10px 22px -10px rgba(214,146,20,0.7)'
      }
    }
  }
};
