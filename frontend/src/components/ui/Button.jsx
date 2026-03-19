import './Button.css';

export default function Button({
  children, variant = 'primary', size = 'md', icon: Icon, iconRight,
  loading, disabled, fullWidth, type = 'button', className = '', ...props
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : 16} />
      ) : null}
      {children && <span>{children}</span>}
      {iconRight && !loading && iconRight}
    </button>
  );
}
