import { DecoratorHelpers } from '@storybook/addon-themes';
import type { ReactRenderer } from '@storybook/react';
import { ThemeProvider, type ThemeProviderProps, useTheme } from 'next-themes';
import { type PropsWithChildren, useEffect } from 'react';
import type { DecoratorFunction } from 'storybook/internal/types';

type ThemeSwitcherProps = PropsWithChildren<{
  theme: string;
}>;

const ThemeSwitcher = ({ theme, children }: ThemeSwitcherProps) => {
  const { setTheme } = useTheme();
  useEffect(() => setTheme(theme), [theme]);
  /**
   * If you're using tailwind and want your background to be displayed in the preview,
   * use <div className="bg-background">{children}</div> instead
   */
  return children;
};

type NextThemesDecorator = Omit<ThemeProviderProps, 'defaultTheme' | 'themes'> & {
  themes: Record<string, string>;
  defaultTheme: string;
};

const { initializeThemeState, pluckThemeFromContext } = DecoratorHelpers;

export const withNextThemes = ({
  themes,
  defaultTheme,
  ...props
}: NextThemesDecorator): DecoratorFunction<ReactRenderer> => {
  initializeThemeState(Object.keys(themes), defaultTheme);

  return (Story, context) => {
    const selectedTheme = pluckThemeFromContext(context);
    const { themeOverride } = context.parameters.themes ?? {};
    const selected = themeOverride ?? selectedTheme ?? defaultTheme;

    return (
      <ThemeProvider defaultTheme={defaultTheme} {...props}>
        <ThemeSwitcher theme={selected}>
          <Story />
        </ThemeSwitcher>
      </ThemeProvider>
    );
  };
};
