import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SearchInput({ placeholder = 'Search...', onSearch, delay = 300 }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch?.(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div style={{
      position: 'relative', display: 'flex', alignItems: 'center',
      minWidth: 240, maxWidth: 360,
    }}>
      <Search size={16} style={{
        position: 'absolute', left: '0.875rem',
        color: 'var(--text-muted)', pointerEvents: 'none',
      }} />
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        className="form-input"
        style={{ paddingLeft: '2.5rem' }}
      />
    </div>
  );
}
