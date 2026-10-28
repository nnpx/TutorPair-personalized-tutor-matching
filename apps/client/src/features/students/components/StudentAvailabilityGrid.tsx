import React, { useState, useEffect } from 'react';
import { DayOfWeek, type StudentAvailabilitySlotDto } from '@tutorpair/shared';
import { useStudentAvailability, useSetStudentAvailability } from '../hooks/useStudents';
import { Card, Button, Alert, SaveButton } from '../../../components/ui';
import { Plus, Trash2, Clock } from 'lucide-react';

const DAYS_ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

const PRESETS = [
  { label: 'Morning (09:00 - 12:00)', start: '09:00', end: '12:00' },
  { label: 'Afternoon (13:00 - 17:00)', start: '13:00', end: '17:00' },
  { label: 'Evening (18:00 - 21:00)', start: '18:00', end: '21:00' },
];

export interface StudentAvailabilityGridProps {
  value?: StudentAvailabilitySlotDto[];
  onChange?: (slots: StudentAvailabilitySlotDto[]) => void;
  showSaveButton?: boolean;
  onSaveSuccess?: () => void;
  hideHeader?: boolean;
}

export const StudentAvailabilityGrid: React.FC<StudentAvailabilityGridProps> = ({
  value,
  onChange,
  showSaveButton = true,
  onSaveSuccess,
  hideHeader = false,
}) => {
  const { data: serverSlots = [] } = useStudentAvailability();
  const setAvailabilityMutation = useSetStudentAvailability();

  const [internalSlots, setInternalSlots] = useState<StudentAvailabilitySlotDto[]>([]);
  const slots = value !== undefined ? value : internalSlots;

  const updateSlots = (newSlots: StudentAvailabilitySlotDto[]) => {
    if (value === undefined) {
      setInternalSlots(newSlots);
    }
    onChange?.(newSlots);
  };

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DayOfWeek.MONDAY);
  const [startTime, setStartTime] = useState<string>('17:00');
  const [endTime, setEndTime] = useState<string>('19:00');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync slots from server if not controlled by parent
  useEffect(() => {
    if (value === undefined && serverSlots && serverSlots.length > 0 && internalSlots.length === 0) {
      setInternalSlots(serverSlots);
    }
  }, [serverSlots, value, internalSlots.length]);

  // Add slot
  const handleAddSlot = () => {
    setErrorMsg(null);
    setSaveSuccess(false);

    if (startTime >= endTime) {
      setErrorMsg('Start time must be earlier than end time.');
      return;
    }

    // Check overlap on the same day
    const daySlots = slots.filter((s) => s.day_of_week === selectedDay);
    const hasOverlap = daySlots.some(
      (s) =>
        (startTime >= s.start_time && startTime < s.end_time) ||
        (endTime > s.start_time && endTime <= s.end_time) ||
        (startTime <= s.start_time && endTime >= s.end_time)
    );

    if (hasOverlap) {
      setErrorMsg(`This slot overlaps with an existing slot on ${selectedDay}.`);
      return;
    }

    updateSlots([...slots, { day_of_week: selectedDay, start_time: startTime, end_time: endTime }]);
  };

  const applyPreset = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
  };

  const handleRemoveSlot = (index: number) => {
    updateSlots(slots.filter((_, idx) => idx !== index));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setErrorMsg(null);
    setSaveSuccess(false);

    if (slots.length === 0) {
      setErrorMsg('Please add at least one available weekly time slot before saving.');
      return;
    }

    try {
      await setAvailabilityMutation.mutateAsync({
        availability: slots.map((s) => ({
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
        })),
      });
      setSaveSuccess(true);
      onSaveSuccess?.();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save availability schedule');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Description */}
      {!hideHeader && (
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
            Weekly Availability Schedule
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
            Select recurring time slots when you are available for tutoring lessons. These pre-fill your matching requests so you can pick specific times per session without re-entering your schedule.
          </p>
        </div>
      )}

      {/* Add Slot Control Card */}
      <Card style={{ padding: '1.5rem', backgroundColor: 'var(--color-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--fg-main)' }}>
            Add Time Slot
          </h4>

          {/* Day of Week Selector - 7 Day Pills (MON - SUN) */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {DAYS_ORDER.map((day) => {
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setSelectedDay(day);
                    setErrorMsg(null);
                  }}
                  style={{
                    padding: '0.625rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--bg-canvas)',
                    color: isSelected ? 'var(--color-white)' : 'var(--fg-main)',
                    border: isSelected ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#4b5563' }}>Quick Presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p.start, p.end)}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.3rem 0.625rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              alignItems: 'flex-end',
            }}
          >
            {/* Start Time */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.375rem', color: 'var(--fg-main)' }}>
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="flat-input"
                style={{ fontWeight: 700 }}
              />
            </div>

            {/* End Time */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.375rem', color: 'var(--fg-main)' }}>
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="flat-input"
                style={{ fontWeight: 700 }}
              />
            </div>

            {/* Add Button */}
            <Button
              type="button"
              variant="primary"
              onClick={handleAddSlot}
              style={{ height: '3rem' }}
            >
              <Plus size={18} strokeWidth={2.4} /> Add {selectedDay.slice(0, 3)} Slot
            </Button>
          </div>

          {errorMsg && <Alert variant="error" style={{ marginTop: '1rem' }}>{errorMsg}</Alert>}
          {saveSuccess && <Alert variant="success" style={{ marginTop: '1rem' }}>Availability schedule saved successfully.</Alert>}
        </div>
      </Card>

      {/* 7-Day Visual Overview Grid — Consistent with Tutor AvailabilityGrid */}
      <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
        Weekly Schedule Breakdown (7-Day Overview)
      </h4>

      <div style={{ overflowX: 'auto', width: '100%', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))', gap: '0.75rem', minWidth: '720px' }}>
          {DAYS_ORDER.map((day) => {
            const daySlots = slots
              .map((s, idx) => ({ ...s, originalIndex: idx }))
              .filter((s) => s.day_of_week === day)
              .sort((a, b) => a.start_time.localeCompare(b.start_time));

            return (
              <div
                key={day}
                style={{
                  backgroundColor: 'var(--color-muted)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--fg-main)', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.375rem' }}>
                  {day.slice(0, 3)}
                </div>

                {daySlots.length === 0 ? (
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic', padding: '0.5rem 0' }}>
                    Off day
                  </span>
                ) : (
                  daySlots.map((slot) => (
                    <div
                      key={`${slot.day_of_week}-${slot.start_time}-${slot.end_time}`}
                      style={{
                        backgroundColor: 'var(--bg-canvas)',
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--fg-main)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} strokeWidth={2.4} color="var(--color-primary)" />
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(slot.originalIndex)}
                        style={{ color: 'var(--color-danger)', cursor: 'pointer', padding: '0.1rem', background: 'none', border: 'none' }}
                        title="Delete slot"
                      >
                        <Trash2 size={12} strokeWidth={2.4} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      {showSaveButton && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <SaveButton
            label="Save Availability Schedule"
            isLoading={setAvailabilityMutation.isPending}
            onClick={handleSave}
            fullWidth={false}
            style={{ padding: '0 2rem', height: '3.25rem', fontSize: '1rem' }}
          />
        </div>
      )}
    </div>
  );
};
