import { useTheme } from '../../context/ThemeContext';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  style = {},
  className = '',
  ...props
}) {
  const { t } = useTheme();

  const variants = {
    primary: {
      background: t.accent,
      color: '#fff', // White text on primary button
      border: 'none',
      hoverBackground: t.accentHover || '#2563eb', // Darker blue from theme or fallback
    },
    secondary: {
      background: 'transparent',
      color: t.textMuted,
      border: `1px solid ${t.border}`,
      hoverBackground: t.bgCard,
      hoverColor: t.textPrimary,
    },
    ghost: {
      background: 'transparent',
      color: t.textGhost,
      border: 'none',
      hoverBackground: t.bgInset,
    },
    danger: {
      background: t.errorBg,
      color: t.errorText,
      border: `1px solid ${t.errorBorder}`,
      hoverBackground: t.errorBorder,
    },
  };

  const sizes = {
    sm: { padding: '6px 12px', fontSize: '12px' },
    md: { padding: '10px 20px', fontSize: '14px' },
    lg: { padding: '14px 28px', fontSize: '16px' },
  };

  const currentVariant = variants[variant] || variants.primary;
  const currentSize = sizes[size] || sizes.md;

  const buttonStyle = {
    background: loading ? t.textDisabled : currentVariant.background,
    color: currentVariant.color,
    border: currentVariant.border,
    borderRadius: 8,
    padding: currentSize.padding,
    fontSize: currentSize.fontSize,
    fontWeight: 600,
    cursor: loading || disabled ? 'not-allowed' : 'pointer',
    opacity: loading || disabled ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    ...style,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={buttonStyle}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}
