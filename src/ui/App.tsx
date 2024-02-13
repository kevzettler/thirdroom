import { lazy, Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { useFocusVisible } from "@react-aria/interactions";
import { serviceWorkerFile } from "virtual:vite-plugin-service-worker";
import * as Sentry from "@sentry/react";
import { Provider as JotaiProvider } from "jotai";

import "./App.css";
import "@fontsource/inter/variable.css";
import "@fontsource/noto-serif/latin.css";

import { SplashScreen } from "./views/components/splash-screen/SplashScreen";
import { PageNotFound } from "./views/components/page-not-found/PageNotFound";

const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);

window.onload = () => {
  if (navigator.serviceWorker) {
    navigator.serviceWorker.register(serviceWorkerFile, { type: "module" }).then((reg) => {
      console.log("Service worker is registered.");
    });
  }
};

function FocusOutlineManager() {
  const { isFocusVisible } = useFocusVisible();
  useEffect(() => {
    document.body.style.setProperty("--focus-outline", isFocusVisible ? "var(--tc-surface) solid 2px" : "none");
  }, [isFocusVisible]);
  return <></>;
}

const GLTFViewer = lazy(() => import("./views/gltf-viewer/GLTFViewer"));
const AssetPipeline = lazy(() => import("./views/asset-pipeline/AssetPipeline"));
const OfflineView = lazy(() => import("./OfflineScene"));

export function App() {
  return (
    <JotaiProvider>
      <FocusOutlineManager />
      <SentryRoutes>
        <Route
          path="/scene-preview"
          element={
            <Suspense fallback={<></>}>
              <GLTFViewer />
            </Suspense>
          }
        />
        <Route
          path="/viewer"
          element={
            <Suspense fallback={<SplashScreen />}>
              <GLTFViewer />
            </Suspense>
          }
        />
        <Route
          path="/"
          element={
            <Suspense fallback={<></>}>
              <OfflineView />
            </Suspense>
          }
        />
        <Route
          path="/pipeline"
          element={
            <Suspense fallback={<SplashScreen />}>
              <AssetPipeline />
            </Suspense>
          }
        />
        <Route path="*" element={<PageNotFound />} />
      </SentryRoutes>
    </JotaiProvider>
  );
}
