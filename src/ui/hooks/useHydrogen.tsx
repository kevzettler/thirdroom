import {
  Platform,
  Navigation,
  Client,
  Session,
  ILogger,
  URLRouter,
  Room,
  ILoginMethod,
} from "@thirdroom/hydrogen-view-sdk";
import { createContext, useContext } from "react";

export interface HydrogenContext {
  client: Client;
  navigation: Navigation;
  platform: Platform;
  session?: Session;
  profileRoom?: Room;
  logger: ILogger;
  urlRouter: URLRouter;
  login: (loginMethod: ILoginMethod) => Promise<void>;
  logout: () => Promise<void>;
}

export interface AuthenticatedHydrogenContext extends HydrogenContext {
  session: Session;
  profileRoom: Room;
}

export const HydrogenContext = createContext<HydrogenContext | undefined>(undefined);

export const HydrogenContextProvider = HydrogenContext.Provider;

export function useHydrogen(ensureAuth: true): AuthenticatedHydrogenContext;
export function useHydrogen(ensureAuth: false): HydrogenContext;
export function useHydrogen(ensureAuth?: boolean): HydrogenContext;
export function useHydrogen(ensureAuth = false): HydrogenContext | AuthenticatedHydrogenContext {
  const context = useContext(HydrogenContext);

  if (!context) {
    throw new Error("HydrogenContext not initialized");
  }

  // When using backend auth (no Matrix session), don't throw - just return context with undefined session
  // Components should handle the case where session is undefined
  if (ensureAuth && !context.session) {
    // Check if we're using backend auth instead
    const hasBackendAuth = localStorage.getItem("auth_token") !== null;
    if (!hasBackendAuth) {
      throw new Error("Must be authenticated to access authenticated hydrogen context");
    }
    // Return context anyway - session will be undefined but components should handle this
  }

  return context;
}
