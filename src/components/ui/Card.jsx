import { useTheme } from '../../context/ThemeContext';

export default function Card({ children, padding = '24px', style = {}, className = '', borderTop, border }) {
  const { t } = useTheme();

  const cardStyle = {
    background: t.bgCard,
    borderRadius: 12,
    padding: padding,
    ...(borderTop && { borderTop: `3px solid ${borderTop}` }),
    ...(border && { border: `1px solid ${border}` }),
    ...style,
  };

  return (
    <div style={cardStyle} className={className}>
      {children}
    </div>
  );
}
