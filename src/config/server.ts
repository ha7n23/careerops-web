import "server-only";

import { parseServerEnvironment } from "@/config/server-environment";

export const serverEnvironment = parseServerEnvironment(process.env);
