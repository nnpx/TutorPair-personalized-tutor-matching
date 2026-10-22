import React, { useState, useEffect } from 'react';
import {
  SubjectCategory,
  LearningGoal,
} from '@tutorpair/shared';
import { useSubjectsCatalog, useTutorSubjects, useSetTutorSubjects } from '../hooks/useTutors';
import { Card, Button, Alert, SaveButton } from '../../../components/ui';
import { BookOpen, Plus, Trash2, FileCheck, Coins } from 'lucide-react';

const GRADE_LEVELS = [
  'G1', 'G2', 'G3', 'G4', 'G5', 'G6',
  'G7', 'G8', 'G9', 'G10', 'G11', 'G12',
];

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

export interface ConfiguredSubjectItem {
  variant_id: string;
  subject_name: string;
  variant_name: string;
  category: SubjectCategory;
  learning_goal: LearningGoal;
  requires_proof: boolean;
  hourly_rate: number;
  grade_levels: string[];
  teaching_focus: string;
}

export interface SubjectSelectorProps {
  value?: ConfiguredSubjectItem[];
  onChange?: (subjects: ConfiguredSubjectItem[]) => void;
  showSaveButton?: boolean;
}

export const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  value,
  onChange,
  showSaveButton = true,
}) => {
  const { data: currentSubjects = [] } = useTutorSubjects();
  const setSubjectsMutation = useSetTutorSubjects();

  // Local state for subjects being configured
  const [internalSubjects, setInternalSubjects] = useState<ConfiguredSubjectItem[]>([]);
  const configuredSubjects = value !== undefined ? value : internalSubjects;

  const updateConfiguredSubjects = (newList: ConfiguredSubjectItem[]) => {
    if (value === undefined) {
      setInternalSubjects(newList);
    }
    onChange?.(newList);
  };

  const [selectedCategory, setSelectedCategory] = useState<SubjectCategory>(SubjectCategory.GENERAL_LEARNING);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState<number>(500);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [teachingFocus, setTeachingFocus] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync configuredSubjects from server on initial load if not controlled
  useEffect(() => {
    if (value === undefined && currentSubjects && currentSubjects.length > 0 && internalSubjects.length === 0) {
      const mapped = currentSubjects.map((s) => ({
        variant_id: s.variant_id,
        subject_name: s.subject_name,
        variant_name: s.variant_name,
        category: s.category,
        learning_goal: s.learning_goal,
        requires_proof: s.requires_proof,
        hourly_rate: s.hourly_rate ?? 500,
        grade_levels: s.grade_levels ?? [],
        teaching_focus: s.teaching_focus ?? '',
      }));
      setInternalSubjects(mapped);
      onChange?.(mapped);
    }
  }, [currentSubjects, value, internalSubjects.length, onChange]);

  // Fetch subjects catalog for currently selected category
  const { data: catalog = [], isLoading: loadingCatalog } = useSubjectsCatalog(selectedCategory);

  // Currently selected subject & variant objects
  const activeSubject = catalog.find((s) => s.id === selectedSubjectId);
  const activeVariant = activeSubject?.variants.find((v) => v.id === selectedVariantId);

  // Group variants by learning_goal
  const groupedVariants = React.useMemo(() => {
    if (!activeSubject) return {};
    const groups: Record<string, typeof activeSubject.variants> = {};
    for (const v of activeSubject.variants) {
      if (!groups[v.learning_goal]) {
        groups[v.learning_goal] = [];
      }
      groups[v.learning_goal].push(v);
    }
    return groups;
  }, [activeSubject]);

  // Handle category change
  const handleCategoryChange = (category: SubjectCategory) => {
    setSelectedCategory(category);
    setSelectedSubjectId('');
    setSelectedVariantId('');
    setSelectedGrades([]);
    setFormError(null);
  };

  // Handle grade toggle
  const toggleGrade = (grade: string) => {
    if (selectedGrades.includes(grade)) {
      setSelectedGrades(selectedGrades.filter((g) => g !== grade));
    } else {
      setSelectedGrades([...selectedGrades, grade]);
    }
  };

  // Add subject to configured list
  const handleAddSubject = () => {
    setFormError(null);
    setSaveSuccess(false);

    if (!selectedSubjectId || !activeSubject) {
      setFormError('Please select a subject.');
      return;
    }
    if (!selectedVariantId || !activeVariant) {
      setFormError('Please select a specific variant.');
      return;
    }
    if (!hourlyRate || hourlyRate <= 0) {
      setFormError('Please provide a valid hourly rate (greater than 0 THB).');
      return;
    }

    // Check duplicate
    if (configuredSubjects.some((item) => item.variant_id === selectedVariantId)) {
      setFormError('You have already added this subject variant.');
      return;
    }

    // If school curriculum, must select at least 1 grade level
    if (activeVariant.learning_goal === LearningGoal.SCHOOL_CURRICULUM && selectedGrades.length === 0) {
      setFormError('Please select at least one grade level (G1–G12) for school curriculum.');
      return;
    }

    const newEntry: ConfiguredSubjectItem = {
      variant_id: activeVariant.id,
      subject_name: activeSubject.name,
      variant_name: activeVariant.name,
      category: activeSubject.category,
      learning_goal: activeVariant.learning_goal,
      requires_proof: activeVariant.requires_proof,
      hourly_rate: Number(hourlyRate),
      grade_levels: selectedGrades,
      teaching_focus: teachingFocus.trim(),
    };

    updateConfiguredSubjects([...configuredSubjects, newEntry]);

    // Reset selection fields for the next subject
    setSelectedVariantId('');
    setSelectedGrades([]);
    setTeachingFocus('');
    setHourlyRate(500);
  };

  // Remove subject
  const handleRemoveSubject = (variantId: string) => {
    updateConfiguredSubjects(configuredSubjects.filter((s) => s.variant_id !== variantId));
    setSaveSuccess(false);
  };

  // Save changes to backend
  const handleSaveToBackend = async () => {
    setFormError(null);
    setSaveSuccess(false);

    try {
      await setSubjectsMutation.mutateAsync({
        subjects: configuredSubjects.map((s) => ({
          variant_id: s.variant_id,
          hourly_rate: s.hourly_rate,
          grade_levels: s.grade_levels.length > 0 ? s.grade_levels : null,
          teaching_focus: s.teaching_focus ? s.teaching_focus : null,
        })),
      });
      setSaveSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save subjects';
      setFormError(message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 1. Added Subjects List on TOP */}
      <Card style={{ backgroundColor: 'var(--bg-canvas)', border: '2px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)' }}>
              My Teaching Subjects
            </h3>
          </div>
        </div>

        {configuredSubjects.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              backgroundColor: 'var(--color-muted)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <p style={{ fontWeight: 600, color: '#6b7280', fontSize: '0.9375rem' }}>
              No subjects added yet. Use the Add Subject box below to select your subjects and hourly rates.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {configuredSubjects.map((item) => (
              <div
                key={item.variant_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.125rem 1.25rem',
                  backgroundColor: 'var(--color-muted)',
                  borderRadius: 'var(--radius-md)',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--fg-main)' }}>
                      {item.subject_name}
                    </span>
                    <span style={{ color: '#9ca3af' }}>•</span>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-primary)' }}>
                      {item.variant_name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-secondary-tint)',
                        color: 'var(--color-secondary-hover)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Coins size={14} strokeWidth={2.4} />
                      ฿{item.hourly_rate} / hr
                    </span>
                    {item.requires_proof && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.125rem 0.375rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--color-accent-tint)',
                          color: 'var(--color-accent)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <FileCheck size={12} strokeWidth={2.4} />
                        Proof Certificate Required
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {item.grade_levels && item.grade_levels.length > 0 && (
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4b5563' }}>
                        Grades: {item.grade_levels.join(', ')}
                      </span>
                    )}
                    {item.teaching_focus && (
                      <span style={{ fontSize: '0.8125rem', fontStyle: 'italic', color: '#6b7280' }}>
                        Focus: "{item.teaching_focus}"
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveSubject(item.variant_id)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    color: 'var(--color-danger)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                  }}
                  title="Remove subject"
                >
                  <Trash2 size={16} strokeWidth={2.2} />
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 2. Creation Box BELOW */}
      <Card style={{ backgroundColor: 'var(--bg-canvas)', border: '2px solid var(--color-border)' }}>
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
            <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--fg-main)' }}>
              Add Subject
            </h2>
            <p style={{ fontSize: '0.9375rem', color: '#4b5563', fontWeight: 500 }}>
              Select category, subject, curriculum variant, and set your specific hourly rate.
            </p>
          </div>
        </div>

        {/* Step 1: Category Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4b5563', marginBottom: '0.625rem' }}>
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

        {/* Step 2: Subject Dropdown */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4b5563', marginBottom: '0.5rem' }}>
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
                setSelectedGrades([]);
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

        {/* Step 3: Selection Grouped by Learning Goal (or direct grid if only 1 goal) */}
        {activeSubject && (
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4b5563', marginBottom: '0.75rem' }}>
              3. Select Your Focus
            </label>

            {Object.keys(groupedVariants).length > 1 ? (
              /* Multiple goals (e.g. School Curriculum vs Competitions) -> Show grouped cards */
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
                      {/* Learning Goal Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span
                          style={{
                            width: '0.5rem',
                            height: '1rem',
                            backgroundColor: 'var(--color-primary)',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        />
                        <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--fg-main)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          {label}
                        </h4>
                      </div>

                      {/* Variant Cards in this Goal */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.625rem' }}>
                        {variants.map((v) => {
                          const isSelected = selectedVariantId === v.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => {
                                setSelectedVariantId(v.id);
                                setSelectedGrades([]);
                              }}
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
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '0.375rem',
                              }}
                            >
                              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isSelected ? 'var(--color-primary-hover)' : 'var(--fg-main)' }}>
                                {v.name}
                              </div>

                              {v.requires_proof && (
                                <span
                                  style={{
                                    fontSize: '0.6875rem',
                                    fontWeight: 700,
                                    padding: '0.125rem 0.375rem',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'var(--color-accent-tint)',
                                    color: 'var(--color-accent)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    alignSelf: 'flex-start',
                                  }}
                                >
                                  <FileCheck size={12} strokeWidth={2.4} />
                                  Proof Req
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Single goal (e.g. TGAT, SAT) -> Direct flat grid with no redundant header */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {activeSubject.variants.map((v) => {
                  const isSelected = selectedVariantId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        setSelectedGrades([]);
                      }}
                      style={{
                        padding: '0.875rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isSelected ? 'var(--color-primary-tint)' : 'var(--color-muted)',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        color: 'var(--fg-main)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: isSelected ? 'var(--color-primary-hover)' : 'var(--fg-main)' }}>
                        {v.name}
                      </div>

                      {v.requires_proof && (
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '0.125rem 0.375rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--color-accent-tint)',
                            color: 'var(--color-accent)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            alignSelf: 'flex-start',
                          }}
                        >
                          <FileCheck size={12} strokeWidth={2.4} />
                          Proof Req
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Per-Subject Hourly Rate & Grade Levels */}
        {activeVariant && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem', backgroundColor: 'var(--color-muted)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4b5563', marginBottom: '0.375rem' }}>
                Hourly Rate for this Subject (THB / hr) *
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '1rem', fontWeight: 800, color: '#6b7280' }}>฿</span>
                <input
                  type="number"
                  min="100"
                  max="10000"
                  step="50"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="flat-input"
                  style={{ paddingLeft: '2.5rem', fontWeight: 700 }}
                  placeholder="e.g. 500"
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Each subject can have its own customized tuition fee.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4b5563', marginBottom: '0.375rem' }}>
                Optional Teaching Focus / Specialization
              </label>
              <input
                type="text"
                value={teachingFocus}
                onChange={(e) => setTeachingFocus(e.target.value)}
                placeholder="e.g. Intensive exam practice, Foundation rebuilding, Target 700+"
                className="flat-input"
                maxLength={255}
              />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                💡 Visible to students and parents on your profile to highlight your strengths.
              </p>
            </div>
          </div>
        )}

        {/* Conditional UI: Grade Levels (G1–G12) for School Curriculum */}
        {activeVariant && activeVariant.learning_goal === LearningGoal.SCHOOL_CURRICULUM && (
          <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--color-muted)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4b5563', marginBottom: '0.5rem' }}>
              Grade Levels Taught (Multi-select) *
            </label>
            <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.75rem' }}>
              Select all primary and secondary grades you are comfortable tutoring for this curriculum.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {GRADE_LEVELS.map((grade) => {
                const isChecked = selectedGrades.includes(grade);
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => toggleGrade(grade)}
                    style={{
                      padding: '0.5rem 0.875rem',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      backgroundColor: isChecked ? 'var(--color-secondary)' : 'var(--bg-canvas)',
                      color: isChecked ? 'var(--color-white)' : 'var(--fg-main)',
                      border: isChecked ? '2px solid var(--color-secondary)' : '2px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {grade}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {formError && (
          <Alert variant="error" style={{ marginBottom: '1.25rem' }}>
            {formError}
          </Alert>
        )}

        <Button
          type="button"
          onClick={handleAddSubject}
          disabled={!activeVariant}
          variant="primary"
          style={{ width: '100%', height: '3.25rem', fontSize: '1rem', fontWeight: 800 }}
        >
          <Plus size={20} strokeWidth={2.4} />
          Add More Subject
        </Button>
      </Card>

      {/* Save Button at the Bottom */}
      {showSaveButton && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          {saveSuccess && (
            <Alert variant="success">
              Subjects and hourly rates updated successfully!
            </Alert>
          )}

          <SaveButton
            type="button"
            onClick={handleSaveToBackend}
            disabled={setSubjectsMutation.isPending}
            isLoading={setSubjectsMutation.isPending}
            label="Save Subject Changes"
          />
        </div>
      )}
    </div>
  );
};
