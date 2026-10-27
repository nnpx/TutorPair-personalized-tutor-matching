import React, { useState, useEffect, useMemo } from 'react';
import {
  SubjectCategory,
  LearningGoal,
  type StudentSubjectItemDto,
} from '@tutorpair/shared';
import { useSubjectsCatalog } from '../hooks/useStudents';
import { Card, Button } from '../../../components/ui';
import { BookOpen, CheckCircle2, X } from 'lucide-react';

export function formatLearningGoal(goal: string): string {
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
  budget: number | '';
  onChangeSubject: (subject: StudentSubjectItemDto | null) => void;
  onChangeBudget: (budget: number | '') => void;
  error?: string | null;
  initialCategory?: SubjectCategory;
}

export const StudentSubjectSelector: React.FC<StudentSubjectSelectorProps> = ({
  selectedSubject,
  budget,
  onChangeSubject,
  onChangeBudget,
  error,
  initialCategory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<SubjectCategory>(
    initialCategory || selectedSubject?.category || SubjectCategory.GENERAL_LEARNING
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    selectedSubject?.variant_id || ''
  );

  // Sync category if parent changes initialCategory
  useEffect(() => {
    if (initialCategory && initialCategory !== selectedCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  // Fetch subjects catalog for currently selected category
  const { data: catalog = [], isLoading: loadingCatalog } = useSubjectsCatalog(selectedCategory);

  const activeSubject = catalog.find((s) => s.id === selectedSubjectId);

  // Auto-sync subject and variant from catalog or existing selection
  useEffect(() => {
    if (catalog.length > 0) {
      const matchInCatalog = catalog.find((s) =>
        s.variants.some((v) => v.id === selectedSubject?.variant_id)
      );
      if (matchInCatalog) {
        setSelectedSubjectId(matchInCatalog.id);
        setSelectedVariantId(selectedSubject!.variant_id);
      } else if (!selectedSubjectId || !catalog.some((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(catalog[0].id);
        setSelectedVariantId('');
      }
    } else {
      setSelectedSubjectId('');
      setSelectedVariantId('');
    }
  }, [catalog, selectedCategory, selectedSubject]);

  // Group variants of current subject by learning goal (matching Tutor SubjectSelector)
  const groupedVariants = useMemo(() => {
    if (!activeSubject) return {};
    return activeSubject.variants.reduce<Record<string, typeof activeSubject.variants>>((acc, v) => {
      const key = v.learning_goal || 'GENERAL';
      if (!acc[key]) acc[key] = [];
      acc[key].push(v);
      return acc;
    }, {});
  }, [activeSubject]);

  const handleCategoryChange = (cat: SubjectCategory) => {
    setSelectedCategory(cat);
    setSelectedSubjectId('');
    setSelectedVariantId('');
  };

  const handleSelectVariant = (variantId: string) => {
    setSelectedVariantId(variantId);
    if (!activeSubject) return;
    const variant = activeSubject.variants.find((v) => v.id === variantId);
    if (!variant) return;

    onChangeSubject({
      variant_id: variant.id,
      subject_name: activeSubject.name,
      variant_name: variant.name,
      category: selectedCategory,
      learning_goal: variant.learning_goal as LearningGoal,
    });
  };

  const handleClearSubject = () => {
    setSelectedVariantId('');
    onChangeSubject(null);
  };

  return (
    <Card
      style={{
        backgroundColor: 'var(--bg-canvas)',
        border: '2px solid var(--color-border)',
        padding: '2rem',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {/* Component Header (matching Tutor SubjectSelector) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <span
          style={{
            width: '2.75rem',
            height: '2.75rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-white)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BookOpen size={22} strokeWidth={2.4} />
        </span>
        <div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
            Select Subject &amp; Budget
          </h2>
          <p style={{ fontSize: '0.9375rem', color: '#4b5563', fontWeight: 500, margin: '0.25rem 0 0 0' }}>
            Select category, subject, curriculum variant, and set your target hourly budget.
          </p>
        </div>
      </div>

      {/* 1. SELECT CATEGORY */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.8125rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#4b5563',
            marginBottom: '0.625rem',
          }}
        >
          1. Select Category
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {[
            { id: SubjectCategory.GENERAL_LEARNING, label: 'General Learning', desc: 'School Math, Sciences, Languages' },
            { id: SubjectCategory.LANGUAGE_TESTING, label: 'Language Testing', desc: 'IELTS, TOEFL, JLPT, HSK' },
            { id: SubjectCategory.UNIVERSITY_ENTRANCE, label: 'University Entrance', desc: 'SAT, TGAT, TPAT, A-Level, POSN' },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                style={{
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-muted)',
                  color: isSelected ? 'var(--color-white)' : 'var(--fg-main)',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
                  {cat.label}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: isSelected ? 0.9 : 0.7 }}>
                  {cat.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SELECT SUBJECT */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.8125rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#4b5563',
            marginBottom: '0.5rem',
          }}
        >
          2. Select Subject
        </label>
        {loadingCatalog ? (
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading catalog...</p>
        ) : (
          <select
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              setSelectedVariantId('');
            }}
            className="flat-input"
            style={{ fontWeight: 600 }}
          >
            <option value="">-- Choose a Subject --</option>
            {catalog.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 3. SELECT YOUR FOCUS (Grouped by learning goal, proof req removed for students) */}
      {activeSubject && (
        <div style={{ marginBottom: '1.75rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#4b5563',
              marginBottom: '0.75rem',
            }}
          >
            3. Select Your Focus
          </label>

          {Object.keys(groupedVariants).length > 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {Object.entries(groupedVariants).map(([goal, variants]) => {
                const label = formatLearningGoal(goal);
                return (
                  <div
                    key={goal}
                    style={{
                      backgroundColor: 'var(--color-muted)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.125rem 1.25rem',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span
                        style={{
                          width: '0.5rem',
                          height: '1rem',
                          backgroundColor: 'var(--color-primary)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      />
                      <h4
                        style={{
                          fontSize: '0.9375rem',
                          fontWeight: 800,
                          color: 'var(--fg-main)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          margin: 0,
                        }}
                      >
                        {label}
                      </h4>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.625rem' }}>
                      {variants.map((v) => {
                        const isSelected = selectedVariantId === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleSelectVariant(v.id)}
                            style={{
                              padding: '0.75rem 0.875rem',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: isSelected ? 'var(--color-primary-tint)' : 'var(--bg-canvas)',
                              border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                              color: 'var(--fg-main)',
                              textAlign: 'left',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.375rem',
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                color: isSelected ? 'var(--color-primary)' : 'var(--fg-main)',
                              }}
                            >
                              {v.name}
                            </div>
                            {isSelected && <CheckCircle2 size={16} color="var(--color-primary)" strokeWidth={2.4} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.625rem' }}>
              {activeSubject.variants.map((v) => {
                const isSelected = selectedVariantId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectVariant(v.id)}
                    style={{
                      padding: '0.75rem 0.875rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--color-primary-tint)' : 'var(--bg-canvas)',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      color: 'var(--fg-main)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.375rem',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: isSelected ? 'var(--color-primary)' : 'var(--fg-main)',
                      }}
                    >
                      {v.name}
                    </div>
                    {isSelected && <CheckCircle2 size={16} color="var(--color-primary)" strokeWidth={2.4} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. HOURLY BUDGET FOR THIS SUBJECT (matching Tutor SubjectSelector, no teaching focus) */}
      <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.8125rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#4b5563',
            marginBottom: '0.5rem',
          }}
        >
          Hourly Rate for this Subject (THB / hr) *
        </label>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', maxWidth: '320px' }}>
          <span
            style={{
              position: 'absolute',
              left: '1rem',
              fontWeight: 800,
              color: budget === '' || Number(budget) < 100 ? '#dc2626' : '#6b7280',
              fontSize: '1rem',
            }}
          >
            ฿
          </span>
          <input
            type="number"
            min="100"
            max="10000"
            step="50"
            value={budget}
            onChange={(e) => onChangeBudget(e.target.value ? Number(e.target.value) : '')}
            className="flat-input"
            style={{
              paddingLeft: '2.5rem',
              fontWeight: 700,
              fontSize: '1rem',
              borderColor: error && (!budget || Number(budget) < 100) ? 'var(--color-danger)' : undefined,
            }}
            placeholder="500"
          />
        </div>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.375rem' }}>
          Each subject can have its own customized tuition fee.
        </p>
      </div>

      {/* Selected Subject Preview Bar */}
      {selectedSubject && (
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
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
              <div style={{ fontSize: '0.8125rem', color: '#059669', fontWeight: 700, marginTop: '0.125rem' }}>
                Budget: ฿{budget || 0} / hr • Online Video Session
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
    </Card>
  );
};
