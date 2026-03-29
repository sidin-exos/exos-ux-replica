import { useEffect } from "react";
import * as Sentry from "@sentry/react";
import { useUser } from "@/hooks/useUser";

export default function SentryUserSync() {
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      Sentry.setUser({ id: user.id, email: user.email });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  return null;
}
