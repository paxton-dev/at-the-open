import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";
import { assertExternalServicesConfigured } from "@/lib/config";

const handlers = toNextJsHandler(auth);

export function GET(request: Request) {
  assertExternalServicesConfigured();
  return handlers.GET(request);
}

export function POST(request: Request) {
  assertExternalServicesConfigured();
  return handlers.POST(request);
}
