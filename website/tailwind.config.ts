import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#050506',
        surface: '#0B0B0E',
        raised: '#121216',
        ink: '#F5F5F7',
        muted: '#A1A1AA',
        faint: '#71717A',
        brand: {
          DEFAULT: '#FF7A1A',
          hover: '#FF9147',
          deep: '#E2620F',
          soft: 'rgba(255,122,26,0.12)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Arial', 'Helvetica', 'sans-serif'],
        display: ['var(--font-outfit)', 'var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        glass:
          '0 18px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
        brand: '0 0 60px rgba(255,122,26,0.28)',
      },
      backgroundImage: {
        'brand-fade':
          'linear-gradient(135deg, rgba(255,122,26,0.22), rgba(255,122,26,0))',
      },
    },
  },
  plugins: [],
};

export default config;
