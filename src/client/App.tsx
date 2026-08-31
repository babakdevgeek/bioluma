import { Suspense, lazy, useEffect, useMemo } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router";
import { dirOf, isLang, type Lang } from "@/shared/types";
import { DictionaryProvider, useDictionary } from "./i18n/provider";
import { ShellLayout } from "./layout/ShellLayout";
import { BlogIndexPage } from "./pages/BlogIndexPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PostPage } from "./pages/PostPage";
import { detectDeviceTier } from "./lib/device";
import { useJourneyStore } from "./stores/journey";

const AdminApp = lazy(() => import("./admin/AdminApp"));

function languageFromPath(pathname: string): Lang {
  const first = pathname.split("/").filter(Boolean)[0];
  return isLang(first) ? first : "en";
}

function HtmlBridge() {
  const location = useLocation();
  const lang = languageFromPath(location.pathname);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dirOf(lang);
    document.body.dataset.lang = lang;
    useJourneyStore.getState().setDevice(detectDeviceTier());
  }, [lang]);

  return null;
}

function LocaleBoundary({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const lang = isLang(params.lang) ? params.lang : "en";
  const value = useMemo(() => ({ lang }), [lang]);
  return <DictionaryProvider value={value}>{children}</DictionaryProvider>;
}

function RootRedirect() {
  const { lang } = useDictionary();
  return <Navigate to={`/${lang}`} replace />;
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-orb" aria-hidden="true" />
      <p>loading the waterline</p>
    </div>
  );
}

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path=":lang" element={<ShellLayout />}>
        <Route index element={<HomePage />} />
        <Route path="blog" element={<BlogIndexPage />} />
        <Route path="blog/:slug" element={<PostPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  const location = useLocation();
  const lang = languageFromPath(location.pathname);

  return (
    <DictionaryProvider value={{ lang }}>
      <HtmlBridge />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <AdminApp />
              </Suspense>
            }
          />
          <Route
            path="/:lang/*"
            element={
              <LocaleBoundary>
                <PublicRoutes />
              </LocaleBoundary>
            }
          />
          <Route path="*" element={<PublicRoutes />} />
        </Routes>
      </Suspense>
    </DictionaryProvider>
  );
}
