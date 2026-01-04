import { useCallback, useEffect, useState } from "react";
import classNames from "classnames";
import { useAtom, useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";

import { Text } from "../../../atoms/text/Text";
import { useKeyDown } from "../../../hooks/useKeyDown";
import { useEvent } from "../../../hooks/useEvent";
import "./WorldView.css";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { getModule, registerMessageHandler, Thread } from "../../../../engine/module/module.common";
import { useToast } from "../../../hooks/useToast";
import { MainContext } from "../../../../engine/MainThread";
import { createDisposables } from "../../../../engine/utils/createDisposables";
import { useWebXRSession } from "../../../hooks/useWebXRSession";
import { worldChatVisibilityAtom } from "../../../state/worldChatVisibility";
import { overlayVisibilityAtom } from "../../../state/overlayVisibility";
import { worldAtom } from "../../../state/world";
import { PlayerModule } from "../../../../engine/player/Player.main";
import { HotbarControls } from "./WorldControls";
import { WorldInteraction } from "./WorldInteraction";
import { inputFocused } from "../../../utils/common";
import { useDisableInput } from "../../../hooks/useDisableInput";
import { editorEnabledAtom } from "../../../state/editor";
import { ObjectCapReachedMessage, ThirdRoomMessageType } from "../../../../plugins/thirdroom/thirdroom.common";
import { World } from "../../../../client/world-client";
import { IconButton } from "../../../atoms/button/IconButton";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";
import HelpIC from "../../../../../res/ic/help.svg";
import SubtitlesIC from "../../../../../res/ic/subtitles.svg";
import SubtitlesOffIC from "../../../../../res/ic/subtitles-off.svg";
import CallCrossIC from "../../../../../res/ic/call-cross.svg";
import CrossIC from "../../../../../res/ic/cross.svg";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { Dialog } from "../../../atoms/dialog/Dialog";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { ShortcutUI } from "./ShortcutUI";
import { NametagsEnableMessage, NametagsEnableMessageType } from "../../../../engine/player/nametags.common";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { EditorView } from "../editor/EditorView";

const SHOW_NAMES_STORE = "showNames";

interface SimpleWorldViewProps {
  world: World;
}

// Simplified WorldControls for backend-auth mode (no Matrix)
function SimpleWorldControls({
  className,
  showToast,
  showNames,
  setShowNames,
}: {
  className?: string;
  showToast: (text: string) => void;
  showNames: boolean;
  setShowNames: (value: boolean) => void;
}) {
  const mainThread = useMainThreadContext();
  const navigate = useNavigate();
  const [shortcutUI, setShortcutUI] = useState(false);

  const toggleShortcutUI = useCallback(() => setShortcutUI((state) => !state), []);
  
  const toggleShowNames = useCallback(() => {
    const enabled = !showNames;
    setShowNames(enabled);
    mainThread.sendMessage<NametagsEnableMessageType>(Thread.Game, { type: NametagsEnableMessage, enabled });
    showToast(enabled ? "Show Names" : "Hide Names");
  }, [mainThread, showNames, setShowNames, showToast]);

  useEffect(() => {
    mainThread.sendMessage<NametagsEnableMessageType>(Thread.Game, {
      type: NametagsEnableMessage,
      enabled: showNames,
    });
  }, [mainThread, showNames]);

  const handleExitWorld = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // Keyboard shortcuts for controls
  useKeyDown(
    (e) => {
      if (inputFocused()) return;
      
      // Alt + L to exit world
      if (e.altKey && e.code === "KeyL") {
        handleExitWorld();
        return;
      }
      
      // / key to toggle help dialog
      if (e.key === "/" || e.code === "Slash") {
        e.preventDefault();
        toggleShortcutUI();
        return;
      }
      
      // N key to toggle names
      if (e.code === "KeyN" && !e.altKey && !e.ctrlKey && !e.metaKey) {
        toggleShowNames();
        return;
      }
    },
    [handleExitWorld, toggleShortcutUI, toggleShowNames]
  );

  useDisableInput(shortcutUI);

  return (
    <div className={classNames(className, "flex")}>
      <div className="flex flex-column items-center">
        <Tooltip content={shortcutUI ? "Hide Help" : "Show Help"}>
          <IconButton variant="world" label="help" iconSrc={HelpIC} onClick={toggleShortcutUI} />
        </Tooltip>
        <Text variant="b3" color="world" weight="bold">
          /
        </Text>
        <Dialog open={shortcutUI} onOpenChange={setShortcutUI}>
          <Header
            left={<HeaderTitle size="lg">Controls</HeaderTitle>}
            right={<IconButton iconSrc={CrossIC} onClick={toggleShortcutUI} label="Close" />}
          />
          <div className="flex" style={{ height: "600px" }}>
            <Scroll type="hover">
              <ShortcutUI />
            </Scroll>
          </div>
        </Dialog>
      </div>
      <div className="flex flex-column items-center">
        <Tooltip content={showNames ? "Hide Names" : "Show Names"}>
          <IconButton
            variant="world"
            label="Toggle Names"
            iconSrc={showNames ? SubtitlesIC : SubtitlesOffIC}
            onClick={toggleShowNames}
          />
        </Tooltip>
        <Text variant="b3" color="world" weight="bold">
          N
        </Text>
      </div>
      <div className="flex flex-column items-center">
        <Tooltip content="Exit World">
          <IconButton variant="danger" label="Exit World" iconSrc={CallCrossIC} onClick={handleExitWorld} />
        </Tooltip>
        <Text variant="b3" color="world" weight="bold">
          Alt + L
        </Text>
      </div>
    </div>
  );
}

export function SimpleWorldView({ world }: SimpleWorldViewProps) {
  const mainThread = useMainThreadContext();
  const isWorldEntered = useAtomValue(worldAtom).entered;
  const [worldChatVisible, setWorldChatVisibility] = useAtom(worldChatVisibilityAtom);
  const [overlayVisible, setOverlayVisibility] = useAtom(overlayVisibilityAtom);
  const [editorEnabled, setEditorEnabled] = useAtom(editorEnabledAtom);
  const { toastShown, toastContent, showToast } = useToast();
  const camRigModule = getModule(mainThread, PlayerModule);
  const [showNames, setShowNames] = useLocalStorage(SHOW_NAMES_STORE, true);
  const { isPresenting } = useWebXRSession();

  useEffect(() => {
    const onObjectCapReached = (ctx: MainContext, message: ObjectCapReachedMessage) => {
      showToast("Maximum number of objects reached.");
    };

    const disposables = createDisposables([
      registerMessageHandler(mainThread, ThirdRoomMessageType.ObjectCapReached, onObjectCapReached),
    ]);
    return () => {
      disposables();
    };
  }, [mainThread, showToast]);

  useKeyDown(
    (e) => {
      if (e.key === "Escape" && camRigModule.orbiting) {
        return;
      }

      if (e.key === "Escape") {
        if (worldChatVisible) {
          mainThread.canvas?.requestPointerLock();
          setWorldChatVisibility(false);
          return;
        }

        if (inputFocused()) return;

        // Close editor on Escape
        if (editorEnabled) {
          mainThread.canvas?.requestPointerLock();
          setEditorEnabled(false);
          return;
        }

        if (overlayVisible) {
          mainThread.canvas?.requestPointerLock();
          setOverlayVisibility(false);
          return;
        } else {
          document.exitPointerLock();
          setOverlayVisibility(true);
          return;
        }
      }
      
      // Backtick (`) to toggle editor
      if (e.code === "Backquote" && !inputFocused()) {
        setEditorEnabled((enabled) => {
          if (!enabled) {
            showToast("Editor Enabled");
          }
          return !enabled;
        });
        return;
      }
    },
    [worldChatVisible, overlayVisible, editorEnabled, setEditorEnabled, showToast]
  );

  useEvent(
    "click",
    (e) => {
      if (isWorldEntered === false) return;

      if (!camRigModule.orbiting && !editorEnabled) mainThread.canvas?.requestPointerLock();

      if (worldChatVisible) setWorldChatVisibility(false);
      if (overlayVisible) setOverlayVisibility(false);
    },
    mainThread.canvas,
    [isWorldEntered, worldChatVisible, setWorldChatVisibility, overlayVisible, setOverlayVisibility, editorEnabled]
  );

  // Request pointer lock when world is entered
  useEffect(() => {
    if (isWorldEntered) {
      mainThread.canvas?.requestPointerLock();
    }
  }, [mainThread, isWorldEntered]);

  if (isPresenting) return null;

  return (
    <div className="WorldView">
      {!editorEnabled && (
        <>
          {!worldChatVisible && <HotbarControls />}
          <SimpleWorldControls
            className="WorldView__controls"
            showToast={showToast}
            showNames={showNames}
            setShowNames={setShowNames}
          />
        </>
      )}

      {/* Editor View - scene hierarchy and properties panel */}
      {editorEnabled && <EditorView />}

      {!overlayVisible && !editorEnabled && <WorldInteraction world={world} />}

      <div className="WorldView__toast-container">
        <div className={classNames("WorldView__toast", { "WorldView__toast--shown": toastShown })}>
          <Text variant="b2" color="world" weight="semi-bold">
            {toastContent}
          </Text>
        </div>
      </div>
    </div>
  );
}
