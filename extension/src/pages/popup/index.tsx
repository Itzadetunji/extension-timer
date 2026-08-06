import ReactDOM from "react-dom/client";
import { PopupApp } from "@/components/popup/popup-app";
import "@/style.css";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);

root.render(<PopupApp />);
