import {
  inferAdditionalFields,
  organizationClient,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "@/lib/auth";
import { ac, organizationRoles } from "@/lib/permissions";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    usernameClient(),
    organizationClient({
      ac,
      roles: organizationRoles,
      teams: {
        enabled: true,
      },
    }),
  ],
});
