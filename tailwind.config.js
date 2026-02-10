/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			"brand-solid": 'rgb(var(--color-brand-solid) / <alpha-value>)',
  			quaternary: 'rgb(var(--color-quaternary) / <alpha-value>)',
  			"slider-handle-bg": 'rgb(var(--color-slider-handle-bg) / <alpha-value>)',
  			"slider-handle-border": 'rgb(var(--color-slider-handle-border) / <alpha-value>)',
  			"secondary_alt": 'rgb(var(--color-secondary-alt) / <alpha-value>)',
  			"focus-ring": 'rgb(var(--color-focus-ring) / <alpha-value>)',
  			background: {
  				DEFAULT: 'rgb(var(--color-background) / <alpha-value>)',
  				secondary: 'rgb(var(--color-background-secondary) / <alpha-value>)'
  			},
  			primary: {
  				DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
  				hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
  				foreground: 'rgb(var(--color-primary-foreground) / <alpha-value>)'
  			},
  			text: {
  				primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
  				secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)'
  			},
  			foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
  			card: {
  				DEFAULT: 'rgb(var(--color-card) / <alpha-value>)',
  				foreground: 'rgb(var(--color-card-foreground) / <alpha-value>)'
  			},
  			popover: {
  				DEFAULT: 'rgb(var(--color-popover) / <alpha-value>)',
  				foreground: 'rgb(var(--color-popover-foreground) / <alpha-value>)'
  			},
  			secondary: {
  				DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
  				foreground: 'rgb(var(--color-secondary-foreground) / <alpha-value>)'
  			},
  			muted: {
  				DEFAULT: 'rgb(var(--color-muted) / <alpha-value>)',
  				foreground: 'rgb(var(--color-muted-foreground) / <alpha-value>)'
  			},
  			accent: {
  				DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
  				foreground: 'rgb(var(--color-accent-foreground) / <alpha-value>)'
  			},
  			destructive: {
  				DEFAULT: 'rgb(var(--color-destructive) / <alpha-value>)',
  				foreground: 'rgb(var(--color-destructive-foreground) / <alpha-value>)'
  			},
  			border: 'rgb(var(--color-border) / <alpha-value>)',
  			input: 'rgb(var(--color-input) / <alpha-value>)',
  			ring: 'rgb(var(--color-ring) / <alpha-value>)',
  			chart: {
  				'1': 'rgb(var(--color-chart-1) / <alpha-value>)',
  				'2': 'rgb(var(--color-chart-2) / <alpha-value>)',
  				'3': 'rgb(var(--color-chart-3) / <alpha-value>)',
  				'4': 'rgb(var(--color-chart-4) / <alpha-value>)',
  				'5': 'rgb(var(--color-chart-5) / <alpha-value>)'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'Montserrat',
  				'sans-serif'
  			]
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			xl: '1rem',
  			'2xl': '1.5rem',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		backdropBlur: {
  			xs: '2px'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
