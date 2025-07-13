"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const BillingWorkflowModule_1 = __importDefault(require("./modules/BillingWorkflowModule"));
const App = () => {
    const [showBillingForm, setShowBillingForm] = (0, react_1.useState)(false);
    const [isProcessing, setIsProcessing] = (0, react_1.useState)(false);
    const [lastResult, setLastResult] = (0, react_1.useState)(null);
    const handleCreateBilling = () => {
        setShowBillingForm(true);
        setLastResult(null); // Clear previous results
    };
    const handleBillingSubmit = (data) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Billing workflow data:', data);
        setIsProcessing(true);
        try {
            const result = yield window.electronAPI.billingWorkflow.execute(data);
            setLastResult(result);
            console.log('Billing workflow result:', result);
            // Always close the form after getting a result (success or failure)
            setShowBillingForm(false);
        }
        catch (error) {
            console.error('Failed to execute billing workflow:', error);
            setLastResult({
                success: false,
                message: `Failed to execute billing workflow: ${error}`
            });
            // Close form even on catch error
            setShowBillingForm(false);
        }
        finally {
            setIsProcessing(false);
        }
    });
    const handleBillingCancel = () => {
        setShowBillingForm(false);
        setLastResult(null);
    };
    // Function to detect and make folder paths clickable
    const renderMessageWithClickablePaths = (message) => {
        // Enhance error messages for better user experience
        let enhancedMessage = message;
        if (message.includes('EBUSY') && message.includes('resource busy or locked')) {
            enhancedMessage = message + '\n\n💡 This usually means the file is open in Excel or another program. Please close the file and try again.';
        }
        else if (message.includes('ENOENT')) {
            enhancedMessage = message + '\n\n💡 This means a required file was not found. Please check that all mapping files exist.';
        }
        else if (message.includes('authenticate') || message.includes('credentials')) {
            enhancedMessage = message + '\n\n💡 Please check your RouteGenie credentials in the .env file.';
        }
        // Find all path matches first
        const pathMatches = [];
        // Regex patterns for different types of paths
        const patterns = [
            /[A-Za-z]:[\\\/][\w\s\\\/.-]+/g,
            /\.\/[\w\\\/.-]+(?:\/[\w\\\/.-]+)*/g,
            /\.\\[\w\\\/.-]+(?:\\[\w\\\/.-]+)*/g // Relative paths starting with .\
        ];
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(enhancedMessage)) !== null) {
                const matchText = match[0];
                // Exclude matches that are clearly not file paths
                if (!matchText.includes(' Please ') &&
                    !matchText.includes(' This ') &&
                    !matchText.includes(' close ') &&
                    !matchText.includes(' try ') &&
                    !matchText.endsWith(' again') &&
                    matchText.length > 3) {
                    pathMatches.push({
                        match: matchText,
                        start: match.index,
                        end: match.index + matchText.length
                    });
                }
            }
        });
        // Sort matches by position (descending) to process from end to beginning
        pathMatches.sort((a, b) => b.start - a.start);
        // Build result by processing the message and wrapping paths
        const result = [];
        let lastIndex = enhancedMessage.length;
        pathMatches.forEach((pathMatch, index) => {
            // Add text after this match
            if (lastIndex > pathMatch.end) {
                result.unshift(enhancedMessage.substring(pathMatch.end, lastIndex));
            }
            // Add the clickable path
            result.unshift((0, jsx_runtime_1.jsx)("span", Object.assign({ onClick: () => handleOpenFolder(pathMatch.match), style: {
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    color: 'inherit',
                    fontWeight: 'bold'
                }, title: "Click to open in File Explorer" }, { children: pathMatch.match }), `path-${index}`));
            lastIndex = pathMatch.start;
        });
        // Add any remaining text at the beginning
        if (lastIndex > 0) {
            result.unshift(enhancedMessage.substring(0, lastIndex));
        }
        return result.length > 0 ? result : [enhancedMessage];
    };
    const handleOpenFolder = (folderPath) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield window.electronAPI.openFolder(folderPath);
        }
        catch (error) {
            console.error('Failed to open folder:', error);
        }
    });
    const handleOpenLogFolder = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield window.electronAPI.openLogFolder();
        }
        catch (error) {
            console.error('Failed to open log folder:', error);
        }
    });
    const handleOpenMileageCacheFolder = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield window.electronAPI.openMileageCacheFolder();
        }
        catch (error) {
            console.error('Failed to open mileage cache folder:', error);
        }
    });
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", Object.assign({ style: {
                    padding: '40px',
                    textAlign: 'center',
                    fontFamily: 'Arial, sans-serif',
                    background: 'var(--dark-navy)',
                    borderRadius: '15px',
                    boxShadow: 'var(--shadow-primary)',
                    maxWidth: '600px',
                    margin: '0 auto',
                    minHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    border: `2px solid var(--primary-blue)`
                } }, { children: [(0, jsx_runtime_1.jsx)("h1", Object.assign({ style: {
                            color: 'var(--primary-white)',
                            fontSize: '3rem',
                            margin: '0 0 20px 0',
                            textShadow: `2px 2px 4px var(--dark-navy)`
                        } }, { children: "Lakeshore Invoicer" }), void 0), (0, jsx_runtime_1.jsx)("p", Object.assign({ style: {
                            color: 'var(--primary-white)',
                            fontSize: '1.2rem',
                            marginBottom: '40px',
                            opacity: '0.9'
                        } }, { children: "Transportation invoicing application" }), void 0), (0, jsx_runtime_1.jsx)("button", Object.assign({ onClick: handleCreateBilling, style: {
                            padding: '15px 30px',
                            borderRadius: '8px',
                            border: `2px solid var(--primary-blue)`,
                            backgroundColor: 'var(--primary-blue)',
                            color: 'var(--primary-white)',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-light)',
                            transition: 'all 0.2s ease',
                            fontWeight: 'bold'
                        }, onMouseOver: (e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.backgroundColor = 'var(--accent-teal)';
                        }, onMouseOut: (e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.backgroundColor = 'var(--primary-blue)';
                        } }, { children: "Create Billing Invoice" }), void 0), (0, jsx_runtime_1.jsxs)("div", Object.assign({ style: {
                            marginTop: '30px',
                            padding: '15px',
                            backgroundColor: 'var(--primary-white)',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            border: `1px solid var(--primary-blue)`,
                            color: 'var(--dark-navy)',
                        } }, { children: ["\uD83D\uDE9B Ready to process transportation billing", (0, jsx_runtime_1.jsx)("br", {}, void 0), (0, jsx_runtime_1.jsxs)("div", Object.assign({ style: { marginTop: '8px', display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' } }, { children: [(0, jsx_runtime_1.jsx)("span", Object.assign({ onClick: handleOpenLogFolder, style: {
                                            textDecoration: 'underline',
                                            cursor: 'pointer',
                                            color: 'var(--primary-blue)',
                                            fontSize: '0.8rem'
                                        }, title: "Click to open log folder" }, { children: "\uD83D\uDCC1 View Application Logs" }), void 0), (0, jsx_runtime_1.jsx)("span", Object.assign({ onClick: handleOpenMileageCacheFolder, style: {
                                            textDecoration: 'underline',
                                            cursor: 'pointer',
                                            color: 'var(--primary-blue)',
                                            fontSize: '0.8rem'
                                        }, title: "Click to open mileage cache database folder" }, { children: "\uFFFD\uFE0F View Mileage Cache DB" }), void 0)] }), void 0)] }), void 0), lastResult && ((0, jsx_runtime_1.jsxs)("div", Object.assign({ style: {
                            marginTop: '20px',
                            padding: '15px',
                            backgroundColor: lastResult.success ? '#d4edda' : '#f8d7da',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            border: `1px solid ${lastResult.success ? '#c3e6cb' : '#f5c6cb'}`,
                            color: lastResult.success ? '#155724' : '#721c24',
                            whiteSpace: 'pre-line' // Allow line breaks to render properly
                        } }, { children: [(0, jsx_runtime_1.jsx)("strong", { children: lastResult.success ? '✅ Success:' : '❌ Error:' }, void 0), (0, jsx_runtime_1.jsx)("br", {}, void 0), renderMessageWithClickablePaths(lastResult.message)] }), void 0))] }), void 0), showBillingForm && ((0, jsx_runtime_1.jsx)(BillingWorkflowModule_1.default, { onSubmit: handleBillingSubmit, onCancel: handleBillingCancel, isProcessing: isProcessing }, void 0))] }, void 0));
};
exports.default = App;
//# sourceMappingURL=App.js.map