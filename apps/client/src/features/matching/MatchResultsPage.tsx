import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isAxiosError } from 'axios';
import type { ApiResponse, ConfirmSelectionResultDto, MatchRecommendationDto, MatchResultDto } from '@tutorpair/shared';
import { apiClient } from '../../services/api-client';
import { Button, Card, Modal } from '../../components/ui';

export function MatchResultsPage() {
  const location = useLocation();
  const result = (location.state as { result?: MatchResultDto } | null)?.result;
  const [chosen, setChosen] = useState<MatchRecommendationDto | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!result) return <Card><h1>Find your tutor</h1><p>Start a new search to see your tutor recommendations.</p><Link to="/student/matching/request">Find matched tutors</Link></Card>;
  async function confirm() {
    if (!chosen || !result || pending || confirmed) return;
    setPending(true); setError(null);
    try {
      const response = await apiClient.post<ApiResponse<ConfirmSelectionResultDto>>(`/api/matching/${result.match_request_id}/confirm`, {
        recommendation_id: chosen.recommendation_id, tutor_id: chosen.tutor.tutor_id,
      });
      if (!response.data.success || !response.data.data) throw new Error('Confirmation failed');
      setConfirmed(response.data.data.selected.tutor_id); setChosen(null);
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message || 'Could not confirm your selection. Please try again.' : 'Could not confirm your selection. Please try again.');
    } finally { setPending(false); }
  }
  return <div style={{ maxWidth: 960, margin: '0 auto' }}>
    <Link to="/student/matching/request">← Back to search</Link>
    <h1 style={{ margin: '24px 0 12px' }}>Your tutor recommendations</h1>
    <p style={{ marginBottom: 24 }}>Compare your matches and confirm one tutor. Your selected tutor will receive an in-app notification, with an email queued for delivery.</p>
    {confirmed && <Card style={{ background: 'var(--color-secondary-tint)', marginBottom: 24 }}><h2>Selection confirmed</h2><p role="status">Your tutor has been notified in TutorPair. Email delivery is processed separately.</p></Card>}
    {result.recommendations.length === 0 && <Card><h2>No matching tutors yet</h2><p>Try another subject or update your saved budget and availability.</p></Card>}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap: 20 }}>
      {result.recommendations.map(rec => <Card key={rec.recommendation_id}>
        <p style={{ color: '#047857', fontWeight: 700 }}>Match #{rec.rank}</p>
        <h2 style={{ margin: '12px 0' }}>{rec.tutor.first_name} {rec.tutor.last_name}</h2>
        <p>{rec.tutor.description || 'Verified TutorPair tutor'}</p>
        <p style={{ marginTop: 16 }}>฿{rec.tutor.hourly_rate} / hour</p>
        <p>{rec.tutor.review_count} reviews · {rec.tutor.average_rating} average rating</p>
        <Button style={{ marginTop: 20 }} disabled={!!confirmed || pending} onClick={() => { setError(null); setChosen(rec); }}>{confirmed === rec.tutor.tutor_id ? 'Confirmed' : 'Select tutor'}</Button>
      </Card>)}
    </div>
    <Modal isOpen={!!chosen} onClose={() => { if (!pending) setChosen(null); }} title="Confirm your tutor" primaryActionText={pending ? 'Confirming…' : 'Confirm tutor'} onPrimaryAction={() => void confirm()}>
      <p>Confirm {chosen?.tutor.first_name} as your tutor? You can select one tutor for this match request.</p>
      {error && <p role="alert" style={{ color: '#b91c1c', marginTop: 16 }}>{error}</p>}
    </Modal>
  </div>;
}
