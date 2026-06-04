import { useState } from "react";
import { FirebaseError } from "firebase/app";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from "@/lib/auth";
import { UI_TEXT, getBrowserLocale } from "@/i18n";

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: "login" | "register";
  onSuccess?: () => void;
};

export default function AuthDialog({
  open,
  onOpenChange,
  initialMode = "login",
  onSuccess,
}: AuthDialogProps) {
  const locale = getBrowserLocale();
  const t = UI_TEXT[locale] as typeof UI_TEXT["en"];

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setEmail("");
      setPassword("");
      setError("");
      setMode(initialMode);
    }
    onOpenChange(nextOpen);
  }

  function getErrorMessage(err: unknown): string {
    if (err instanceof FirebaseError) {
      console.error("[AuthDialog] Firebase error:", err.code, err.message);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential" ||
        err.code === "auth/invalid-login-credentials"
      ) {
        return t.authErrorInvalidCredentials;
      }
      if (err.code === "auth/email-already-in-use") {
        return t.authErrorEmailInUse;
      }
      if (err.code === "auth/weak-password") {
        return t.authErrorWeakPassword;
      }
      if (err.code === "auth/invalid-email") {
        return t.authErrorInvalidEmail;
      }
      if (err.code === "auth/operation-not-allowed") {
        return t.authErrorProviderDisabled;
      }
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        return "";
      }
    } else {
      console.error("[AuthDialog] Unknown error:", err);
    }
    return t.authErrorGeneric;
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      handleOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);

    try {
      await signInWithGoogle();
      handleOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const title = mode === "login" ? t.authSignInTitle : t.authSignUpTitle;
  const submitLabel = mode === "login" ? t.signIn : t.signUp;
  const switchLabel =
    mode === "login" ? t.authSwitchToRegister : t.authSwitchToLogin;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t.authSavePromptDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            {t.authGoogleSignIn}
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
            <Input
              type="email"
              placeholder={t.authEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder={t.authPassword}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </form>

          <button
            type="button"
            className="text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {switchLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
