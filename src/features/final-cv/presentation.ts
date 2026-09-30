import { FinalCvApiError } from "@/features/final-cv/browser-api";

export type FinalCvErrorPresentation = {
  title: string;
  description: string;
};

export function presentFinalCvError(error: unknown): FinalCvErrorPresentation {
  if (error instanceof FinalCvApiError) {
    if (error.code === "WORKFLOW_CONFLICT" || error.status === 409) {
      return {
        title: "The CV workflow needs attention",
        description:
          "The approved proposal set no longer matches the selected source CV. Refresh the application, confirm its latest review state and retry.",
      };
    }

    if (
      error.code === "SERVICE_UNAVAILABLE" ||
      error.code === "UPSTREAM_UNAVAILABLE" ||
      error.status === 502 ||
      error.status === 503
    ) {
      return {
        title: "Document generation is temporarily unavailable",
        description:
          "Your approved review is still saved and no CV was created. Check the CareerOps services, then retry the same request safely.",
      };
    }

    if (error.status === 401 || error.status === 403) {
      return {
        title: "Your CareerOps session cannot generate this CV",
        description:
          "No CV was created. Restore the authenticated session before retrying.",
      };
    }
  }

  return {
    title: "The final CV could not be confirmed",
    description:
      "No application was submitted and no download should be assumed complete. Refresh the workflow before retrying safely.",
  };
}
