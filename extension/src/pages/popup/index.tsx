import ReactDOM from "react-dom/client";
import { Button } from "@/components/ui/button";

const Popup = () => {
	return (
		<div>
			<h1 className="text-3xl font-bold underline">Hello, Popup!</h1>
			<Button>Click me</Button>
		</div>
	);
};

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);
root.render(<Popup />);
