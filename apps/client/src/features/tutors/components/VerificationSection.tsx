import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { VerificationStatus, DocumentType } from '@tutorpair/shared';
import {
  useTutorVerification,
  useUploadDocument,
  useDeleteDocument,
  useTutorSubjects,
} from '../hooks/useTutors';
import { Card, Alert, SaveButton } from '../../../components/ui';
import {
  ShieldCheck,
  Clock,
  XCircle,
  FileText,
  Award,
  GraduationCap,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { ConfiguredSubjectItem } from './SubjectSelector';

function getCleanFileName(fileKey: string, defaultName: string, index?: number): string {
  const extMatch = fileKey.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? `.${extMatch[1]}` : '.pdf';
  return index !== undefined ? `${defaultName}_${index + 1}${ext}` : `${defaultName}${ext}`;
}

export interface VerificationSectionRef {
  submitAll: () => Promise<{ success: boolean; error?: string }>;
  isUploading: boolean;
}

export interface VerificationSectionProps {
  configuredSubjects?: ConfiguredSubjectItem[];
  inOnboarding?: boolean;
}

export const VerificationSection = forwardRef<VerificationSectionRef, VerificationSectionProps>(({
  configuredSubjects: propsSubjects,
  inOnboarding = false,
}, ref) => {
  const { data: verificationData } = useTutorVerification();
  const { data: serverSubjects = [] } = useTutorSubjects();
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();

  // Combine subjects requiring proof
  const subjectsRequiringProof = propsSubjects
    ? propsSubjects.filter((s) => s.requires_proof)
    : serverSubjects.filter((s) => s.requires_proof);

  const status = verificationData?.verification_status ?? VerificationStatus.PENDING;
  const rejectionReason = verificationData?.rejection_reason;
  const docs = verificationData?.documents ?? [];

  // Categorize uploaded documents from DB
  const degreeDocs = docs.filter(
    (d) => d.document_type === DocumentType.DEGREE_TRANSCRIPT
  );
  const cvDocs = docs.filter((d) => d.document_type === DocumentType.CV);
  const cvCertificateDocs = docs.filter(
    (d) => d.document_type === DocumentType.SUBJECT_QUALIFICATION && !d.variant_id
  );

  // Staged local files (Option B: Selected locally first, batch-uploaded on submit)
  // Degree & CV are limited to 1 file max; Certs and Subject proofs allow multiple files
  const [stagedDegreeFile, setStagedDegreeFile] = useState<File | null>(null);
  const [stagedCvFile, setStagedCvFile] = useState<File | null>(null);
  const [stagedCertFiles, setStagedCertFiles] = useState<File[]>([]);
  const [stagedSubjectProofs, setStagedSubjectProofs] = useState<Record<string, File[]>>({});

  // Batch progress & feedback states
  const [isUploadingAll, setIsUploadingAll] = useState<boolean>(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const totalStagedCount =
    (stagedDegreeFile ? 1 : 0) +
    (stagedCvFile ? 1 : 0) +
    stagedCertFiles.length +
    Object.values(stagedSubjectProofs).reduce((acc, files) => acc + files.length, 0);

  const hasDegreeInDb = degreeDocs.length > 0;
  const hasCvInDb = cvDocs.length > 0;
  const hasCertInDb = cvCertificateDocs.length > 0;
  const allRequiredProofsInDb = subjectsRequiringProof.every((sub) =>
    docs.some((d) => d.variant_id === sub.variant_id)
  );

  // Profile is fully submitted when all required documents exist in the DB and no staged files are pending
  const isSubmissionComplete =
    hasDegreeInDb && hasCvInDb && hasCertInDb && allRequiredProofsInDb && totalStagedCount === 0;

  // Local File Selection Handlers (Degree & CV limited to 1 file each)
  const handleSelectDegree = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeedbackError(null);
    setSaveSuccess(false);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setFeedbackError('Degree file exceeds maximum size of 10MB.');
        return;
      }
      setStagedDegreeFile(file);
      e.target.value = '';
    }
  };

  const handleSelectCv = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeedbackError(null);
    setSaveSuccess(false);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setFeedbackError('CV file exceeds maximum size of 10MB.');
        return;
      }
      setStagedCvFile(file);
      e.target.value = '';
    }
  };

  const handleSelectCert = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeedbackError(null);
    setSaveSuccess(false);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setFeedbackError('Certificate file exceeds maximum size of 10MB.');
        return;
      }
      setStagedCertFiles((prev) => [...prev, file]);
      e.target.value = '';
    }
  };

  const handleSelectSubjectProof = (variantId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setFeedbackError(null);
    setSaveSuccess(false);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setFeedbackError('Subject proof file exceeds maximum size of 10MB.');
        return;
      }
      setStagedSubjectProofs((prev) => ({
        ...prev,
        [variantId]: [...(prev[variantId] || []), file],
      }));
      e.target.value = '';
    }
  };

  // Delete already submitted document from DB/S3 (No success message shown)
  const handleDeleteSubmittedDoc = async (documentId: string) => {
    setFeedbackError(null);
    setSaveSuccess(false);
    try {
      await deleteMutation.mutateAsync(documentId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete document';
      setFeedbackError(msg);
    }
  };

  // Batch Upload All Staged Documents (Option B)
  const handleBatchSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    setFeedbackError(null);

    // Verify all mandatory items will be satisfied
    const willHaveDegree = hasDegreeInDb || Boolean(stagedDegreeFile);
    const willHaveCv = hasCvInDb || Boolean(stagedCvFile);
    const willHaveCert = hasCertInDb || stagedCertFiles.length > 0;

    if (!willHaveDegree || !willHaveCv || !willHaveCert) {
      const err = 'Please select all mandatory documents (Degree / Academic Transcript, CV / Resume, and Supporting Certificates) before submitting.';
      setFeedbackError(err);
      return { success: false, error: err };
    }

    // Verify all subject proofs will be satisfied
    for (const sub of subjectsRequiringProof) {
      const hasUploadedProof = docs.some((d) => d.variant_id === sub.variant_id);
      const stagedFiles = stagedSubjectProofs[sub.variant_id] || [];
      if (!hasUploadedProof && stagedFiles.length === 0) {
        const err = `Please select an official proof document for "${sub.subject_name} — ${sub.variant_name}".`;
        setFeedbackError(err);
        return { success: false, error: err };
      }
    }

    if (totalStagedCount === 0) {
      return { success: true };
    }

    setIsUploadingAll(true);
    try {
      let completed = 0;

      // 1. Upload Degree if staged
      if (stagedDegreeFile) {
        completed += 1;
        setUploadProgressMsg(`Uploading Degree / Academic Transcript (${completed}/${totalStagedCount})...`);
        await uploadMutation.mutateAsync({
          file: stagedDegreeFile,
          documentType: DocumentType.DEGREE_TRANSCRIPT,
        });
      }

      // 2. Upload CV if staged
      if (stagedCvFile) {
        completed += 1;
        setUploadProgressMsg(`Uploading CV / Resume (${completed}/${totalStagedCount})...`);
        await uploadMutation.mutateAsync({
          file: stagedCvFile,
          documentType: DocumentType.CV,
        });
      }

      // 3. Upload Supporting Certs if staged
      for (const certFile of stagedCertFiles) {
        completed += 1;
        setUploadProgressMsg(`Uploading Supporting Certificate (${completed}/${totalStagedCount})...`);
        await uploadMutation.mutateAsync({
          file: certFile,
          documentType: DocumentType.SUBJECT_QUALIFICATION,
          variantId: null,
        });
      }

      // 4. Upload Subject Proofs if staged (multiple files per subject)
      for (const [variantId, proofFiles] of Object.entries(stagedSubjectProofs)) {
        for (const proofFile of proofFiles) {
          completed += 1;
          setUploadProgressMsg(`Uploading Subject Proof (${completed}/${totalStagedCount})...`);
          await uploadMutation.mutateAsync({
            file: proofFile,
            documentType: DocumentType.SUBJECT_QUALIFICATION,
            variantId,
          });
        }
      }

      // Reset local staged files
      setStagedDegreeFile(null);
      setStagedCvFile(null);
      setStagedCertFiles([]);
      setStagedSubjectProofs({});
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Batch upload failed. Please try again.';
      setFeedbackError(msg);
      return { success: false, error: msg };
    } finally {
      setIsUploadingAll(false);
      setUploadProgressMsg(null);
    }
  };

  useImperativeHandle(ref, () => ({
    submitAll: handleBatchSubmit,
    isUploading: isUploadingAll,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 1. Status Banner: Approved */}
      {status === VerificationStatus.APPROVED && (
        <div
          style={{
            backgroundColor: 'var(--color-secondary)',
            color: 'var(--color-white)',
            padding: '1.75rem 2rem',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <span
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={32} strokeWidth={2.4} />
          </span>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>🟢 Verified Tutor Profile</div>
            <p style={{ opacity: 0.95, fontSize: '0.9375rem', marginTop: '0.25rem' }}>
              Your credentials have been approved by the TutorPair administration team. Your profile is live in the matchmaking pool.
            </p>
          </div>
        </div>
      )}

      {/* Only show "Verification Pending Review" once all mandatory documents are fully submitted to DB and no draft files remain */}
      {status === VerificationStatus.PENDING && isSubmissionComplete && (
        <div
          style={{
            backgroundColor: 'var(--color-accent-tint)',
            border: '2px solid var(--color-accent)',
            color: 'var(--fg-main)',
            padding: '1.75rem 2rem',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <span
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-white)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={32} strokeWidth={2.4} />
          </span>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-accent)' }}>
              🟡 Verification Pending Review
            </div>
            <p style={{ fontSize: '0.9375rem', color: '#4b5563', marginTop: '0.25rem' }}>
              Your verification documents have been submitted and are in the administrator review queue. Reviews typically complete within 24–48 hours.
            </p>
          </div>
        </div>
      )}

      {/* Rejected Banner */}
      {status === VerificationStatus.REJECTED && (
        <div
          style={{
            backgroundColor: 'var(--color-danger-tint)',
            border: '2px solid var(--color-danger)',
            padding: '1.75rem 2rem',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          <span
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-danger)',
              color: 'var(--color-white)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <XCircle size={32} strokeWidth={2.4} />
          </span>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-danger)' }}>
              🔴 Verification Needs Attention
            </div>
            <p style={{ fontSize: '0.9375rem', color: '#4b5563', marginTop: '0.25rem' }}>
              The administrator requested adjustments or updated certificates before approving your profile.
            </p>
            {rejectionReason && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  color: 'var(--fg-main)',
                  borderLeft: '4px solid var(--color-danger)',
                }}
              >
                <strong>Admin Feedback:</strong> {rejectionReason}
              </div>
            )}
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Please remove any incorrect documents using the remove button below, select the corrected files, and re-submit.
            </p>
          </div>
        </div>
      )}

      {/* 2. Structured Upload Cards (All Blue Icons & Mandatory) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Card 1: Degree / Academic Transcript (1 File Max) */}
        <Card style={{ backgroundColor: 'var(--bg-canvas)', border: '2px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GraduationCap size={20} strokeWidth={2.4} />
            </span>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--fg-main)' }}>
                1. Degree / Academic Transcript
                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--color-danger)', textTransform: 'uppercase', fontWeight: 800 }}>
                  * Mandatory
                </span>
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                Official university graduation diploma or official academic transcript showing your enrolled major. (Max 1 file)
              </p>
            </div>
          </div>

          {/* Submitted Degree in DB */}
          {degreeDocs.map((doc) => {
            const fileName = getCleanFileName(doc.file_key, 'Degree_Transcript');
            return (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--color-muted)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '0.75rem',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} color="var(--color-primary)" />
                  <span style={{ fontWeight: 700 }}>{fileName}</span>
                  <span style={{ color: '#6b7280' }}>({doc.file_size_kb} KB)</span>
                  <span style={{ color: '#9ca3af', marginLeft: '0.5rem' }}>
                    Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSubmittedDoc(doc.id)}
                  style={{
                    color: 'var(--color-danger)',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: '0.25rem 0.5rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                  title="Remove and re-upload"
                >
                  <Trash2 size={14} strokeWidth={2.2} />
                  Remove
                </button>
              </div>
            );
          })}

          {/* Staged file waiting for submit */}
          {stagedDegreeFile && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-primary-tint)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '0.75rem',
                fontSize: '0.8125rem',
                border: '1px solid var(--color-primary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={16} color="var(--color-primary)" />
                <span style={{ fontWeight: 700, color: 'var(--color-primary-hover)' }}>
                  {stagedDegreeFile.name} ({Math.round(stagedDegreeFile.size / 1024)} KB)
                </span>
                <span style={{ color: '#6b7280', fontStyle: 'italic' }}>— Selected</span>
              </div>
              <button
                type="button"
                onClick={() => setStagedDegreeFile(null)}
                style={{
                  color: 'var(--color-danger)',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <X size={14} strokeWidth={2.4} />
                Cancel
              </button>
            </div>
          )}

          {/* File Picker: Only shown if no file exists in DB and no file is staged (1 file limit) */}
          {!hasDegreeInDb && !stagedDegreeFile && (
            <div style={{ marginTop: '0.75rem' }}>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleSelectDegree}
                className="flat-input"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
          )}
        </Card>

        {/* Card 2: CV / Resume (1 File Max) */}
        <Card style={{ backgroundColor: 'var(--bg-canvas)', border: '2px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={20} strokeWidth={2.4} />
            </span>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--fg-main)' }}>
                2. CV / Resume
                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--color-danger)', textTransform: 'uppercase', fontWeight: 800 }}>
                  * Mandatory
                </span>
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem' }}>
                A comprehensive resume detailing your educational history and tutoring track record. (Max 1 file)
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '0.25rem' }}>
                Note: Only this CV / Resume and your profile will be shown to students after they match with you. (Other uploaded documents are strictly confidential and used solely by administrators to verify your identity).
              </p>
            </div>
          </div>

          {/* Submitted CV in DB */}
          {cvDocs.map((doc) => {
            const fileName = getCleanFileName(doc.file_key, 'CV_Resume');
            return (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--color-muted)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '0.75rem',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} color="var(--color-primary)" />
                  <span style={{ fontWeight: 700 }}>{fileName}</span>
                  <span style={{ color: '#6b7280' }}>({doc.file_size_kb} KB)</span>
                  <span style={{ color: '#9ca3af', marginLeft: '0.5rem' }}>
                    Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSubmittedDoc(doc.id)}
                  style={{
                    color: 'var(--color-danger)',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: '0.25rem 0.5rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                  title="Remove and re-upload"
                >
                  <Trash2 size={14} strokeWidth={2.2} />
                  Remove
                </button>
              </div>
            );
          })}

          {/* Staged CV file waiting for submit */}
          {stagedCvFile && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-primary-tint)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '0.75rem',
                fontSize: '0.8125rem',
                border: '1px solid var(--color-primary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={16} color="var(--color-primary)" />
                <span style={{ fontWeight: 700, color: 'var(--color-primary-hover)' }}>
                  {stagedCvFile.name} ({Math.round(stagedCvFile.size / 1024)} KB)
                </span>
                <span style={{ color: '#6b7280', fontStyle: 'italic' }}>— Selected</span>
              </div>
              <button
                type="button"
                onClick={() => setStagedCvFile(null)}
                style={{
                  color: 'var(--color-danger)',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <X size={14} strokeWidth={2.4} />
                Cancel
              </button>
            </div>
          )}

          {/* File Picker: Only shown if no file exists in DB and no file is staged (1 file limit) */}
          {!hasCvInDb && !stagedCvFile && (
            <div style={{ marginTop: '0.75rem' }}>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleSelectCv}
                className="flat-input"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
          )}
        </Card>

        {/* Card 3: Supporting Certificates (All Blue Icon, Mandatory, Multiple Files Allowed) */}
        <Card style={{ backgroundColor: 'var(--bg-canvas)', border: '2px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award size={20} strokeWidth={2.4} />
            </span>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--fg-main)' }}>
                3. Supporting Certificates Mentioned in CV
                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--color-danger)', textTransform: 'uppercase', fontWeight: 800 }}>
                  * Mandatory
                </span>
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                Awards, teaching certifications, honor rolls, or workshops mentioned in your CV. (Multiple files allowed)
              </p>
            </div>
          </div>

          {/* Submitted Certificates in DB */}
          {cvCertificateDocs.map((doc, idx) => {
            const fileName = getCleanFileName(doc.file_key, 'Supporting_Certificate', idx);
            return (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--color-muted)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '0.75rem',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={16} color="var(--color-primary)" />
                  <span style={{ fontWeight: 700 }}>{fileName}</span>
                  <span style={{ color: '#6b7280' }}>({doc.file_size_kb} KB)</span>
                  <span style={{ color: '#9ca3af', marginLeft: '0.5rem' }}>
                    Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSubmittedDoc(doc.id)}
                  style={{
                    color: 'var(--color-danger)',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: '0.25rem 0.5rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                  title="Remove document"
                >
                  <Trash2 size={14} strokeWidth={2.2} />
                  Remove
                </button>
              </div>
            );
          })}

          {/* Staged certificate files */}
          {stagedCertFiles.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-primary-tint)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '0.75rem',
                fontSize: '0.8125rem',
                border: '1px solid var(--color-primary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={16} color="var(--color-primary)" />
                <span style={{ fontWeight: 700, color: 'var(--color-primary-hover)' }}>
                  {file.name} ({Math.round(file.size / 1024)} KB)
                </span>
                <span style={{ color: '#6b7280', fontStyle: 'italic' }}>— Selected</span>
              </div>
              <button
                type="button"
                onClick={() => setStagedCertFiles((prev) => prev.filter((_, i) => i !== idx))}
                style={{
                  color: 'var(--color-danger)',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <X size={14} strokeWidth={2.4} />
                Cancel
              </button>
            </div>
          ))}

          {/* File Picker: Always available for multiple files */}
          <div style={{ marginTop: '0.75rem' }}>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleSelectCert}
              className="flat-input"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
        </Card>

        {/* Card 4: Subject-Specific Proof Certificates (All Blue Icon, Multiple Files per Subject Allowed) */}
        {subjectsRequiringProof.length > 0 && (
          <Card style={{ backgroundColor: 'var(--bg-canvas)', border: '2px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <span
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={20} strokeWidth={2.4} />
              </span>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--fg-main)' }}>
                  4. Subject-Specific Proof Certificates
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--color-danger)', textTransform: 'uppercase', fontWeight: 800 }}>
                    * Mandatory
                  </span>
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                  Official score reports or qualification certificates for chosen subjects (e.g. IELTS report, SAT score report, Olympiad medal). (Multiple files per subject allowed)
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {subjectsRequiringProof.map((subject) => {
                const subjectDocs = docs.filter((d) => d.variant_id === subject.variant_id);
                const stagedFiles = stagedSubjectProofs[subject.variant_id] || [];

                return (
                  <div
                    key={subject.variant_id}
                    style={{
                      padding: '1.25rem',
                      backgroundColor: 'var(--color-muted)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: '4px solid var(--color-primary)',
                    }}
                  >
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--fg-main)' }}>
                        {subject.subject_name}
                      </span>
                      <span style={{ color: '#9ca3af', margin: '0 0.5rem' }}>•</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {subject.variant_name}
                      </span>
                    </div>

                    {/* Existing uploaded subject proofs in DB */}
                    {subjectDocs.map((doc, idx) => {
                      const fileName = getCleanFileName(doc.file_key, 'Subject_Proof', idx);
                      return (
                        <div
                          key={doc.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem 0.75rem',
                            backgroundColor: 'var(--bg-canvas)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '0.5rem',
                            fontSize: '0.75rem',
                          }}
                        >
                          <span style={{ fontWeight: 700 }}>{fileName}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ color: '#6b7280' }}>
                              {doc.file_size_kb} KB • {new Date(doc.uploaded_at).toLocaleDateString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubmittedDoc(doc.id)}
                              style={{
                                color: 'var(--color-danger)',
                                cursor: 'pointer',
                                background: 'none',
                                border: 'none',
                                fontWeight: 700,
                              }}
                              title="Remove proof"
                            >
                              <Trash2 size={13} strokeWidth={2.2} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Staged proofs for this subject */}
                    {stagedFiles.map((file, fIdx) => (
                      <div
                        key={`${file.name}-${fIdx}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'var(--color-primary-tint)',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: '0.5rem',
                          fontSize: '0.75rem',
                          border: '1px solid var(--color-primary)',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: 'var(--color-primary-hover)' }}>
                          {file.name} ({Math.round(file.size / 1024)} KB) — Selected
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setStagedSubjectProofs((prev) => ({
                              ...prev,
                              [subject.variant_id]: (prev[subject.variant_id] || []).filter((_, i) => i !== fIdx),
                            }))
                          }
                          style={{ color: 'var(--color-danger)', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 700 }}
                        >
                          <X size={14} strokeWidth={2.4} />
                        </button>
                      </div>
                    ))}

                    {/* File Picker: Always available for multiple proofs per subject */}
                    <div style={{ marginTop: '0.5rem' }}>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleSelectSubjectProof(subject.variant_id, e)}
                        className="flat-input"
                        style={{ width: '100%', padding: '0.4rem', backgroundColor: 'var(--bg-canvas)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Upload Progress Indicator (rendered when batch uploading) */}
      {uploadProgressMsg && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--color-primary-tint)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            fontWeight: 800,
            color: 'var(--color-primary)',
            fontSize: '0.9375rem',
          }}
        >
          {uploadProgressMsg}
        </div>
      )}

      {/* 5. Clean Action Area (Only rendered in standalone mode; hidden in onboarding stepper) */}
      {!inOnboarding && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          {saveSuccess && (
            <Alert variant="success">
              Verification documents updated successfully!
            </Alert>
          )}

          {feedbackError && (
            <Alert variant="error">
              {feedbackError}
            </Alert>
          )}

          <SaveButton
            type="button"
            isLoading={isUploadingAll}
            disabled={isUploadingAll}
            onClick={async () => {
              setFeedbackError(null);
              setSaveSuccess(false);
              const res = await handleBatchSubmit();
              if (res.success) {
                setSaveSuccess(true);
              }
            }}
            label="Save Document Changes"
          />
        </div>
      )}
    </div>
  );
});
