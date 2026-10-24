import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, PageHeader, Alert, Button } from '../../components/ui';
import { InputField, SelectField } from '../../components/forms';
import { useAuthStore } from '../../store/auth.store';
import {
  useStudentProfile,
  useCreateStudentProfile,
  useUpdateStudentProfile,
} from './hooks/useStudents';
import { StudentSliders } from './components/StudentSliders';
import { TutorTypePref } from '@tutorpair/shared';
import {
  User,
  Sliders,
  Phone,
  MessageSquare,
  Lock,
  CheckCircle2,
  ArrowLeft,
  Check,
  Home,
  AlertTriangle,
  Trash2,
  X,
} from 'lucide-react';

interface SavedStep1State {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  lineId: string;
  gradeLevel: string;
  tutorTypePref: TutorTypePref;
}

interface SavedStep2State {
  styleProfile: number[];
  personalityProfile: number[];
}

type NavigationTarget =
  | { type: 'route'; path: string }
  | { type: 'tab'; tab: StudentTabKey };

const GRADE_OPTIONS = [
  { value: '', label: 'Select Grade Level' },
  { value: 'G1', label: 'Grade 1 (Primary 1)' },
  { value: 'G2', label: 'Grade 2 (Primary 2)' },
  { value: 'G3', label: 'Grade 3 (Primary 3)' },
  { value: 'G4', label: 'Grade 4 (Primary 4)' },
  { value: 'G5', label: 'Grade 5 (Primary 5)' },
  { value: 'G6', label: 'Grade 6 (Primary 6)' },
  { value: 'G7', label: 'Grade 7 (Lower Secondary 1)' },
  { value: 'G8', label: 'Grade 8 (Lower Secondary 2)' },
  { value: 'G9', label: 'Grade 9 (Lower Secondary 3)' },
  { value: 'G10', label: 'Grade 10 (Upper Secondary 4)' },
  { value: 'G11', label: 'Grade 11 (Upper Secondary 5)' },
  { value: 'G12', label: 'Grade 12 (Upper Secondary 6)' },
];

const TUTOR_TYPE_PREF_OPTIONS = [
  { value: TutorTypePref.ANY, label: 'Any Tutor Type (No Preference)' },
  { value: TutorTypePref.UNDERGRADUATE, label: 'Undergraduate Student Tutor' },
  { value: TutorTypePref.FREELANCE, label: 'Full-time / Freelance Tutor' },
  { value: TutorTypePref.INSTITUTIONAL, label: 'School / Institution Teacher' },
];

type StudentTabKey = 'profile' | 'sliders';

export const StudentProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: profile, isLoading } = useStudentProfile();

  const createProfileMutation = useCreateStudentProfile();
  const updateProfileMutation = useUpdateStudentProfile();

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = (searchParams.get('tab') as StudentTabKey) || 'profile';
  const returnTo = searchParams.get('returnTo');

  // Local storage helpers for persistent step progress
  const stepStorageKey = (step: number) => `tutorpair_student_step_${step}_${user?.id || 'guest'}`;

  // Local step completion flags with localStorage persistence
  const [step1Saved, setStep1Saved] = useState<boolean>(() => {
    return localStorage.getItem(`tutorpair_student_step_1_${user?.id || 'guest'}`) === 'true';
  });
  const [step2Saved, setStep2Saved] = useState<boolean>(() => {
    return localStorage.getItem(`tutorpair_student_step_2_${user?.id || 'guest'}`) === 'true';
  });

  // Step 1: Personal Details, Grade Level & Required Contact Channels
  const isStep1Done =
    step1Saved ||
    Boolean(
      profile &&
      profile.first_name &&
      profile.last_name &&
      profile.phone_number &&
      profile.grade_level
    );

  // Step 2: Learning & Personality Sliders (only completed when explicitly saved or confirmed)
  const isStep2Done =
    isStep1Done &&
    Boolean(
      step2Saved ||
      (localStorage.getItem(stepStorageKey(2)) === 'true')
    );

  // Maximum step reachable in 2-step gated progression (1 -> 2)
  const maxReachableStep: number = isStep1Done ? 2 : 1;

  const currentStepNum: number = requestedTab === 'sliders' ? 2 : 1;

  const activeTab: StudentTabKey = requestedTab === 'sliders' && isStep1Done ? 'sliders' : 'profile';

  // Form field states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [lineId, setLineId] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [tutorTypePref, setTutorTypePref] = useState<TutorTypePref>(TutorTypePref.ANY);
  const [budgetMax, setBudgetMax] = useState<number | ''>(500);

  // 1-5 Sliders
  const [styleProfile, setStyleProfile] = useState<number[]>([3, 3, 3, 3, 3]);
  const [personalityProfile, setPersonalityProfile] = useState<number[]>([3, 3, 3, 3]);

  // Baseline saved states for dirty tracking
  const [savedStep1, setSavedStep1] = useState<SavedStep1State>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    lineId: '',
    gradeLevel: '',
    tutorTypePref: TutorTypePref.ANY,
  });

  const [savedStep2, setSavedStep2] = useState<SavedStep2State>({
    styleProfile: [3, 3, 3, 3, 3],
    personalityProfile: [3, 3, 3, 3],
  });

  // Modal & Navigation interruption states
  const [pendingNav, setPendingNav] = useState<NavigationTarget | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState<boolean>(false);
  const [isModalSaving, setIsModalSaving] = useState<boolean>(false);

  // Status feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Strict step-skipping restriction guard
  useEffect(() => {
    if (!isLoading) {
      if (currentStepNum > maxReachableStep) {
        setSearchParams({ tab: 'profile', ...(returnTo ? { returnTo } : {}) });
        setErrorMessage('Action restricted: You must fill in and save your personal details and contact channels in Step 1 first.');
      }
    }
  }, [requestedTab, currentStepNum, maxReachableStep, isLoading, setSearchParams, returnTo]);

  // Sync step completion flags whenever user changes or profile loads
  useEffect(() => {
    const s1 = localStorage.getItem(stepStorageKey(1));
    const s2 = localStorage.getItem(stepStorageKey(2));

    setStep1Saved(s1 === 'true');
    if (s2 === 'true') {
      setStep2Saved(true);
    } else if (s2 === 'false') {
      setStep2Saved(false);
    } else if (profile && s1 === null && s2 === null) {
      // Returning user with established profile in DB from previous session
      setStep1Saved(true);
      setStep2Saved(true);
      localStorage.setItem(stepStorageKey(1), 'true');
      localStorage.setItem(stepStorageKey(2), 'true');
    }
  }, [user?.id, profile]);

  // Populate from existing profile, or clear for first-time user
  useEffect(() => {
    if (profile) {
      const s1: SavedStep1State = {
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        phoneNumber: profile.phone_number || '',
        lineId: profile.line_id || '',
        gradeLevel: profile.grade_level || '',
        tutorTypePref: (profile.tutor_type_pref as TutorTypePref) || TutorTypePref.ANY,
      };
      const s2: SavedStep2State = {
        styleProfile: profile.style_profile && profile.style_profile.length === 5 ? [...profile.style_profile] : [3, 3, 3, 3, 3],
        personalityProfile: profile.personality_profile && profile.personality_profile.length === 4 ? [...profile.personality_profile] : [3, 3, 3, 3],
      };

      setFirstName(s1.firstName);
      setLastName(s1.lastName);
      setPhoneNumber(s1.phoneNumber);
      setLineId(s1.lineId);
      setGradeLevel(s1.gradeLevel);
      setTutorTypePref(s1.tutorTypePref);
      setBudgetMax(profile.budget_max || 500);

      setStyleProfile(s2.styleProfile);
      setPersonalityProfile(s2.personalityProfile);

      setSavedStep1(s1);
      setSavedStep2(s2);
    } else {
      // First-time user: reset fields to blank defaults
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setLineId('');
      setGradeLevel('');
      setTutorTypePref(TutorTypePref.ANY);
      setBudgetMax(500);
      setStyleProfile([3, 3, 3, 3, 3]);
      setPersonalityProfile([3, 3, 3, 3]);

      setSavedStep1({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        lineId: '',
        gradeLevel: '',
        tutorTypePref: TutorTypePref.ANY,
      });
      setSavedStep2({
        styleProfile: [3, 3, 3, 3, 3],
        personalityProfile: [3, 3, 3, 3],
      });
    }
  }, [profile]);

  // Dirty detection per step
  const isStep1Dirty =
    firstName.trim() !== savedStep1.firstName.trim() ||
    lastName.trim() !== savedStep1.lastName.trim() ||
    phoneNumber.trim() !== savedStep1.phoneNumber.trim() ||
    lineId.trim() !== savedStep1.lineId.trim() ||
    gradeLevel !== savedStep1.gradeLevel ||
    tutorTypePref !== savedStep1.tutorTypePref;

  const isStep2Dirty =
    styleProfile.some((val, idx) => val !== (savedStep2.styleProfile[idx] ?? 3)) ||
    personalityProfile.some((val, idx) => val !== (savedStep2.personalityProfile[idx] ?? 3));

  // Browser beforeunload protection if dirty
  useEffect(() => {
    const isCurrentStepDirty = activeTab === 'profile' ? isStep1Dirty : isStep2Dirty;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCurrentStepDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeTab, isStep1Dirty, isStep2Dirty]);

  const handleStyleChange = (index: number, val: number) => {
    const updated = [...styleProfile];
    updated[index] = val;
    setStyleProfile(updated);
    setSuccessMessage(null);
  };

  const handlePersonalityChange = (index: number, val: number) => {
    const updated = [...personalityProfile];
    updated[index] = val;
    setPersonalityProfile(updated);
    setSuccessMessage(null);
  };

  // Step 1: Save Personal Info
  const handleSaveStep1 = async (e?: React.FormEvent, proceedToNext: boolean = true): Promise<boolean> => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!firstName.trim()) {
      setErrorMessage('First name is required. Please enter your first name.');
      return false;
    }
    if (!lastName.trim()) {
      setErrorMessage('Last name is required. Please enter your last name.');
      return false;
    }
    if (!phoneNumber.trim()) {
      setErrorMessage('Phone number is required. Please enter your contact phone number.');
      return false;
    }
    if (!gradeLevel) {
      setErrorMessage('Grade level is required. Please select your current grade level (G1–G12).');
      return false;
    }

    try {
      if (!profile) {
        // Initial profile creation
        await createProfileMutation.mutateAsync({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phoneNumber.trim(),
          line_id: lineId.trim() || undefined,
          grade_level: gradeLevel,
          tutor_type_pref: tutorTypePref,
          style_profile: styleProfile,
          personality_profile: personalityProfile,
          budget_max: Number(budgetMax) > 0 ? Number(budgetMax) : 500,
        });

        // For first-time user: Step 1 is done, but Step 2 sliders are explicitly not saved yet
        setStep2Saved(false);
        localStorage.setItem(stepStorageKey(2), 'false');
      } else {
        // Update existing profile
        await updateProfileMutation.mutateAsync({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phoneNumber.trim(),
          line_id: lineId.trim() || null,
          grade_level: gradeLevel,
          tutor_type_pref: tutorTypePref,
        });
      }

      setStep1Saved(true);
      localStorage.setItem(stepStorageKey(1), 'true');

      setSavedStep1({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        lineId: lineId.trim(),
        gradeLevel,
        tutorTypePref,
      });

      if (proceedToNext) {
        setSuccessMessage('Step 1 complete! Personal details and contact channels saved. Now configure your learning sliders.');
        setSearchParams({ tab: 'sliders', ...(returnTo ? { returnTo } : {}) });
      } else {
        setSuccessMessage('Personal details and contact channels saved successfully.');
      }
      return true;
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save student personal info.');
      return false;
    }
  };

  // Step 2: Save Learning Sliders & Proceed to Find Tutors
  const handleSaveStep2 = async (e?: React.FormEvent, returnHome: boolean = true): Promise<boolean> => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (styleProfile.length !== 5) {
      setErrorMessage('Please answer all 5 learning style questions.');
      return false;
    }
    if (personalityProfile.length !== 4) {
      setErrorMessage('Please answer all 4 personality preference questions.');
      return false;
    }

    try {
      await updateProfileMutation.mutateAsync({
        style_profile: styleProfile,
        personality_profile: personalityProfile,
      });

      setStep2Saved(true);
      localStorage.setItem(stepStorageKey(2), 'true');

      setSavedStep2({
        styleProfile: [...styleProfile],
        personalityProfile: [...personalityProfile],
      });

      if (returnHome) {
        setSuccessMessage('Step 2 complete! Learning & personality sliders saved.');
        navigate(returnTo || '/student/matching');
      } else {
        setSuccessMessage('Learning & personality sliders saved successfully.');
      }
      return true;
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save learning sliders.');
      return false;
    }
  };

  // Safe navigation execution
  const executeNavigation = (target: NavigationTarget) => {
    if (target.type === 'route') {
      navigate(target.path);
    } else if (target.type === 'tab') {
      const targetStep = target.tab === 'sliders' ? 2 : 1;
      if (targetStep > maxReachableStep) {
        if (maxReachableStep === 1) {
          setErrorMessage('Action restricted: You must fill in and save your personal details and contact info in Step 1 first.');
        }
        return;
      }
      setSearchParams({ tab: target.tab, ...(returnTo ? { returnTo } : {}) });
    }
  };

  // Intercept navigation requests to protect unsaved work
  const requestNavigation = (target: NavigationTarget) => {
    if (target.type === 'tab' && target.tab === activeTab) {
      return;
    }

    const isCurrentStepDirty = activeTab === 'profile' ? isStep1Dirty : isStep2Dirty;

    if (isCurrentStepDirty) {
      setPendingNav(target);
      setShowUnsavedModal(true);
    } else {
      executeNavigation(target);
    }
  };

  // Decision 1: Save & Continue
  const handleModalSaveAndProceed = async () => {
    setIsModalSaving(true);
    try {
      if (activeTab === 'profile') {
        const success = await handleSaveStep1(undefined, false);
        if (success) {
          setShowUnsavedModal(false);
          if (pendingNav) {
            executeNavigation(pendingNav);
            setPendingNav(null);
          }
        } else {
          // Validation error in Step 1 form fields
          setShowUnsavedModal(false);
        }
      } else {
        const success = await handleSaveStep2(undefined, false);
        if (success) {
          setShowUnsavedModal(false);
          if (pendingNav) {
            executeNavigation(pendingNav);
            setPendingNav(null);
          }
        } else {
          setShowUnsavedModal(false);
        }
      }
    } finally {
      setIsModalSaving(false);
    }
  };

  // Decision 2: Discard & Leave (Let go)
  const handleConfirmDiscardAndProceed = () => {
    if (activeTab === 'profile') {
      setFirstName(savedStep1.firstName);
      setLastName(savedStep1.lastName);
      setPhoneNumber(savedStep1.phoneNumber);
      setLineId(savedStep1.lineId);
      setGradeLevel(savedStep1.gradeLevel);
      setTutorTypePref(savedStep1.tutorTypePref);

      // If user is first-time and discarded, they cannot proceed to Step 2
      if (!isStep1Done && pendingNav?.type === 'tab' && pendingNav.tab === 'sliders') {
        setShowUnsavedModal(false);
        setPendingNav(null);
        setErrorMessage('Action restricted: You must fill in and save your personal details in Step 1 before proceeding to Step 2.');
        return;
      }
    } else {
      setStyleProfile([...savedStep2.styleProfile]);
      setPersonalityProfile([...savedStep2.personalityProfile]);
    }

    setShowUnsavedModal(false);
    if (pendingNav) {
      executeNavigation(pendingNav);
      setPendingNav(null);
    }
  };

  // Decision 3: Keep Editing (Cancel)
  const handleCancelNavigation = () => {
    setShowUnsavedModal(false);
    setPendingNav(null);
  };

  // Handler for Next button on Step 1: Enforces modal decision if unsaved changes exist
  const handleNextStepClick = () => {
    // 1. If Step 1 has unsaved changes, require user to choose Save or Discard via the warning modal first
    if (isStep1Dirty) {
      requestNavigation({ type: 'tab', tab: 'sliders' });
      return;
    }

    // 2. If user hasn't completed Step 1 yet (e.g. initial empty form)
    if (!isStep1Done) {
      handleSaveStep1(undefined, true);
      return;
    }

    // 3. Step 1 has no unsaved modifications: proceed directly to Step 2
    requestNavigation({ type: 'tab', tab: 'sliders' });
  };

  // Navigation tab click with strict gating enforcement
  const handleStepClick = (tab: StudentTabKey) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const targetStep = tab === 'sliders' ? 2 : 1;
    if (targetStep > maxReachableStep) {
      if (maxReachableStep === 1) {
        setErrorMessage('Action restricted: You must fill in and save your personal details and contact info in Step 1 first.');
      }
      return;
    }

    requestNavigation({ type: 'tab', tab });
  };

  const isSaving = createProfileMutation.isPending || updateProfileMutation.isPending;

  if (isLoading) {
    return (
      <div style={{ maxWidth: '840px', margin: '2rem auto', textAlign: 'center' }}>
        <Card style={{ padding: '3rem' }}>
          <p style={{ fontWeight: 700, color: '#6b7280' }}>Loading student profile...</p>
        </Card>
      </div>
    );
  }

  const STEPS = [
    {
      id: 1,
      tab: 'profile' as const,
      title: 'Step 1: Personal & Contact Info',
      subtitle: isStep1Done ? 'Completed' : 'Fill details first',
      icon: User,
    },
    {
      id: 2,
      tab: 'sliders' as const,
      title: 'Step 2: Learning Sliders',
      subtitle: isStep2Done ? 'Completed' : !isStep1Done ? 'Locked (Step 1 needed)' : 'Configure 9 sliders',
      icon: Sliders,
    },
  ];

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Breadcrumb Navigation */}
      <div>
        <button
          type="button"
          onClick={() => requestNavigation({ type: 'route', path: returnTo || '/student/matching' })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: '#4b5563',
            fontSize: '0.8125rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
          }}
        >
          <ArrowLeft size={15} /> Back to Find Tutors
        </button>
      </div>

      <PageHeader
        title="Student Profile & Learning Preferences"
        description="Set up your profile, 1–5 learning sliders, and schedule. When you want a tutor, select your subject on the Find Tutors page."
      />

      {/* 2-Step Progress Tracker with Strict Gating */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {STEPS.map((s) => {
          const isCurrent = activeTab === s.tab;
          const isDone = s.id === 1 ? isStep1Done : isStep2Done;
          const isClickable = s.id <= maxReachableStep;

          return (
            <button
              key={s.id}
              type="button"
              disabled={!isClickable}
              onClick={() => handleStepClick(s.tab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-lg)',
                border: isCurrent
                  ? '2px solid var(--color-primary)'
                  : isDone
                    ? '2px solid var(--color-secondary)'
                    : '2px solid var(--color-border)',
                backgroundColor: isCurrent
                  ? 'var(--color-primary-tint)'
                  : isDone
                    ? '#ffffff'
                    : '#f9fafb',
                cursor: isClickable ? 'pointer' : 'not-allowed',
                opacity: isClickable ? 1 : 0.5,
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: !isClickable
                    ? '#9ca3af'
                    : isDone
                      ? 'var(--color-secondary)'
                      : isCurrent
                        ? 'var(--color-primary)'
                        : '#9ca3af',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  flexShrink: 0,
                }}
              >
                {!isClickable ? (
                  <Lock size={14} />
                ) : isDone ? (
                  <CheckCircle2 size={16} strokeWidth={2.6} />
                ) : (
                  s.id
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--fg-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.title}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: !isClickable ? '#9ca3af' : isDone ? '#059669' : isCurrent ? 'var(--color-primary)' : '#6b7280',
                    fontWeight: 700,
                  }}
                >
                  {!isClickable ? '🔒 Locked' : isDone ? '✓ Completed' : isCurrent ? '● Active' : 'Ready'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Global Alerts */}
      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {/* TAB 1: Personal Details (TP-58) */}
      {activeTab === 'profile' && (
        <Card style={{ padding: '2rem' }}>
          <form onSubmit={(e) => handleSaveStep1(e, false)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.2rem 0.6rem', backgroundColor: 'var(--color-primary-tint)', color: 'var(--color-primary)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 800 }}>
                  <User size={13} strokeWidth={2.5} /> Step 1 of 2
                </div>
                {isStep1Dirty && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.2rem 0.6rem',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fca5a5',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                    }}
                  >
                    ● Unsaved Changes
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0 0 0.25rem 0' }}>
                Personal Details & Academic Level
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                Your identity and grade level are persistent across all your tutor bookings.
              </p>
            </div>

            {/* Account Email (Readonly) */}
            <InputField
              label="Account Email"
              type="email"
              value={user?.email || profile?.email || ''}
              placeholder={user?.email ? undefined : 'No session email'}
              disabled
              isLocked
              helperText="Managed by authentication. Contact support to update email."
            />

            {/* Name Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <InputField
                label="First Name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Somchai"
              />
              <InputField
                label="Last Name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Jaidee"
              />
            </div>

            {/* Academic Grade Level (G1–G12) */}
            <SelectField
              label="Current Grade Level (G1–G12)"
              required
              helperText="Determines whether school curriculum syllabi match your level."
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              options={GRADE_OPTIONS}
            />

            {/* Instructor Preference */}
            <SelectField
              label="Tutor Type Preference"
              required
              helperText="Helps the matching algorithm rank tutor categories according to your preference."
              value={tutorTypePref}
              onChange={(e) => setTutorTypePref(e.target.value as TutorTypePref)}
              options={TUTOR_TYPE_PREF_OPTIONS}
            />

            {/* Contact Channels */}
            <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0 0 0.25rem 0' }}>
                Contact Channels
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 1rem 0' }}>
                Your phone number is used for lesson coordination. You may also provide your LINE ID optionally.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <InputField
                  label="Phone Number"
                  required
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0812345678"
                  leftIcon={<Phone size={16} />}
                  helperText="Required for lesson coordination."
                />

                <InputField
                  label="LINE ID (Optional)"
                  type="text"
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  placeholder="e.g. @somchai_j"
                  leftIcon={<MessageSquare size={16} />}
                  helperText="Optional chat app for direct lesson coordination."
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              {/* Back to Home Button */}
              <Button
                type="button"
                variant="secondary"
                onClick={() => requestNavigation({ type: 'route', path: returnTo || '/student/matching' })}
                style={{
                  height: '3rem',
                  padding: '0 1.25rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 700,
                }}
              >
                <Home size={16} /> Back to Find Tutors
              </Button>

              {/* Action Buttons: Save Changes vs Next */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={(e) => handleSaveStep1(e, false)}
                  isLoading={isSaving}
                  style={{
                    height: '3rem',
                    padding: '0 1.5rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 700,
                  }}
                >
                  <Check size={16} /> Save Changes
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNextStepClick}
                  isLoading={isSaving}
                  style={{
                    height: '3rem',
                    padding: '0 1.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 800,
                  }}
                >
                  Next: Sliders →
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 2: Learning & Personality Sliders (TP-57) */}
      {activeTab === 'sliders' && (
        <Card style={{ padding: '2rem' }}>
          <form onSubmit={handleSaveStep2} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.2rem 0.6rem', backgroundColor: 'var(--color-primary-tint)', color: 'var(--color-primary)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 800 }}>
                    <Sliders size={13} strokeWidth={2.5} /> Step 2 of 2
                  </div>
                  {isStep2Dirty && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.2rem 0.6rem',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fca5a5',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                      }}
                    >
                      ● Unsaved Changes
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                  1–5 Learning & Personality Sliders
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                  Adjust each slider to reflect how you study and learn best. Our matchmaking algorithm uses these to match teaching styles.
                </p>
              </div>
              <span
                style={{
                  padding: '0.25rem 0.625rem',
                  backgroundColor: 'var(--color-primary-tint)',
                  color: 'var(--color-primary)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                }}
              >
                9 Questions Total
              </span>
            </div>

            <StudentSliders
              styleProfile={styleProfile}
              personalityProfile={personalityProfile}
              onStyleChange={handleStyleChange}
              onPersonalityChange={handlePersonalityChange}
            />

            {/* Navigation & Action Buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.25rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              {/* Back to Step 1 */}
              <Button
                type="button"
                variant="secondary"
                onClick={() => requestNavigation({ type: 'tab', tab: 'profile' })}
                style={{
                  height: '3rem',
                  padding: '0 1.25rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 700,
                }}
              >
                <ArrowLeft size={16} /> Back to Personal Info
              </Button>

              {/* Single Primary Finish Button (Redundant Save Changes Button removed) */}
              <Button
                type="button"
                variant="primary"
                onClick={(e) => handleSaveStep2(e, true)}
                isLoading={isSaving}
                style={{
                  height: '3rem',
                  padding: '0 1.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 800,
                }}
              >
                <Home size={16} /> {returnTo ? 'Save & Return to Find Tutors →' : 'Save & Back to Home →'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Red Unsaved Changes Warning Modal */}
      {showUnsavedModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(17, 24, 39, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isModalSaving) {
              handleCancelNavigation();
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '3px solid var(--color-danger)',
              width: '100%',
              maxWidth: '520px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: 'none',
            }}
          >
            {/* Red Alert Banner */}
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '2px solid #ef4444',
                borderRadius: 'var(--radius-md)',
                padding: '1.125rem',
                display: 'flex',
                gap: '0.875rem',
                alignItems: 'flex-start',
              }}
            >
              <AlertTriangle
                size={26}
                color="#dc2626"
                strokeWidth={2.4}
                style={{ flexShrink: 0, marginTop: '0.125rem' }}
              />
              <div style={{ flex: 1 }}>
                <div
                  id="unsaved-modal-title"
                  style={{
                    fontWeight: 800,
                    fontSize: '1.0625rem',
                    color: '#991b1b',
                    marginBottom: '0.35rem',
                  }}
                >
                  Unsaved Changes Detected
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: '#b91c1c',
                    lineHeight: 1.5,
                    fontWeight: 600,
                  }}
                >
                  {pendingNav?.type === 'tab' && pendingNav.tab === 'sliders'
                    ? 'You have modified information that has not been saved yet. Before proceeding to the next step, please choose whether to save your changes to the database or discard them.'
                    : 'You have modified information that has not been saved yet. If you leave now without saving, these changes will be discarded and will not be updated in the database.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelNavigation}
                disabled={isModalSaving}
                aria-label="Close dialog"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#991b1b',
                  cursor: isModalSaving ? 'not-allowed' : 'pointer',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={18} strokeWidth={2.4} />
              </button>
            </div>

            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--fg-main)' }}>
              {pendingNav?.type === 'tab' && pendingNav.tab === 'sliders'
                ? 'Please choose whether to save your changes or discard them before proceeding to Step 2:'
                : 'Please choose how you want to proceed before leaving:'}
            </div>

            {/* Action Decisions Stash */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {/* Option 1: Save & Continue */}
              <Button
                type="button"
                variant="primary"
                onClick={handleModalSaveAndProceed}
                isLoading={isModalSaving}
                style={{
                  height: '3rem',
                  width: '100%',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: 800,
                  fontSize: '0.9375rem',
                }}
              >
                <Check size={18} strokeWidth={2.5} />{' '}
                {pendingNav?.type === 'tab' && pendingNav.tab === 'sliders'
                  ? 'Save Changes & Proceed to Step 2 →'
                  : 'Save Changes & Continue'}
              </Button>

              {/* Option 2: Discard & Leave (Let go) */}
              <button
                type="button"
                onClick={handleConfirmDiscardAndProceed}
                disabled={isModalSaving}
                style={{
                  height: '3rem',
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: 800,
                  fontSize: '0.9375rem',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: '2px solid #ef4444',
                  borderRadius: 'var(--radius-md)',
                  cursor: isModalSaving ? 'not-allowed' : 'pointer',
                  opacity: isModalSaving ? 0.6 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                <Trash2 size={16} strokeWidth={2.2} />{' '}
                {pendingNav?.type === 'tab' && pendingNav.tab === 'sliders'
                  ? 'Discard Changes & Proceed to Step 2 →'
                  : 'Discard & Leave Without Saving'}
              </button>

              {/* Option 3: Keep Editing (Cancel) */}
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancelNavigation}
                disabled={isModalSaving}
                style={{
                  height: '2.75rem',
                  width: '100%',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                }}
              >
                Keep Editing (Stay Here)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
