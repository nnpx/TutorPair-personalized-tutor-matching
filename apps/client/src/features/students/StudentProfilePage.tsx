import React, { useState } from 'react';
import { Card, Alert, PageHeader, SaveButton } from '../../components/ui';
import { InputField, SelectField } from '../../components/forms';
import { useAuthStore } from '../../store/auth.store';
import { Phone, MessageSquare } from 'lucide-react';

const GRADE_OPTIONS = [
  { value: 'G1', label: 'Grade 1 (Primary)' },
  { value: 'G2', label: 'Grade 2 (Primary)' },
  { value: 'G3', label: 'Grade 3 (Primary)' },
  { value: 'G4', label: 'Grade 4 (Primary)' },
  { value: 'G5', label: 'Grade 5 (Primary)' },
  { value: 'G6', label: 'Grade 6 (Primary)' },
  { value: 'G7', label: 'Grade 7 (Lower Secondary)' },
  { value: 'G8', label: 'Grade 8 (Lower Secondary)' },
  { value: 'G9', label: 'Grade 9 (Lower Secondary)' },
  { value: 'G10', label: 'Grade 10 (Upper Secondary)' },
  { value: 'G11', label: 'Grade 11 (Upper Secondary)' },
  { value: 'G12', label: 'Grade 12 (Upper Secondary)' },
];

export const StudentProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [firstName, setFirstName] = useState('Napasorn');
  const [lastName, setLastName] = useState('Wongsuwan');
  const [phoneNumber, setPhoneNumber] = useState('0812345678');
  const [lineId, setLineId] = useState('@napasorn_w');
  const [gradeLevel, setGradeLevel] = useState('G10');
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Student Profile & Contact Details"
        description="Manage your personal information and contact channels for matched tutors."
      />

      {isSaved && (
        <Alert variant="success">
          Profile changes saved successfully!
        </Alert>
      )}

      <Card style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Account Email (Readonly) */}
          <InputField
            label="Account Email"
            type="email"
            value={user?.email || 'student@example.com'}
            disabled
            isLocked
          />

          {/* Name Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <InputField
              label="First Name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <InputField
              label="Last Name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          {/* Grade Level */}
          <SelectField
            label="Grade Level"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            options={GRADE_OPTIONS}
          />

          {/* Contact Details Header */}
          <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0 0 0.25rem 0' }}>
              Contact Channels
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>
              Matched tutors use these contact details to coordinate schedules and trial lessons.
            </p>
          </div>

          {/* Phone Number */}
          <InputField
            label="Phone Number"
            required
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g. 0812345678"
            leftIcon={<Phone size={16} />}
          />

          {/* LINE ID */}
          <InputField
            label="LINE ID"
            type="text"
            value={lineId}
            onChange={(e) => setLineId(e.target.value)}
            placeholder="e.g. @your_line_id"
            leftIcon={<MessageSquare size={16} />}
            helperText="Your LINE ID will only be shared with tutors you match with for direct lesson coordination."
          />

          {/* Save Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <SaveButton
              label="Save Profile Changes"
              fullWidth={false}
              style={{ padding: '0 2rem', height: '3.25rem', fontSize: '1rem' }}
            />
          </div>
        </form>
      </Card>
    </div>
  );
};
