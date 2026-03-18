import { useTheme } from '../../context/ThemeContext';

export default function Badge({ children, variant = 'default', style = {} }) {
  const { t } = useTheme();

  const variants = {
    default: {
      background: t.bgInset,
      color: t.textMuted,
      border: `1px solid ${t.border}`,
    },
    success: {
      background: t.successBg,
      color: t.successText,
      border: `1px solid ${t.successBorder}`,
    },
    warning: {
      background: t.infoBg, // Using info for warning-ish colors
      color: t.infoText,
      border: `1px solid ${t.infoBorder}`,
    },
    error: {
      background: t.errorBg,
      color: t.errorText,
      border: `1px solid ${t.errorBorder}`,
    },
    accent: {
      background: t.accent + '20', // 20% opacity hex
      color: t.accent,
      border: `1px solid ${t.accent}40`,
    },
  };

  const currentVariant = variants[variant] || variants.default;

  const badgeStyle = {
    display: 'inline-block',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 700,
    borderRadius: 99,
    ...currentVariant,
    ...style,
  };

  return <span style={badgeStyle}>{children}</span>;
}
