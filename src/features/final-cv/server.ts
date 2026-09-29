import "server-only";

import {
  module2CvVersionMetadataSchema,
  module2FinalCvVersionSchema,
  type CvArtifactFormat,
  type CvVersionMetadata,
  type FinalCvVersion,
  type GenerateFinalCvRequest,
} from "@/features/final-cv/contracts";
import { createCareerOpsGatewayClient } from "@/integrations/careerops/server-client";

const artifactMediaTypes = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
} as const;

export async function generateFinalCv(
  input: GenerateFinalCvRequest,
): Promise<FinalCvVersion> {
  return createCareerOpsGatewayClient().requestJson(
    "/api/v1/cv-versions",
    module2FinalCvVersionSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread_id: input.threadId,
        source_document_id: input.sourceDocumentId,
      }),
    },
  );
}

export async function getFinalCv(
  cvVersionId: string,
): Promise<CvVersionMetadata> {
  return createCareerOpsGatewayClient().requestJson(
    `/api/v1/cv-versions/${encodeURIComponent(cvVersionId)}`,
    module2CvVersionMetadataSchema,
  );
}

export async function downloadFinalCvArtifact(
  cvVersionId: string,
  artifactFormat: CvArtifactFormat,
): Promise<{ data: ArrayBuffer; mediaType: string }> {
  const response = await createCareerOpsGatewayClient().request(
    `/api/v1/cv-versions/${encodeURIComponent(cvVersionId)}/artifacts/${artifactFormat}`,
    { headers: { Accept: artifactMediaTypes[artifactFormat] } },
  );

  const mediaType = response.headers.get("content-type")?.split(";")[0];

  if (mediaType !== artifactMediaTypes[artifactFormat]) {
    throw new Error("CareerOps returned an unexpected CV artifact format.");
  }

  return { data: await response.arrayBuffer(), mediaType };
}
