interface MathJaxObject {
	startup: {
		ready: () => void;
		defaultReady: () => void;
	};
	typesetPromise: (elements: HTMLElement[]) => Promise<void>;
}

declare global {
	interface Window {
		MathJax: MathJaxObject;
	}
}

export {}; 