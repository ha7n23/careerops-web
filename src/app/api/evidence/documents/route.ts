import { createTextEvidenceRequestSchema } from "@/features/evidence/contracts";
import {
  createTextEvidenceSource,
  listEvidenceDocuments,
  uploadEvidenceDocument,
} from "@/features/evidence/server";
import {
  gatewayErrorResponse,
  privateNoStoreHeaders,
} from "@/integrations/careerops/route-errors";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_MEDIA_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function GET(): Promise<Response> {
  try {
    const documents = await listEvidenceDocuments();
    return Response.json(documents, { headers: privateNoStoreHeaders });
  } catch (error) {
    console.error("Failed to list CareerOps evidence documents.", error);
    return gatewayErrorResponse(
      error,
      "Evidence sources are temporarily unavailable.",
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.startsWith("multipart/form-data")) {
    return uploadDocument(request);
  }

  return createTextSource(request);
}

async function uploadDocument(request: Request): Promise<Response> {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return invalidEvidenceResponse(
      "Choose one PDF or DOCX file to use as evidence.",
    );
  }

  const file = formData.get("file");

  if (
    file === null ||
    typeof file === "string" ||
    file.size === 0 ||
    file.size > MAX_UPLOAD_BYTES ||
    !ALLOWED_MEDIA_TYPES.has(file.type)
  ) {
    return invalidEvidenceResponse(
      "Choose a non-empty PDF or DOCX file no larger than 5 MiB.",
    );
  }

  try {
    const document = await uploadEvidenceDocument(file);
    return Response.json(document, {
      status: 201,
      headers: privateNoStoreHeaders,
    });
  } catch (error) {
    console.error("Failed to upload a CareerOps evidence document.", error);
    return gatewayErrorResponse(
      error,
      "The evidence document could not be uploaded.",
    );
  }
}

async function createTextSource(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return invalidEvidenceResponse("Enter a title and evidence text.");
  }

  const parsedInput = createTextEvidenceRequestSchema.safeParse(body);

  if (!parsedInput.success) {
    return invalidEvidenceResponse("Enter a title and evidence text.");
  }

  try {
    const document = await createTextEvidenceSource(parsedInput.data);
    return Response.json(document, {
      status: 201,
      headers: privateNoStoreHeaders,
    });
  } catch (error) {
    console.error("Failed to create a CareerOps text evidence source.", error);
    return gatewayErrorResponse(
      error,
      "The evidence source could not be created.",
    );
  }
}

function invalidEvidenceResponse(message: string): Response {
  return Response.json(
    {
      error: {
        code: "INVALID_EVIDENCE_INPUT",
        message,
      },
    },
    { status: 400, headers: privateNoStoreHeaders },
  );
}
