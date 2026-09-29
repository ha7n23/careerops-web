import type {
  CvVersionMetadata,
  FinalCvVersion,
} from "@/features/final-cv/contracts";
import { cvVersionMetadataSchema } from "@/features/final-cv/contracts";

export const finalCvVersion: FinalCvVersion = {
  cvVersionId: "CVV-001",
  cvId: "CV-001",
  versionNumber: 1,
  parentVersionId: null,
  status: "verified",
  sourceDocumentId: "DOC-CV-001",
  jobId: "JOB-001",
  threadId: "THR-001",
  reviewStatus: "approved",
  templateId: "careerops-default",
  templateVersion: "1.0.0",
  workflowVersion: "1.0.0",
  reusedExistingVersion: false,
  artifacts: [
    {
      artifactId: "ART-DOCX-001",
      artifactFormat: "docx",
      sizeBytes: 12_288,
      sha256Hex: "a".repeat(64),
      verificationStatus: "verified",
    },
    {
      artifactId: "ART-PDF-001",
      artifactFormat: "pdf",
      sizeBytes: 8_192,
      sha256Hex: "b".repeat(64),
      verificationStatus: "verified",
    },
  ],
};

export const finalCvMetadata: CvVersionMetadata =
  cvVersionMetadataSchema.parse(finalCvVersion);

export const module2FinalCvVersion = {
  cv_version_id: "CVV-001",
  cv_id: "CV-001",
  version_number: 1,
  parent_version_id: null,
  status: "verified",
  source_document_id: "DOC-CV-001",
  job_id: "JOB-001",
  thread_id: "THR-001",
  review_status: "approved",
  template_id: "careerops-default",
  template_version: "1.0.0",
  workflow_version: "1.0.0",
  reused_existing_version: false,
  artifacts: [
    {
      artifact_id: "ART-DOCX-001",
      artifact_format: "docx",
      size_bytes: 12_288,
      sha256_hex: "a".repeat(64),
      verification_status: "verified",
    },
    {
      artifact_id: "ART-PDF-001",
      artifact_format: "pdf",
      size_bytes: 8_192,
      sha256_hex: "b".repeat(64),
      verification_status: "verified",
    },
  ],
} as const;
