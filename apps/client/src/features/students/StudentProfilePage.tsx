import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Modal } from '../../components/ui';
import { InputField, SelectField } from '../../components/forms';
import { useAuthStore } from '../../store/auth.store';
import {
  useStudentProfile,
  useUpdateStudentProfile,
  useStudentAvailability,
  useSetStudentAvailability,
} from './hooks/useStudents';
import { StudentSliders } from './components/StudentSliders';
import { StudentAvailabilityGrid } from './components/StudentAvailabilityGrid';
import { TutorTypePref, type StudentAvailabilitySlotDto } from '@tutorpair/shared';
import {
  User,
  Sliders,
  Calendar,
  Save,
  CheckCircle2,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';

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

type SettingsTab = 'profile' | 'sliders' | 'availability';

export const StudentProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: profile, isLoading } = useStudentProfile();
  const updateProfileMutation = useUpdateStudentProfile();
  const { data: serverAvailability, isLoading: isAvailabilityLoading } = useStudentAvailability();
  const setAvailabilityMutation = useSetStudentAvailability();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Form field states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [lineId, setLineId] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [tutorTypePref, setTutorTypePref] = useState<TutorTypePref>(TutorTypePref.ANY);
  const [budgetMax, setBudgetMax] = useState<number | ''>(500);

  // 1–5 Sliders
  const [styleProfile, setStyleProfile] = useState<number[]>([3, 3, 3, 3, 3]);
  const [personalityProfile, setPersonalityProfile] = useState<number[]>([3, 3, 3, 3]);

  // Feedback states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync profile data on initial fetch
  useEffect(() => {
    if (profile) {
      if (profile.first_name) setFirstName(profile.first_name);
      if (profile.last_name) setLastName(profile.last_name);
      if (profile.phone_number) setPhoneNumber(profile.phone_number);
      if (profile.line_id) setLineId(profile.line_id);
      if (profile.grade_level) setGradeLevel(profile.grade_level);
      if (profile.tutor_type_pref) setTutorTypePref(profile.tutor_type_pref as TutorTypePref);
      if (profile.budget_max) setBudgetMax(Number(profile.budget_max));
      if (profile.style_profile && profile.style_profile.length === 5) {
        setStyleProfile([...profile.style_profile]);
      }
      if (profile.personality_profile && profile.personality_profile.length === 4) {
        setPersonalityProfile([...profile.personality_profile]);
      }
    }
  }, [profile]);

  // Availability schedule slots state
  const [availabilitySlots, setAvailabilitySlots] = useState<StudentAvailabilitySlotDto[]>([]);
  const hasInitializedAvailability = useRef(false);

  useEffect(() => {
    if (serverAvailability && !hasInitializedAvailability.current) {
      setAvailabilitySlots(
        serverAvailability.map((s) => ({
          day_of_week: s.day_of_week,
          start_time: s.start_time.length > 5 ? s.start_time.slice(0, 5) : s.start_time,
          end_time: s.end_time.length > 5 ? s.end_time.slice(0, 5) : s.end_time,
        }))
      );
      hasInitializedAvailability.current = true;
    }
  }, [serverAvailability]);

  // Unsaved changes detection
  const isPersonalDirty = Boolean(
    profile && (
      firstName.trim() !== (profile.first_name || '').trim() ||
      lastName.trim() !== (profile.last_name || '').trim() ||
      phoneNumber.trim() !== (profile.phone_number || '').trim() ||
      (lineId.trim() || '') !== (profile.line_id || '').trim() ||
      gradeLevel !== (profile.grade_level || '') ||
      tutorTypePref !== (profile.tutor_type_pref || TutorTypePref.ANY) ||
      Number(budgetMax) !== Number(profile.budget_max || 500)
    )
  );

  const isSlidersDirty = Boolean(
    profile && (
      (profile.style_profile && JSON.stringify(styleProfile) !== JSON.stringify(profile.style_profile)) ||
      (profile.personality_profile && JSON.stringify(personalityProfile) !== JSON.stringify(profile.personality_profile))
    )
  );

  const isAvailabilityDirty = useMemo(() => {
    if (!serverAvailability) return false;
    const normalize = (slots: StudentAvailabilitySlotDto[]) =>
      [...slots]
        .map((s) => ({
          day_of_week: s.day_of_week,
          start_time: s.start_time.length > 5 ? s.start_time.slice(0, 5) : s.start_time,
          end_time: s.end_time.length > 5 ? s.end_time.slice(0, 5) : s.end_time,
        }))
        .sort(
          (a, b) =>
            a.day_of_week.localeCompare(b.day_of_week) ||
            a.start_time.localeCompare(b.start_time) ||
            a.end_time.localeCompare(b.end_time)
        );

    return JSON.stringify(normalize(availabilitySlots)) !== JSON.stringify(normalize(serverAvailability));
  }, [availabilitySlots, serverAvailability]);

  const isCurrentTabDirty =
    (activeTab === 'profile' && isPersonalDirty) ||
    (activeTab === 'sliders' && isSlidersDirty) ||
    (activeTab === 'availability' && isAvailabilityDirty);

  // Modal state for unsaved changes warning (Request 2)
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<SettingsTab | 'hub' | null>(null);

  // Revert form state back to database profile values
  const resetTabState = (tab: SettingsTab) => {
    if (tab === 'profile') {
      if (!profile) return;
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhoneNumber(profile.phone_number || '');
      setLineId(profile.line_id || '');
      setGradeLevel(profile.grade_level || '');
      setTutorTypePref((profile.tutor_type_pref as TutorTypePref) || TutorTypePref.ANY);
      setBudgetMax(profile.budget_max ? Number(profile.budget_max) : 500);
    } else if (tab === 'sliders') {
      if (!profile) return;
      if (profile.style_profile && profile.style_profile.length === 5) {
        setStyleProfile([...profile.style_profile]);
      }
      if (profile.personality_profile && profile.personality_profile.length === 4) {
        setPersonalityProfile([...profile.personality_profile]);
      }
    } else if (tab === 'availability') {
      if (serverAvailability) {
        setAvailabilitySlots(
          serverAvailability.map((s) => ({
            day_of_week: s.day_of_week,
            start_time: s.start_time.length > 5 ? s.start_time.slice(0, 5) : s.start_time,
            end_time: s.end_time.length > 5 ? s.end_time.slice(0, 5) : s.end_time,
          }))
        );
      }
    }
  };

  // Intercept tab click if unsaved changes exist
  const handleTabClick = (targetTab: SettingsTab) => {
    if (targetTab === activeTab) return;
    if (isCurrentTabDirty) {
      setPendingTarget(targetTab);
      setIsUnsavedModalOpen(true);
      return;
    }
    setActiveTab(targetTab);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Intercept Option 1 "Back to Matching Hub" button if unsaved changes exist
  const handleBackToHub = (e: React.MouseEvent) => {
    if (isCurrentTabDirty || isPersonalDirty || isSlidersDirty || isAvailabilityDirty) {
      e.preventDefault();
      setPendingTarget('hub');
      setIsUnsavedModalOpen(true);
    }
  };

  // Browser beforeunload prompt if user tries to close tab or reload with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isPersonalDirty || isSlidersDirty || isAvailabilityDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isPersonalDirty, isSlidersDirty, isAvailabilityDirty]);

  // Discard changes & proceed
  const handleDiscardChanges = () => {
    resetTabState(activeTab);
    setIsUnsavedModalOpen(false);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (pendingTarget === 'hub') {
      navigate('/student/matching');
    } else if (pendingTarget) {
      setActiveTab(pendingTarget);
    }
    setPendingTarget(null);
  };

  // Save changes & proceed
  const handleSaveAndProceed = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      if (activeTab === 'profile') {
        if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim() || !gradeLevel) {
          setErrorMessage('Please fill in all required fields before saving.');
          setIsUnsavedModalOpen(false);
          setIsSaving(false);
          return;
        }
        await updateProfileMutation.mutateAsync({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phoneNumber.trim(),
          line_id: lineId.trim() || null,
          grade_level: gradeLevel,
          tutor_type_pref: tutorTypePref,
          budget_max: Number(budgetMax),
        });
      } else if (activeTab === 'sliders') {
        await updateProfileMutation.mutateAsync({
          style_profile: styleProfile,
          personality_profile: personalityProfile,
        });
      } else if (activeTab === 'availability') {
        if (availabilitySlots.length === 0) {
          setErrorMessage('Please add at least one available weekly time slot before saving.');
          setIsUnsavedModalOpen(false);
          setIsSaving(false);
          return;
        }
        await setAvailabilityMutation.mutateAsync({
          availability: availabilitySlots.map((s) => ({
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
          })),
        });
      }

      setIsUnsavedModalOpen(false);
      setSuccessMessage(
        activeTab === 'profile'
          ? 'Profile updated successfully.'
          : activeTab === 'sliders'
          ? 'Learning style preferences saved successfully.'
          : 'Weekly study schedule saved successfully.'
      );

      if (pendingTarget === 'hub') {
        navigate('/student/matching');
      } else if (pendingTarget) {
        setActiveTab(pendingTarget);
      }
      setPendingTarget(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save changes.');
      setIsUnsavedModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!firstName.trim()) {
      setErrorMessage('First name is required.');
      return;
    }
    if (!lastName.trim()) {
      setErrorMessage('Last name is required.');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMessage('Phone number is required.');
      return;
    }
    if (!gradeLevel) {
      setErrorMessage('Please select your grade level.');
      return;
    }
    if (!budgetMax || Number(budgetMax) <= 0) {
      setErrorMessage('Please enter a valid hourly budget.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfileMutation.mutateAsync({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phoneNumber.trim(),
        line_id: lineId.trim() || null,
        grade_level: gradeLevel,
        tutor_type_pref: tutorTypePref,
        budget_max: Number(budgetMax),
      });
      setSuccessMessage('Profile and contact details saved successfully.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSliders = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (styleProfile.length !== 5) {
      setErrorMessage('Please answer all 5 learning style questions.');
      return;
    }
    if (personalityProfile.length !== 4) {
      setErrorMessage('Please answer all 4 personality questions.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfileMutation.mutateAsync({
        style_profile: styleProfile,
        personality_profile: personalityProfile,
      });
      setSuccessMessage('Learning style preferences saved successfully.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update sliders.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isAvailabilityLoading) {
    return (
      <Card style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <p style={{ fontWeight: 700, fontSize: '1.125rem', color: '#6b7280' }}>
          Loading profile settings...
        </p>
      </Card>
    );
  }

  const tabs = [
    { key: 'profile' as SettingsTab, label: 'Personal & Contact Details', icon: User, isDirty: isPersonalDirty },
    { key: 'sliders' as SettingsTab, label: 'Learning Style & Preferences', icon: Sliders, isDirty: isSlidersDirty },
    { key: 'availability' as SettingsTab, label: 'Weekly Study Schedule', icon: Calendar, isDirty: isAvailabilityDirty },
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Option 1: Back to Matching Hub Button */}
      <div>
        <Link
          to="/student/matching"
          onClick={handleBackToHub}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.875rem',
            fontWeight: 700,
            color: '#4b5563',
            textDecoration: 'none',
            padding: '0.45rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#ffffff',
            border: '2px solid var(--color-border)',
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowLeft size={16} strokeWidth={2.4} /> Back to Matching Hub
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--fg-main)', letterSpacing: '-0.02em', margin: '0 0 0.5rem 0' }}>
          Student Profile &amp; Preferences
        </h1>
        <p style={{ color: '#4b5563', fontSize: '1rem', fontWeight: 500, margin: 0 }}>
          Keep your contact information, learning style preferences, and weekly schedule up to date so we can match you with your ideal tutors.
        </p>
      </div>

      {/* Settings Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid var(--color-border)',
          paddingBottom: '0.25rem',
          flexWrap: 'wrap',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabClick(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                border: 'none',
                backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--fg-main)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.9375rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              <Icon size={18} strokeWidth={2.2} />
              <span>{tab.label}</span>
              {tab.isDirty && (
                <span
                  title="Unsaved changes in this tab"
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#ffffff' : '#f59e0b',
                    display: 'inline-block',
                    marginLeft: '0.25rem',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Global Alerts */}
      {errorMessage && (
        <Alert variant="error">
          <strong>Error:</strong> {errorMessage}
        </Alert>
      )}
      {successMessage && (
        <Alert variant="success">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} strokeWidth={2.4} />
            <span>{successMessage}</span>
          </div>
        </Alert>
      )}

      {/* Unsaved Changes Banner */}
      {isCurrentTabDirty && !errorMessage && !successMessage && (
        <div
          style={{
            padding: '0.625rem 1rem',
            backgroundColor: '#fffbeb',
            border: '1.5px solid #fcd34d',
            borderRadius: 'var(--radius-md)',
            color: '#92400e',
            fontSize: '0.8125rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertTriangle size={16} strokeWidth={2.4} color="#d97706" />
          <span>
            {activeTab === 'availability'
              ? 'You have unsaved changes in your schedule. Click "Save Availability Schedule" below to update your profile.'
              : 'You have unsaved changes in this tab. Click "Save Changes" below to update your profile.'}
          </span>
        </div>
      )}

      {/* TAB 1: Personal & Contact Info */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile}>
          <Card
            style={{
              padding: '2rem',
              backgroundColor: 'var(--bg-canvas)',
              border: '2px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '1rem' }}>
              <span
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-tint)',
                  color: 'var(--color-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={20} strokeWidth={2.4} />
              </span>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                  Personal &amp; Academic Details
                </h2>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>
                  Keep your contact info and academic grade level up to date.
                </p>
              </div>
            </div>

            {/* Contact Sharing Notice (matches Tutor Profile visibility pattern) */}
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-secondary-tint)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.8125rem',
                color: 'var(--fg-main)',
                fontWeight: 600,
                lineHeight: 1.5,
              }}
            >
              💬 <strong>Private Contact Notice:</strong> Your phone number, LINE ID, and grade level stay private. When you choose a matched tutor, these contact channels are shared with that tutor so you can easily message them and schedule lessons directly.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Account Email (Read-only) */}
              <div style={{ maxWidth: '480px' }}>
                <InputField
                  label="Registered Email (Account Identity)"
                  id="accountEmail"
                  value={user?.email || profile?.email || ''}
                  disabled
                  helperText="Email is bound to your account login session and cannot be changed here."
                />
              </div>

              {/* Name Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <InputField
                  label="First Name *"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Pitchaya"
                  required
                />
                <InputField
                  label="Last Name *"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Siriwong"
                  required
                />
              </div>

              {/* Contact Channels Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <InputField
                  label="Mobile Phone Number *"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0812345678"
                  type="tel"
                  required
                />
                <InputField
                  label="LINE ID (Optional)"
                  id="lineId"
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  placeholder="e.g. pitchaya.s"
                />
              </div>

              {/* Grade Level & Tutor Type */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <SelectField
                  label="Current Grade Level (G1–G12) *"
                  id="gradeLevel"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  options={GRADE_OPTIONS}
                  required
                />
                <SelectField
                  label="Preferred Tutor Type"
                  id="tutorTypePref"
                  value={tutorTypePref}
                  onChange={(e) => setTutorTypePref(e.target.value as TutorTypePref)}
                  options={TUTOR_TYPE_PREF_OPTIONS}
                />
              </div>

              {/* Default Budget */}
              <div style={{ maxWidth: '320px' }}>
                <InputField
                  label="Default Target Budget (THB / hr) *"
                  id="budgetMax"
                  type="number"
                  min="100"
                  max="10000"
                  step="50"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value ? Number(e.target.value) : '')}
                  placeholder="500"
                  required
                />
              </div>
            </div>

            {/* Save Button */}
            <div
              style={{
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '2px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Button
                type="submit"
                variant="primary"
                disabled={isSaving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 800,
                  padding: '0.75rem 2rem',
                }}
              >
                <Save size={18} strokeWidth={2.4} />
                {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* TAB 2: 9 Learning Sliders */}
      {activeTab === 'sliders' && (
        <form onSubmit={handleSaveSliders}>
          <Card
            style={{
              padding: '2rem',
              backgroundColor: 'var(--bg-canvas)',
              border: '2px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '1rem' }}>
              <span
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-tint)',
                  color: 'var(--color-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sliders size={20} strokeWidth={2.4} />
              </span>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                  Learning Style &amp; Study Preferences
                </h2>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>
                  Adjust how you like to learn so our matching suggestions fit your exact pace, style, and study goals.
                </p>
              </div>
            </div>

            <StudentSliders
              styleProfile={styleProfile}
              personalityProfile={personalityProfile}
              onStyleChange={(idx, val) => {
                const updated = [...styleProfile];
                updated[idx] = val;
                setStyleProfile(updated);
              }}
              onPersonalityChange={(idx, val) => {
                const updated = [...personalityProfile];
                updated[idx] = val;
                setPersonalityProfile(updated);
              }}
            />

            {/* Save Button */}
            <div
              style={{
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '2px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Button
                type="submit"
                variant="primary"
                disabled={isSaving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 800,
                  padding: '0.75rem 2rem',
                }}
              >
                <Save size={18} strokeWidth={2.4} />
                {isSaving ? 'Saving Changes...' : 'Save Sliders'}
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* TAB 3: Weekly Schedule (Optional general availability) */}
      {activeTab === 'availability' && (
        <Card
          style={{
            padding: '2rem',
            backgroundColor: 'var(--bg-canvas)',
            border: '2px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '1rem' }}>
            <span
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-tint)',
                color: 'var(--color-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={20} strokeWidth={2.4} />
            </span>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                Weekly Study Schedule
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>
                Choose the days and hours you are generally free to study. These will automatically pre-fill when you search for tutors.
              </p>
            </div>
          </div>

          <StudentAvailabilityGrid
            value={availabilitySlots}
            onChange={setAvailabilitySlots}
            hideHeader={true}
            onSaveSuccess={() => {
              setSuccessMessage('Weekly study schedule saved successfully.');
              setErrorMessage(null);
            }}
          />
        </Card>
      )}

      {/* Red Unsaved Changes Warning Modal (Request 2) */}
      <Modal
        isOpen={isUnsavedModalOpen}
        onClose={() => setIsUnsavedModalOpen(false)}
        title="Unsaved Changes"
        variant="danger"
        primaryActionText={isSaving ? 'Saving...' : 'Save & Continue'}
        onPrimaryAction={handleSaveAndProceed}
        secondaryActionText="Discard Changes"
        onSecondaryAction={handleDiscardChanges}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#991b1b', fontSize: '0.9375rem' }}>
            You have unsaved changes in your {
              activeTab === 'profile'
                ? 'personal details'
                : activeTab === 'sliders'
                ? 'learning style preferences'
                : 'weekly study schedule'
            }.
          </p>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.55 }}>
            Would you like to save these changes to your profile before leaving this section, or discard them and revert to your previous settings?
          </p>
        </div>
      </Modal>
    </div>
  );
};
