import { useTheme } from '../../context/ThemeContext';

export default function Progress({ value, max = 100, color, style = {} }) {
  const { t } = useTheme();

  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  // Determine color based on props or theme
  let barColor = color || t.accent;
  if (!color && percentage >= 80) {
    barColor = t.successText; // Use theme success color for high progress
  }

  const containerStyle = {
    height: 10,
    background: t.bgInset,
    borderRadius: 99,
    overflow: 'hidden',
    width: '100%',
    ...style,
  };

  const barStyle = {
    height: '100%',
    width: `${percentage}%`,
    background: barColor,
    borderRadius: 99,
    transition: 'width 0.4s ease',
  };

  return (
    <div style={containerStyle}>
      <div style={barStyle} />
    </div>
  );
}
