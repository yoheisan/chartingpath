import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: '1rem',
				sm: '1.5rem',
				lg: '2rem',
				xl: '2rem',
				'2xl': '2rem'
			},
			screens: {
				'2xl': '1920px'
			}
		},
		fontSize: {
			// Enforce minimum 14px across the entire site
			'xs': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px — raised from 12px
			'sm': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
			'base': ['1rem', { lineHeight: '1.5rem' }],      // 16px
			'lg': ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
			'xl': ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
			'2xl': ['1.5rem', { lineHeight: '2rem' }],       // 24px
			'3xl': ['1.875rem', { lineHeight: '2.25rem' }],  // 30px
			'4xl': ['2.25rem', { lineHeight: '2.5rem' }],    // 36px
			'5xl': ['3rem', { lineHeight: '1' }],            // 48px
			'6xl': ['3.75rem', { lineHeight: '1' }],         // 60px
			'7xl': ['4.5rem', { lineHeight: '1' }],          // 72px
			'8xl': ['6rem', { lineHeight: '1' }],            // 96px
			'9xl': ['8rem', { lineHeight: '1' }],            // 128px
		},
		extend: {
			gridTemplateColumns: {
				'24': 'repeat(24, minmax(0, 1fr))',
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// Trading specific colors
				bullish: {
					DEFAULT: 'hsl(var(--bullish))',
					foreground: 'hsl(var(--bullish-foreground))'
				},
				bearish: {
					DEFAULT: 'hsl(var(--bearish))',
					foreground: 'hsl(var(--bearish-foreground))'
				},
				// Pattern quality grade colors (A-F)
				grade: {
					a: 'hsl(var(--grade-a) / <alpha-value>)',
					b: 'hsl(var(--grade-b) / <alpha-value>)',
					c: 'hsl(var(--grade-c) / <alpha-value>)',
					d: 'hsl(var(--grade-d) / <alpha-value>)',
					f: 'hsl(var(--grade-f) / <alpha-value>)',
				},
				chart: {
					grid: 'hsl(var(--chart-grid))',
					background: 'hsl(var(--chart-background))',
					volume: 'hsl(var(--volume-bar))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			boxShadow: {
				'glow': '0 0 40px hsl(var(--primary) / 0.4)',
				'pattern': '0 10px 40px -10px hsl(var(--primary) / 0.3)',
				'trading': '0 25px 50px -12px hsl(223 39% 3% / 0.8)'
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 6s ease-in-out infinite',
				'fade-in': 'fadeIn 0.8s ease-out forwards',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				fadeIn: {
					'0%': { opacity: '0.01', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				float: {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' },
				}
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
