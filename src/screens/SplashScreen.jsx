import { t } from "../i18n.js";

export default function SplashScreen({ lang, owner, leaving }) {
  return (
    <div className={`splash ${leaving ? "leaving" : ""}`}>
      <img src="/icon-512.png" alt="" className="splash-logo" width={104} height={104} />
      <h1>{t(lang, "appName")}</h1>
      <p>{owner ? `${t(lang, "hello")} ${owner} 👋` : t(lang, "tagline")}</p>
    </div>
  );
}
