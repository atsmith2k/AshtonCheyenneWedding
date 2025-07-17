import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			// shadcn/ui semantic colors
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			// New elegant wedding color palette
  			wedding: {
  				silver: {
  					50: '#f8f7f7',
  					100: '#f1efef',
  					200: '#e3e0e1',
  					300: '#d0cbcc',
  					400: '#b5b1b2', // Main silver
  					500: '#a09b9c',
  					600: '#8a8485',
  					700: '#726d6e',
  					800: '#5f5a5b',
  					900: '#504c4d',
  				},
  				'rose-quartz': {
  					50: '#f7f6f8',
  					100: '#efecf1',
  					200: '#e1dce4',
  					300: '#cdc5d1',
  					400: '#ada9b7', // Main rose quartz
  					500: '#9691a0',
  					600: '#827b89',
  					700: '#6d6571',
  					800: '#5a545e',
  					900: '#4c474f',
  				},
  				periwinkle: {
  					50: '#f4f5f9',
  					100: '#e9ebf3',
  					200: '#d6dae9',
  					300: '#bbc2d9',
  					400: '#a9afd1', // Main periwinkle
  					500: '#9299c4',
  					600: '#7d84b5',
  					700: '#6b71a3',
  					800: '#585e87',
  					900: '#494e6e',
  				},
  				'light-sky-blue': {
  					50: '#f0f8fe',
  					100: '#def0fc',
  					200: '#c4e5fa',
  					300: '#9bd5f6',
  					400: '#a1cdf4', // Main light sky blue
  					500: '#5bb8ef',
  					600: '#46a3e3',
  					700: '#3c8fd0',
  					800: '#3574a9',
  					900: '#316186',
  				},
  				'cool-gray': {
  					50: '#f4f4f6',
  					100: '#e8e9ec',
  					200: '#d5d6db',
  					300: '#b7b9c2',
  					400: '#9397a4',
  					500: '#7c809b', // Main cool gray
  					600: '#6b6f87',
  					700: '#5c5f70',
  					800: '#4e505e',
  					900: '#434450',
  				},
  			},
  			neutral: {
  				'50': '#fafafa',
  				'100': '#f5f5f5',
  				'200': '#e5e5e5',
  				'300': '#d4d4d4',
  				'400': '#a3a3a3',
  				'500': '#737373',
  				'600': '#525252',
  				'700': '#404040',
  				'800': '#262626',
  				'900': '#171717'
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
  			sans: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
  			serif: [
  				'Playfair Display',
  				'Georgia',
  				'serif'
  			],
  			script: [
  				'Dancing Script',
  				'cursive'
  			]
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.5s ease-in-out',
  			'slide-up': 'slideUp 0.3s ease-out',
  			'slide-down': 'slideDown 0.3s ease-out',
  			'scale-in': 'scaleIn 0.2s ease-out'
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
  			slideDown: {
  				'0%': {
  					transform: 'translateY(-10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			scaleIn: {
  				'0%': {
  					transform: 'scale(0.95)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			}
  		},
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  			'128': '32rem'
  		},
  		maxWidth: {
  			'8xl': '88rem',
  			'9xl': '96rem'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
      require("tailwindcss-animate")
],
}

export default config
