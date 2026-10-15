import React from 'react';

interface StarRatingProps {
  label: string;
  rating: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  label,
  rating,
  onChange,
  readOnly = false,
}) => {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange && onChange(star)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: star <= rating ? '#fbbf24' : '#cbd5e1',
              cursor: readOnly ? 'default' : 'pointer',
              padding: '0.1rem',
            }}
          >
            ★
          </button>
        ))}
        <span style={{ marginLeft: '0.5rem', alignSelf: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>
          {rating > 0 ? `${rating} / 5` : 'Not rated'}
        </span>
      </div>
    </div>
  );
};
