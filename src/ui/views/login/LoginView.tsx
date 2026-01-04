import { FormEvent, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Text } from "../../atoms/text/Text";
import { Input } from "../../atoms/input/Input";
import { Button } from "../../atoms/button/Button";
import { Label } from "../../atoms/text/Label";
import { SettingTile } from "../components/setting-tile/SettingTile";
import { useAuth } from "../../hooks/useAuth";
import { Icon } from "../../atoms/icon/Icon";
import PlanetIC from "../../../../res/ic/planet.svg";
import { Dots } from "../../atoms/loading/Dots";
import { getMissingFeature, MissingFeature } from "../../utils/featureCheck";
import { MissingFeatureModal } from "./MissingFeatureModal";
import "./LoginView.css";
import { useIsMounted } from "../../hooks/useIsMounted";

export default function LoginView() {
  const { login, register, loading: authLoading, error: authError, user } = useAuth();
  const navigate = useNavigate();
  const [authenticating, setAuthenticating] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useIsMounted();

  const [missingFeatures, setMissingFeature] = useState<MissingFeature[]>([]);
  useEffect(() => {
    const run = async () => {
      const missingFeature = await getMissingFeature();
      if (!isMounted()) return;
      setMissingFeature(missingFeature);
    };
    run();
  }, [isMounted]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setAuthenticating(true);

    const form = event.currentTarget.elements as typeof event.currentTarget.elements & {
      username: HTMLInputElement;
      password: HTMLInputElement;
    };

    const username = form.username.value.trim();
    const password = form.password.value;

    if (!username || !password) {
      setError("Username and password are required");
      setAuthenticating(false);
      return;
    }

    try {
      if (isRegister) {
        await register(username, password);
      } else {
        await login(username, password);
      }
      // Navigation will happen via useEffect when user state updates
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setAuthenticating(false);
    }
  };

  if (missingFeatures.length > 0) return <MissingFeatureModal missingFeatures={missingFeatures} />;

  return (
    <div className="LoginView flex justify-center items-start">
      <div className="LoginView__card grow flex flex-column gap-xl">
        <div className="flex items-center gap-sm">
          <Icon src={PlanetIC} size="lg" />
          <Text variant="h2" weight="bold">
            Third Room
          </Text>
        </div>
        <form className="LoginView__form flex flex-column gap-md" onSubmit={handleSubmit}>
          <Text variant="s1" weight="bold">
            {isRegister ? "Create Account" : "Login"}
          </Text>
          <SettingTile
            label={
              <Label color="surface-low" htmlFor="username">
                Username
              </Label>
            }
          >
            <Input name="username" disabled={authenticating || authLoading} required autoFocus />
          </SettingTile>
          <SettingTile
            label={
              <Label color="surface-low" htmlFor="password">
                Password
              </Label>
            }
          >
            <Input name="password" type="password" disabled={authenticating || authLoading} required />
          </SettingTile>
          {(error || authError) && (
            <Text color="danger" variant="b2">
              {error || authError}
            </Text>
          )}
          <Button size="lg" variant="primary" type="submit" disabled={authenticating || authLoading}>
            {authenticating || authLoading ? <Dots color="on-primary" /> : isRegister ? "Register" : "Login"}
          </Button>
          <Button
            size="sm"
            variant="primary"
            fill="outline"
            type="button"
            disabled={authenticating || authLoading}
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
          >
            {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
          </Button>
        </form>
      </div>
    </div>
  );
}
