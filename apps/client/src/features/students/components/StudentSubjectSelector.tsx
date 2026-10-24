import React, { useState, useEffect } from 'react';
import {
  SubjectCategory,
  LearningGoal,
  type StudentSubjectItemDto,
} from '@tutorpair/shared';
import { useSubjectsCatalog } from '../hooks/useStudents';
import { Button } from '../../../components/ui';
import { BookOpen, CheckCircle2, X } from 'lucide-react';

function formatLearningGoal(goal: string): string {
  if (!goal) return '';
  const specialAcronyms: Record<string, string> = {
    TGAT: 'TGAT',
    TPAT: 'TPAT',
    A_LEVEL: 'A-Level',
    SAT: 'SAT',
    IELTS: 'IELTS',
  };
  if (specialAcronyms[goal]) {
    return specialAcronyms[goal];
  }
  return goal
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface StudentSubjectSelectorProps {
  selectedSubject: StudentSubjectItemDto | null;
  onChange: (subject: StudentSubjectItemDto | null) => void;
  error?: string | null;
}

const CATEGORY_TABS = [
  { value: SubjectCategory.GENERAL_LEARNING, label: 'General Learning', desc: 'Math, Physics, English, Science' },
  { value: SubjectCategory.LANGUAGE_TESTING, label: 'Language Testing', desc: 'IELTS, TOEIC, Japanese, Chinese' },
  { value: SubjectCategory.UNIVERSITY_ENTRANCE, label: 'University Entrance', desc: 'Digital SAT, TGAT, TPAT, A-Level' },
];

export const StudentSubjectSelector: React.FC<StudentSubjectSelectorProps> = ({
  selectedSubject,
  onChange,
  error,
}) => {
  const [activeCategory, setActiveCategory] = useState<SubjectCategory>(
    selectedSubject?.category || SubjectCategory.GENERAL_LEARNING
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');

  // Fetch subjects catalog for currently selected category
  const { data: catalog = [] } = useSubjectsCatalog(activeCategory);

  // Auto-sync subject and variant dropdowns with catalog
  useEffect(() => {
    if (catalog.length > 0) {
      // If selected subject matches this catalog, focus on it
      const matchInCatalog = catalog.find((s) => s.variants.some((v) => v.id === selectedSubject?.variant_id));
      if (matchInCatalog) {
        setSelectedSubjectId(matchInCatalog.id);
        setSelectedVariantId(selectedSubject!.variant_id);
      } else {
        setSelectedSubjectId(catalog[0].id);
        if (catalog[0].variants.length > 0) {
          setSelectedVariantId(catalog[0].variants[0].id);
        } else {
          setSelectedVariantId('');
        }
      }
    } else {
      setSelectedSubjectId('');
      setSelectedVariantId('');
    }
  }, [catalog, activeCategory]);

  const currentSubject = catalog.find((s) => s.id === selectedSubjectId);

  // Handle subject dropdown change
  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    const sub = catalog.find((s) => s.id === subjectId);
    if (sub && sub.variants.length > 0) {
      setSelectedVariantId(sub.variants[0].id);
    } else {
      setSelectedVariantId('');
    }
  };

  // Confirm single subject selection
  const handleApplySubject = () => {
    if (!currentSubject || !selectedVariantId) return;
    const variant = currentSubject.variants.find((v) => v.id === selectedVariantId);
    if (!variant) return;

    onChange({
      variant_id: variant.id,
      subject_name: currentSubject.name,
      variant_name: variant.name,
      category: activeCategory,
      learning_goal: variant.learning_goal as LearningGoal,
    });
  };

  const handleClearSubject = () => {
    onChange(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-primary)', display: 'inline-flex' }}>
              <BookOpen size={20} strokeWidth={2.4} />
            </span>
            <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
              Target Subject & Learning Goal <span style={{ color: 'var(--color-primary)' }}>*</span>
            </h4>
          </div>
          <span
            style={{
              padding: '0.25rem 0.625rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: selectedSubject ? 'var(--color-secondary-tint)' : 'var(--color-muted)',
              color: selectedSubject ? '#059669' : '#6b7280',
              fontSize: '0.75rem',
              fontWeight: 800,
            }}
          >
            {selectedSubject ? '1 Subject Selected' : '0 Subjects Selected (1 Required)'}
          </span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
          Select exactly 1 subject and exam variant for this private tutoring match request.
        </p>
      </div>

      {/* 3 Category Selector Buttons (Consistent with Tutor SubjectSelector) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        {CATEGORY_TABS.map((cat) => {
          const isSelected = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveCategory(cat.value)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-muted)',
                color: isSelected ? 'var(--color-white)' : 'var(--fg-main)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 800,
                  marginBottom: '0.25rem',
                  color: isSelected ? 'var(--color-white)' : 'var(--fg-main)',
                }}
              >
                {cat.label}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: isSelected ? 0.9 : 0.7 }}>
                {cat.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Cascading Subject & Variant Picker Box */}
      <div
        style={{
          padding: '1.25rem',
          backgroundColor: 'var(--color-muted)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            alignItems: 'flex-end',
          }}
        >
          {/* 1. Subject Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--fg-main)' }}>
              1. Subject ({activeCategory.replace('_', ' ')})
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="flat-input"
              style={{ fontWeight: 600 }}
            >
              {catalog.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Specific Variant Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--fg-main)' }}>
              2. Specific Variant / Exam Goal
            </label>
            <select
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              className="flat-input"
              style={{ fontWeight: 600 }}
            >
              {currentSubject?.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({formatLearningGoal(v.learning_goal)})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Choose This Subject Button */}
          <div>
            <Button
              type="button"
              variant="primary"
              onClick={handleApplySubject}
              disabled={!selectedVariantId}
              style={{
                width: '100%',
                height: '2.625rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={16} strokeWidth={2.4} /> Select This Subject
            </Button>
          </div>
        </div>
      </div>

      {/* Active Selected Subject Display */}
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--fg-main)' }}>
          Selected Subject for Match:
        </label>

        {!selectedSubject ? (
          <div
            style={{
              padding: '1.25rem',
              textAlign: 'center',
              backgroundColor: '#f9fafb',
              border: error ? '2px dashed var(--color-danger)' : '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: error ? 'var(--color-danger)' : '#6b7280',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {error || 'No subject selected yet. Choose a category, subject, and variant above and click "Select This Subject".'}
          </div>
        ) : (
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--color-secondary-tint)',
              border: '2px solid var(--color-secondary)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-secondary)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={18} strokeWidth={2.6} />
              </div>

              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--fg-main)' }}>
                  {selectedSubject.subject_name} — {selectedSubject.variant_name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span
                    style={{
                      padding: '0.125rem 0.5rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--fg-main)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {selectedSubject.category.replace('_', ' ')}
                  </span>
                  <span
                    style={{
                      padding: '0.125rem 0.5rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#4b5563',
                    }}
                  >
                    {formatLearningGoal(selectedSubject.learning_goal)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClearSubject}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: '#ef4444',
                borderColor: '#fca5a5',
              }}
            >
              <X size={14} /> Clear Selection
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
