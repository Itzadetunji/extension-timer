import ReactDOM from "react-dom/client";
import { PopupApp } from "@/components/popup/popup-app";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/style.css";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);

root.render(
	<TooltipProvider>
		<PopupApp />
	</TooltipProvider>,
);
