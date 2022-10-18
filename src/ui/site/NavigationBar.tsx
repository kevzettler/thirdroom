import { useNavigate } from "react-router-dom";

import { Button } from "../atoms/button/Button";
import { Text } from "../atoms/text/Text";
import LogoFullSVG from "../../../res/svg/logo-full.svg";
import "./NavigationBar.css";
import { isMobileDevice } from "../utils/common";

export function Logo() {
  return (
    <div className="inline-flex flex-column items-end gap-xxs">
      <Text variant="b3" weight="medium" className="uppercase">
        Crash Giants
      </Text>
    </div>
  );
}

export function NavigationBar() {
  const navigate = useNavigate();

  return (
    <nav className="NavigationBar shrink-0 flex items-center gap-lg">
      <div className="grow">
        <Logo />
      </div>
      <div className="flex items-center gap-lg">
        <a href="https://matrix.to/#/#thirdroom-dev:matrix.org" target="_blank">
          <Text variant="b2" weight="medium">
            Chat
          </Text>
        </a>
        <a href="https://twitter.com/CrashGiants" target="_blank">
          <Text variant="b2" weight="medium">
            Twitter
          </Text>
        </a>
        {!isMobileDevice() && <Button onClick={() => navigate("/login")}>Login</Button>}
      </div>
    </nav>
  );
}
