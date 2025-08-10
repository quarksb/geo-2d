import { style, globalStyle, createTheme } from '@vanilla-extract/css';

// 主题变量
export const [themeClass, vars] = createTheme({
  layout: {
    maxWidth: '1000px',
    sideWidth: '300px',
  },
  colors: {
    primary: '#646cff',
    text: '#393535',
    background: '#fff',
    surface: '#eee',
    surfaceDark: '#3a3a3a',
    border: '#00000033',
    shadow: '#050505',
    hover: '#cececeaa',
  },
  spacing: {
    xs: '5px',
    sm: '10px',
    md: '20px',
    lg: '30px',
    xl: '50px',
  },
  radius: {
    sm: '5px',
    round: '50%',
  },
});

// 基础样式
const flexCenter = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
} as const;

const button = {
  border: 'none',
  backgroundColor: vars.colors.surface,
  cursor: 'pointer',
} as const;

// 组件样式
export const layout = style({
  ...flexCenter,
});

export const root = style({
  width: '100%',
  maxWidth: vars.layout.maxWidth,
  height: '100vh',
  color: vars.colors.text,
  fontFamily: 'Inter, system-ui, sans-serif',
  display: 'flex',
  flexDirection: 'column',
  paddingTop: vars.spacing.sm,
});

export const nav = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: `0 1em`,
  backgroundColor: vars.colors.background,
  boxShadow: `0 0 1em ${vars.colors.border}`,
  position: 'sticky',
  top: 0,
  zIndex: 1,
});

export const logoContainer = style({
  display: 'flex',
  alignItems: 'center',
});

export const logoImg = style({
  width: '40px',
  height: '40px',
  marginRight: vars.spacing.sm,
});

export const logoText = style({
  margin: 0,
});

export const link = style({
  color: vars.colors.primary,
  textDecoration: 'none',
  ':hover': {
    textDecoration: 'underline',
  },
});

export const shareButton = style({
  ...flexCenter,
  padding: `0 ${vars.spacing.xs}`,
  borderRadius: vars.radius.sm,
  color: '#1b1717',
  textDecoration: 'none',
  ':hover': {
    boxShadow: `0 0 ${vars.spacing.sm} ${vars.colors.border}`,
  },
});

export const shareIcon = style({
  width: '35px',
  height: '35px',
});

export const content = style({
  paddingTop: vars.spacing.xl,
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
});

export const mainArea = style({
  width: `calc(${vars.layout.maxWidth} - ${vars.layout.sideWidth} - 16px)`,
  maxWidth: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
});

export const svg = style({
  width: '500px',
  height: '500px',
  border: `3px dashed ${vars.colors.border}`,
  '@media': {
    'screen and (max-width: 500px)': {
      width: '300px',
      height: '300px',
    },
  },
});

export const actionButtons = style({
  width: '60%',
  display: 'flex',
  justifyContent: 'space-evenly',
  alignItems: 'center',
});

export const circleButton = style({
  position: 'relative',
  marginTop: vars.spacing.lg,
  width: '80px',
  height: '80px',
  borderRadius: vars.radius.round,
  ...flexCenter,
  ...button,
  transition: 'all 0.5s',
  ':hover': {
    backgroundColor: vars.colors.surfaceDark,
    boxShadow: `0 0 ${vars.spacing.sm} ${vars.colors.shadow}`,
  },
  ':active': {
    top: '1px',
  },
  '::after': {
    content: '""',
    position: 'absolute',
    borderRadius: '4em',
    inset: 0,
    opacity: 0,
    transition: 'all 0.5s',
    boxShadow: `0 0 ${vars.spacing.sm} 40px ${vars.colors.shadow}`,
    zIndex: -1,
  },
});

export const buttonIcon = style({
  width: '50px',
  height: '50px',
  backgroundColor: vars.colors.surface,
});

export const sidebar = style({
  width: vars.layout.sideWidth,
  display: 'flex',
  flexDirection: 'column',
});

export const control = style({
  padding: `2px 12px`,
  height: '40px',
  marginBottom: vars.spacing.sm,
  display: 'flex',
  alignItems: 'center',
  borderRadius: vars.radius.sm,
  ':hover': {
    backgroundColor: vars.colors.hover,
  },
});

export const checkbox = style({
  width: vars.spacing.md,
  height: vars.spacing.md,
  marginRight: vars.spacing.sm,
});

export const label = style({
  width: '30%',
  fontSize: vars.spacing.md,
  marginRight: vars.spacing.sm,
});

export const colorInput = style({
  width: '35px',
  height: '35px',
  ...button,
});

export const rangeInput = style({
  width: '60%',
});

export const controlButton = style({
  width: '100%',
  height: '40px',
  ...flexCenter,
  ...button,
});

export const controlIcon = style({
  width: vars.spacing.md,
  height: vars.spacing.md,
  marginRight: vars.spacing.sm,
});

// 全局样式
globalStyle(`${circleButton}:hover img`, {
  filter: 'invert(86%)',
  transition: 'filter 0.5s',
});

globalStyle(`${circleButton}:active::after`, {
  boxShadow: '0 0 0 0 transparent',
  opacity: 1,
  transition: '0s',
});
