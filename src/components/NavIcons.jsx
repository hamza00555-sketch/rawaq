import { press } from "../press.js";
import Icon from "./Icons.jsx";

export default function BottomNav({ tab, setTab, labels }) {
  const tabs = ["home", "today", "rooms", "settings"];
  return (
    <nav className="bottom-nav" aria-label="التنقل الرئيسي">
      {tabs.map((id) => (
        <button
          key={id}
          type="button"
          className={`nav-btn ${tab === id ? "active" : ""}`}
          aria-current={tab === id ? "page" : undefined}
          {...press(() => setTab(id))}
        >
          <Icon name={id} size={24} />
          <span>{labels[id]}</span>
        </button>
      ))}
    </nav>
  );
}
