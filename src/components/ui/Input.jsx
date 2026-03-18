import { useTheme } from '../../context/ThemeContext';

export default function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  style = {},
  onFocus,
  onBlur,
  ...props
}) {
  const { t } = useTheme();

  const inputStyle = {
    background: t.bgInput,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding: '11px 14px',
    fontSize: 14,
    color: t.textPrimary,
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    ...style,
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = t.accent;
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = t.border;
    if (onBlur) onBlur(e);
  };

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={inputStyle}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  );
}
