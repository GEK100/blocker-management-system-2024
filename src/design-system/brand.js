// Professional Construction Branding System
export const brandConfig = {
  // Company Identity
  name: 'ConstructFlow',
  tagline: 'Professional Construction Management',
  description: 'Streamline your construction projects with intelligent blocker management and real-time collaboration.',

  // Brand Colors - Professional Construction Industry Palette
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#fef7ec',   // Very light construction orange
      100: '#fdecd3',  // Light construction orange
      200: '#fbd5a5',  // Lighter construction orange
      300: '#f7b76d',  // Medium-light construction orange
      400: '#f29432',  // Medium construction orange
      500: '#ed7611',  // Main construction orange (brand primary)
      600: '#de5c0a',  // Dark construction orange
      700: '#b8450c',  // Darker construction orange
      800: '#923712',  // Very dark construction orange
      900: '#762f12',  // Darkest construction orange
      950: '#401606',  // Nearly black construction orange
    },

    // Secondary Brand Colors - Professional Blue-Gray
    secondary: {
      50: '#f8fafc',   // Very light slate
      100: '#f1f5f9',  // Light slate
      200: '#e2e8f0',  // Lighter slate
      300: '#cbd5e1',  // Medium-light slate
      400: '#94a3b8',  // Medium slate
      500: '#64748b',  // Main slate (brand secondary)
      600: '#475569',  // Dark slate
      700: '#334155',  // Darker slate
      800: '#1e293b',  // Very dark slate
      900: '#0f172a',  // Darkest slate
      950: '#020617',  // Nearly black slate
    },

    // Safety Colors
    safety: {
      50: '#fef2f2',   // Very light red
      100: '#fee2e2',  // Light red
      200: '#fecaca',  // Lighter red
      300: '#fca5a5',  // Medium-light red
      400: '#f87171',  // Medium red
      500: '#ef4444',  // Main safety red
      600: '#dc2626',  // Dark red
      700: '#b91c1c',  // Darker red
      800: '#991b1b',  // Very dark red
      900: '#7f1d1d',  // Darkest red
    },

    // Success Colors
    success: {
      50: '#ecfdf5',   // Very light green
      100: '#d1fae5',  // Light green
      200: '#a7f3d0',  // Lighter green
      300: '#6ee7b7',  // Medium-light green
      400: '#34d399',  // Medium green
      500: '#10b981',  // Main success green
      600: '#059669',  // Dark green
      700: '#047857',  // Darker green
      800: '#065f46',  // Very dark green
      900: '#064e3b',  // Darkest green
    },

    // Warning Colors
    warning: {
      50: '#fffbeb',   // Very light yellow
      100: '#fef3c7',  // Light yellow
      200: '#fde68a',  // Lighter yellow
      300: '#fcd34d',  // Medium-light yellow
      400: '#fbbf24',  // Medium yellow
      500: '#f59e0b',  // Main warning yellow
      600: '#d97706',  // Dark yellow
      700: '#b45309',  // Darker yellow
      800: '#92400e',  // Very dark yellow
      900: '#78350f',  // Darkest yellow
    },

    // Neutral Colors
    neutral: {
      50: '#fafafa',   // Very light gray
      100: '#f4f4f5',  // Light gray
      200: '#e4e4e7',  // Lighter gray
      300: '#d4d4d8',  // Medium-light gray
      400: '#a1a1aa',  // Medium gray
      500: '#71717a',  // Main neutral gray
      600: '#52525b',  // Dark gray
      700: '#3f3f46',  // Darker gray
      800: '#27272a',  // Very dark gray
      900: '#18181b',  // Darkest gray
    }
  },

  // Typography System
  typography: {
    fontFamily: {
      primary: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      secondary: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace']
    },

    // Font Sizes with Line Heights
    scale: {
      xs: { size: '0.75rem', lineHeight: '1rem' },     // 12px
      sm: { size: '0.875rem', lineHeight: '1.25rem' }, // 14px
      base: { size: '1rem', lineHeight: '1.5rem' },    // 16px
      lg: { size: '1.125rem', lineHeight: '1.75rem' }, // 18px
      xl: { size: '1.25rem', lineHeight: '1.75rem' },  // 20px
      '2xl': { size: '1.5rem', lineHeight: '2rem' },   // 24px
      '3xl': { size: '1.875rem', lineHeight: '2.25rem' }, // 30px
      '4xl': { size: '2.25rem', lineHeight: '2.5rem' },   // 36px
      '5xl': { size: '3rem', lineHeight: '1' },           // 48px
      '6xl': { size: '3.75rem', lineHeight: '1' },        // 60px
      '7xl': { size: '4.5rem', lineHeight: '1' },         // 72px
      '8xl': { size: '6rem', lineHeight: '1' },           // 96px
      '9xl': { size: '8rem', lineHeight: '1' },           // 128px
    },

    // Font Weights
    weights: {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900
    }
  },

  // Spacing System (8px grid)
  spacing: {
    0: '0px',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    7: '1.75rem',   // 28px
    8: '2rem',      // 32px
    9: '2.25rem',   // 36px
    10: '2.5rem',   // 40px
    11: '2.75rem',  // 44px
    12: '3rem',     // 48px
    14: '3.5rem',   // 56px
    16: '4rem',     // 64px
    18: '4.5rem',   // 72px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    28: '7rem',     // 112px
    32: '8rem',     // 128px
    36: '9rem',     // 144px
    40: '10rem',    // 160px
    44: '11rem',    // 176px
    48: '12rem',    // 192px
    52: '13rem',    // 208px
    56: '14rem',    // 224px
    60: '15rem',    // 240px
    64: '16rem',    // 256px
    72: '18rem',    // 288px
    80: '20rem',    // 320px
    96: '24rem',    // 384px
  },

  // Border Radius System
  borderRadius: {
    none: '0px',
    sm: '0.125rem',    // 2px
    base: '0.25rem',   // 4px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    '3xl': '1.5rem',   // 24px
    full: '9999px',    // Fully rounded
  },

  // Shadow System
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

    // Brand-specific shadows
    construction: '0 4px 6px -1px rgb(237 118 17 / 0.1), 0 2px 4px -1px rgb(237 118 17 / 0.06)',
    'construction-lg': '0 10px 15px -3px rgb(237 118 17 / 0.1), 0 4px 6px -2px rgb(237 118 17 / 0.05)',
    slate: '0 4px 6px -1px rgb(51 65 85 / 0.1), 0 2px 4px -1px rgb(51 65 85 / 0.06)',
    'slate-lg': '0 10px 15px -3px rgb(51 65 85 / 0.1), 0 4px 6px -2px rgb(51 65 85 / 0.05)',
  },

  // Animation System
  animations: {
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms',
    },

    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',

      // Custom construction industry easings
      'construction': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      'construction-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },

    keyframes: {
      'fade-in': {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      'slide-in-up': {
        '0%': { transform: 'translateY(100%)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      'slide-in-right': {
        '0%': { transform: 'translateX(100%)', opacity: '0' },
        '100%': { transform: 'translateX(0)', opacity: '1' },
      },
      'bounce-gentle': {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-10px)' },
      },
      'pulse-construction': {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.8' },
      },
      'shimmer': {
        '0%': { backgroundPosition: '-200px 0' },
        '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
      },
    }
  },

  // Component Tokens
  components: {
    // Button System
    button: {
      sizes: {
        xs: { padding: '0.375rem 0.75rem', fontSize: '0.75rem', height: '1.75rem' },
        sm: { padding: '0.5rem 1rem', fontSize: '0.875rem', height: '2rem' },
        base: { padding: '0.625rem 1.25rem', fontSize: '0.875rem', height: '2.5rem' },
        lg: { padding: '0.75rem 1.5rem', fontSize: '1rem', height: '3rem' },
        xl: { padding: '1rem 2rem', fontSize: '1.125rem', height: '3.5rem' },
      },

      variants: {
        primary: {
          bg: 'primary.600',
          color: 'white',
          hover: 'primary.700',
          focus: 'primary.500',
        },
        secondary: {
          bg: 'secondary.600',
          color: 'white',
          hover: 'secondary.700',
          focus: 'secondary.500',
        },
        success: {
          bg: 'success.600',
          color: 'white',
          hover: 'success.700',
          focus: 'success.500',
        },
        warning: {
          bg: 'warning.500',
          color: 'white',
          hover: 'warning.600',
          focus: 'warning.500',
        },
        danger: {
          bg: 'safety.600',
          color: 'white',
          hover: 'safety.700',
          focus: 'safety.500',
        },
        outline: {
          bg: 'transparent',
          color: 'secondary.700',
          border: 'secondary.300',
          hover: 'secondary.50',
          focus: 'secondary.500',
        },
        ghost: {
          bg: 'transparent',
          color: 'secondary.600',
          hover: 'secondary.100',
          focus: 'secondary.500',
        }
      }
    },

    // Card System
    card: {
      variants: {
        default: {
          bg: 'white',
          border: 'secondary.200',
          shadow: 'base',
          borderRadius: 'xl',
        },
        elevated: {
          bg: 'white',
          border: 'secondary.200',
          shadow: 'lg',
          borderRadius: 'xl',
        },
        construction: {
          bg: 'white',
          border: 'primary.200',
          shadow: 'construction',
          borderRadius: 'xl',
        },
        flat: {
          bg: 'secondary.50',
          border: 'secondary.200',
          shadow: 'none',
          borderRadius: 'lg',
        }
      }
    },

    // Form Elements
    form: {
      input: {
        base: {
          borderRadius: 'lg',
          border: 'secondary.300',
          fontSize: 'sm',
          padding: '0.75rem',
          focus: {
            border: 'primary.500',
            ring: 'primary.500',
          },
          error: {
            border: 'safety.500',
            ring: 'safety.500',
          }
        },
        sizes: {
          sm: { padding: '0.5rem', fontSize: 'xs', height: '2rem' },
          base: { padding: '0.75rem', fontSize: 'sm', height: '2.5rem' },
          lg: { padding: '1rem', fontSize: 'base', height: '3rem' },
          xl: { padding: '1.25rem', fontSize: 'lg', height: '3.5rem' },
        }
      }
    },

    // Status Badges
    badge: {
      variants: {
        pending: {
          bg: 'warning.100',
          color: 'warning.800',
          border: 'warning.200',
        },
        assigned: {
          bg: 'blue-100',
          color: 'blue-800',
          border: 'blue-200',
        },
        completed: {
          bg: 'success.100',
          color: 'success.800',
          border: 'success.200',
        },
        verified: {
          bg: 'emerald-100',
          color: 'emerald-800',
          border: 'emerald-200',
        },
        rejected: {
          bg: 'safety.100',
          color: 'safety.800',
          border: 'safety.200',
        },
        priority_high: {
          bg: 'safety.100',
          color: 'safety.800',
          border: 'safety.200',
        },
        priority_medium: {
          bg: 'warning.100',
          color: 'warning.800',
          border: 'warning.200',
        },
        priority_low: {
          bg: 'success.100',
          color: 'success.800',
          border: 'success.200',
        }
      }
    }
  },

  // Layout System
  layout: {
    // Container Sizes
    containers: {
      xs: '475px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },

    // Grid System
    grid: {
      columns: 12,
      gap: {
        xs: '0.5rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem',
      }
    },

    // Z-Index Scale
    zIndex: {
      hide: -1,
      auto: 'auto',
      base: 0,
      docked: 10,
      dropdown: 1000,
      sticky: 1100,
      banner: 1200,
      overlay: 1300,
      modal: 1400,
      popover: 1500,
      skipLink: 1600,
      toast: 1700,
      tooltip: 1800,
    }
  },

  // Breakpoints
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Brand Assets
  assets: {
    logos: {
      primary: '/assets/logo-primary.svg',
      secondary: '/assets/logo-secondary.svg',
      mark: '/assets/logo-mark.svg',
      wordmark: '/assets/logo-wordmark.svg',
    },

    icons: {
      favicon: '/assets/favicon.ico',
      apple: '/assets/apple-touch-icon.png',
      manifest: '/assets/site.webmanifest',
    },

    illustrations: {
      hero: '/assets/hero-construction.svg',
      empty: '/assets/empty-state.svg',
      error: '/assets/error-state.svg',
      success: '/assets/success-state.svg',
    }
  }
};

// Helper functions for accessing brand tokens
export const getBrandColor = (path) => {
  const keys = path.split('.');
  let value = brandConfig.colors;

  for (const key of keys) {
    value = value[key];
    if (!value) break;
  }

  return value || path;
};

export const getBrandSpacing = (size) => {
  return brandConfig.spacing[size] || size;
};

export const getBrandFontSize = (size) => {
  return brandConfig.typography.scale[size] || size;
};

export const getBrandShadow = (size) => {
  return brandConfig.shadows[size] || size;
};

export default brandConfig;