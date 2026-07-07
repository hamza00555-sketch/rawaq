import RawaqLogo from "../components/RawaqLogo.jsx";
import { t } from "../i18n.js";

export default function SplashScreen({ lang, owner, leaving }) {
  return (
    <div className={`splash ${leaving ? "leaving" : ""}`}>
      <RawaqLogo size={92} />
      <h1>{t(lang, "appName")}</h1>
      <p>{owner ? `${t(lang, "hello")} ${owner} 👋` : t(lang, "tagline")}</p>
    </div>
  );
}
