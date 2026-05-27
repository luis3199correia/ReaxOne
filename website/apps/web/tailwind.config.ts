import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary:  '#E8322A', // vermelho vibrante (t-shirt exterior)
          dark:     '#0F0F0F', // preto profundo (brand image background)
          green:    '#88C900', // verde lima (reaction balls)
          gray:     '#1A1A1A', // cinza escuro (navbar/footer)
          light:    '#F5F4F0', // off-white (backgrounds de secção)
          muted:    '#6B6B6B', // texto secundário
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-pattern': "linear-gradient(to bottom, rgba(15,15,15,0.85) 0%, rgba(15,15,15,0.5) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
