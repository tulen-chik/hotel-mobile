import { MD3LightTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  fontFamily: 'System',
};

// Extend the MD3Colors type
declare global {
  namespace ReactNativePaper {
    interface ThemeColors {
      border: string;
      success: string;
      error: string;
      warning: string;
      info: string;
    }
  }
}

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#000000',
    secondary: '#666666',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    error: '#FF0000',
    text: '#000000',
    disabled: '#999999',
    placeholder: '#999999',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    // Custom colors
    border: '#E0E0E0',
    success: '#00C853',
    warning: '#FFD600',
    info: '#2196F3',
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 8,
  animation: {
    scale: 1.0,
  },
}; 