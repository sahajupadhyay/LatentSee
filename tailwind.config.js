/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				'50': '#f0f1f7',
  				'100': '#e2e4f0',
  				'200': '#c8cde2',
  				'300': '#a8b0d0',
  				'400': '#8691bc',
  				'500': '#6b77a8',
  				'600': '#5a6394',
  				'700': '#4d5378',
  				'800': '#434862',
  				'900': '#1B1F3B',
  				'950': '#0f1120',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			accent: {
  				'50': '#f0fffe',
  				'100': '#ccfff9',
  				'200': '#99fff4',
  				'300': '#5dfde9',
  				'400': '#1df1d7',
  				'500': '#00C6AE',
  				'600': '#00b39b',
  				'700': '#008e7e',
  				'800': '#037065',
  				'900': '#075d53',
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			secondary: {
  				'50': '#f4f3ff',
  				'100': '#ebe9fe',
  				'200': '#d9d6fe',
  				'300': '#bfb8fd',
  				'400': '#9d91fa',
  				'500': '#6C63FF',
  				'600': '#5b4bf5',
  				'700': '#4c3ae1',
  				'800': '#4031bd',
  				'900': '#362b9a',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			neutral: {
  				'50': '#fafaf8',
  				'100': '#f4f3ef',
  				'200': '#E0DCC8',
  				'300': '#d4ceb5',
  				'400': '#c8c0a2',
  				'500': '#bcb18f',
  				'600': '#a69b7c',
  				'700': '#8a8068',
  				'800': '#726956',
  				'900': '#5e5649',
  				DEFAULT: '#E0DCC8'
  			},
  			alert: {
  				'50': '#fef2f2',
  				'100': '#fee2e2',
  				'200': '#fecaca',
  				'300': '#fca5a5',
  				'400': '#f87171',
  				'500': '#FF6B6B',
  				'600': '#dc2626',
  				'700': '#b91c1c',
  				'800': '#991b1b',
  				'900': '#7f1d1d',
  				DEFAULT: '#FF6B6B'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			heading: [
  				'var(--font-bungee)',
  				'Bungee',
  				'cursive'
  			],
  			body: [
  				'var(--font-albert-sans)',
  				'Albert Sans',
  				'system-ui',
  				'sans-serif'
  			],
  			sans: [
  				'var(--font-albert-sans)',
  				'Albert Sans',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			display: [
  				'3.5rem',
  				{
  					lineHeight: '1.1',
  					letterSpacing: '-0.02em'
  				}
  			],
  			h1: [
  				'2.5rem',
  				{
  					lineHeight: '1.2',
  					letterSpacing: '-0.01em'
  				}
  			],
  			h2: [
  				'2rem',
  				{
  					lineHeight: '1.25',
  					letterSpacing: '-0.01em'
  				}
  			],
  			h3: [
  				'1.5rem',
  				{
  					lineHeight: '1.3'
  				}
  			],
  			'body-lg': [
  				'1.125rem',
  				{
  					lineHeight: '1.6'
  				}
  			],
  			body: [
  				'1rem',
  				{
  					lineHeight: '1.6'
  				}
  			],
  			'body-sm': [
  				'0.875rem',
  				{
  					lineHeight: '1.5'
  				}
  			]
  		},
  		borderRadius: {
  			'2xl': '1rem',
  			'3xl': '1.5rem',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			glow: '0 0 20px rgba(0, 198, 174, 0.3)',
  			'glow-purple': '0 0 20px rgba(108, 99, 255, 0.3)',
  			card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  			'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.5s ease-in-out',
  			'slide-up': 'slideUp 0.3s ease-out',
  			'pulse-glow': 'pulseGlow 2s infinite'
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			slideUp: {
  				'0%': {
  					transform: 'translateY(10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			pulseGlow: {
  				'0%, 100%': {
  					boxShadow: '0 0 20px rgba(0, 198, 174, 0.3)'
  				},
  				'50%': {
  					boxShadow: '0 0 30px rgba(0, 198, 174, 0.6)'
  				}
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}