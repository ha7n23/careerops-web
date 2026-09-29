import { z } from "zod";

export const CV_ARTIFACT_FORMATS = ["docx", "pdf"] as const;

export const cvArtifactFormatSchema = z.enum(CV_ARTIFACT_FORMATS);
export const cvVersionIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

export const generateFinalCvRequestSchema = z.object({
  threadId: z.string().trim().min(1).max(64),
  sourceDocumentId: z.string().trim().min(1).max(128),
});

const cvArtifactMetadataSchema = z.object({
  artifactId: z.string().trim().min(1),
  artifactFormat: cvArtifactFormatSchema,
  sizeBytes: z.number().int().nonnegative(),
  sha256Hex: z.string().trim().min(1),
  verificationStatus: z.enum(["pending", "verified", "failed"]),
});

export const cvVersionMetadataSchema = z.object({
  cvVersionId: cvVersionIdSchema,
  cvId: z.string().trim().min(1),
  versionNumber: z.number().int().positive(),
  parentVersionId: cvVersionIdSchema.nullable(),
  status: z.enum(["assembled", "rendered", "verified"]),
  sourceDocumentId: z.string().trim().min(1),
  jobId: z.string().trim().min(1),
  threadId: z.string().trim().min(1),
  reviewStatus: z.enum([
    "not_requested",
    "pending",
    "approved",
    "edited",
    "rejected",
    "regeneration_requested",
  ]),
  templateId: z.string().trim().min(1),
  templateVersion: z.string().trim().min(1),
  workflowVersion: z.string().trim().min(1),
  artifacts: z.array(cvArtifactMetadataSchema),
});

export const finalCvVersionSchema = cvVersionMetadataSchema.extend({
  reusedExistingVersion: z.boolean(),
});

const module2CvArtifactMetadataSchema = z
  .object({
    artifact_id: z.string().trim().min(1),
    artifact_format: cvArtifactFormatSchema,
    size_bytes: z.number().int().nonnegative(),
    sha256_hex: z.string().trim().min(1),
    verification_status: z.enum(["pending", "verified", "failed"]),
  })
  .transform((artifact) => ({
    artifactId: artifact.artifact_id,
    artifactFormat: artifact.artifact_format,
    sizeBytes: artifact.size_bytes,
    sha256Hex: artifact.sha256_hex,
    verificationStatus: artifact.verification_status,
  }));

const module2CvVersionMetadataBaseSchema = z.object({
  cv_version_id: cvVersionIdSchema,
  cv_id: z.string().trim().min(1),
  version_number: z.number().int().positive(),
  parent_version_id: cvVersionIdSchema.nullable(),
  status: z.enum(["assembled", "rendered", "verified"]),
  source_document_id: z.string().trim().min(1),
  job_id: z.string().trim().min(1),
  thread_id: z.string().trim().min(1),
  review_status: z.enum([
    "not_requested",
    "pending",
    "approved",
    "edited",
    "rejected",
    "regeneration_requested",
  ]),
  template_id: z.string().trim().min(1),
  template_version: z.string().trim().min(1),
  workflow_version: z.string().trim().min(1),
  artifacts: z.array(module2CvArtifactMetadataSchema),
});

function toCvVersionMetadata(
  version: z.infer<typeof module2CvVersionMetadataBaseSchema>,
) {
  return cvVersionMetadataSchema.parse({
    cvVersionId: version.cv_version_id,
    cvId: version.cv_id,
    versionNumber: version.version_number,
    parentVersionId: version.parent_version_id,
    status: version.status,
    sourceDocumentId: version.source_document_id,
    jobId: version.job_id,
    threadId: version.thread_id,
    reviewStatus: version.review_status,
    templateId: version.template_id,
    templateVersion: version.template_version,
    workflowVersion: version.workflow_version,
    artifacts: version.artifacts,
  });
}

export const module2CvVersionMetadataSchema =
  module2CvVersionMetadataBaseSchema.transform(toCvVersionMetadata);

export const module2FinalCvVersionSchema = module2CvVersionMetadataBaseSchema
  .extend({ reused_existing_version: z.boolean() })
  .transform((version) =>
    finalCvVersionSchema.parse({
      ...toCvVersionMetadata(version),
      reusedExistingVersion: version.reused_existing_version,
    }),
  );

export type CvArtifactFormat = z.infer<typeof cvArtifactFormatSchema>;
export type CvVersionMetadata = z.infer<typeof cvVersionMetadataSchema>;
export type FinalCvVersion = z.infer<typeof finalCvVersionSchema>;
export type GenerateFinalCvRequest = z.infer<
  typeof generateFinalCvRequestSchema
>;
