"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const BillingWorkflowModule = ({ onSubmit, onCancel, isProcessing = false }) => {
    // Get today's date in YYYY-MM-DD format for HTML date inputs
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = (0, react_1.useState)({
        billingFrequency: 'All',
        startDate: today,
        endDate: today,
        outputFolder: './reports/billing',
        invoiceNumber: 1000,
    });
    const handleInputChange = (field, value) => {
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [field]: value })));
    };
    // Convert HTML date format (YYYY-MM-DD) to MM/DD/YYYY format expected by workflow
    const convertDateFormat = (htmlDate) => {
        if (!htmlDate)
            return '';
        const [year, month, day] = htmlDate.split('-');
        return `${month}/${day}/${year}`;
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        // Convert dates to expected format before submitting
        const submissionData = Object.assign(Object.assign({}, formData), { startDate: convertDateFormat(formData.startDate), endDate: convertDateFormat(formData.endDate) });
        onSubmit(submissionData);
    };
    return ((0, jsx_runtime_1.jsx)("div", Object.assign({ style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(3, 72, 110, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        } }, { children: (0, jsx_runtime_1.jsxs)("div", Object.assign({ style: {
                backgroundColor: 'var(--primary-white)',
                borderRadius: '15px',
                padding: '30px',
                boxShadow: 'var(--shadow-primary)',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
                border: `3px solid var(--primary-blue)`
            } }, { children: [(0, jsx_runtime_1.jsx)("h2", Object.assign({ style: {
                        margin: '0 0 20px 0',
                        color: 'var(--dark-navy)',
                        textAlign: 'center',
                        fontSize: '1.8rem',
                        fontWeight: 'bold'
                    } }, { children: "Create Billing Invoice" }), void 0), (0, jsx_runtime_1.jsxs)("form", Object.assign({ onSubmit: handleSubmit }, { children: [(0, jsx_runtime_1.jsxs)("div", Object.assign({ style: { marginBottom: '20px' } }, { children: [(0, jsx_runtime_1.jsx)("label", Object.assign({ style: {
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        color: 'var(--dark-navy)'
                                    } }, { children: "Billing Frequency:" }), void 0), (0, jsx_runtime_1.jsxs)("select", Object.assign({ value: formData.billingFrequency, onChange: (e) => handleInputChange('billingFrequency', e.target.value), style: {
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: `2px solid var(--primary-blue)`,
                                        fontSize: '1rem',
                                        backgroundColor: 'var(--primary-white)',
                                        color: 'var(--dark-navy)',
                                        outline: 'none'
                                    } }, { children: [(0, jsx_runtime_1.jsx)("option", Object.assign({ value: "All" }, { children: "All" }), void 0), (0, jsx_runtime_1.jsx)("option", Object.assign({ value: "Daily" }, { children: "Daily" }), void 0), (0, jsx_runtime_1.jsx)("option", Object.assign({ value: "Weekly" }, { children: "Weekly" }), void 0), (0, jsx_runtime_1.jsx)("option", Object.assign({ value: "Monthly" }, { children: "Monthly" }), void 0)] }), void 0)] }), void 0), (0, jsx_runtime_1.jsxs)("div", Object.assign({ style: { marginBottom: '20px' } }, { children: [(0, jsx_runtime_1.jsx)("label", Object.assign({ style: {
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        color: 'var(--dark-navy)'
                                    } }, { children: "Start Date:" }), void 0), (0, jsx_runtime_1.jsx)("input", { type: "date", value: formData.startDate, onChange: (e) => handleInputChange('startDate', e.target.value), style: {
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: `2px solid var(--primary-blue)`,
                                        fontSize: '1rem',
                                        backgroundColor: 'var(--primary-white)',
                                        color: 'var(--dark-navy)',
                                        outline: 'none'
                                    }, required: true }, void 0)] }), void 0), (0, jsx_runtime_1.jsxs)("div", Object.assign({ style: { marginBottom: '20px' } }, { children: [(0, jsx_runtime_1.jsx)("label", Object.assign({ style: {
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        color: 'var(--dark-navy)'
                                    } }, { children: "End Date:" }), void 0), (0, jsx_runtime_1.jsx)("input", { type: "date", value: formData.endDate, onChange: (e) => handleInputChange('endDate', e.target.value), style: {
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: `2px solid var(--primary-blue)`,
                                        fontSize: '1rem',
                                        backgroundColor: 'var(--primary-white)',
                                        color: 'var(--dark-navy)',
                                        outline: 'none'
                                    }, required: true }, void 0)] }), void 0), (0, jsx_runtime_1.jsxs)("div", Object.assign({ style: { marginBottom: '20px' } }, { children: [(0, jsx_runtime_1.jsx)("label", Object.assign({ style: {
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        color: 'var(--dark-navy)'
                                    } }, { children: "Output Folder:" }), void 0), (0, jsx_runtime_1.jsx)("input", { type: "text", value: formData.outputFolder, onChange: (e) => handleInputChange('outputFolder', e.target.value), style: {
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: `2px solid var(--primary-blue)`,
                                        fontSize: '1rem',
                                        backgroundColor: 'var(--primary-white)',
                                        color: 'var(--dark-navy)',
                                        outline: 'none'
                                    }, placeholder: "./reports/billing", required: true }, void 0)] }), void 0), (0, jsx_runtime_1.jsxs)("div", Object.assign({ style: { marginBottom: '30px' } }, { children: [(0, jsx_runtime_1.jsx)("label", Object.assign({ style: {
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        color: 'var(--dark-navy)'
                                    } }, { children: "Invoice Number:" }), void 0), (0, jsx_runtime_1.jsx)("input", { type: "number", value: formData.invoiceNumber, onChange: (e) => handleInputChange('invoiceNumber', parseInt(e.target.value) || 1000), style: {
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: `2px solid var(--primary-blue)`,
                                        fontSize: '1rem',
                                        backgroundColor: 'var(--primary-white)',
                                        color: 'var(--dark-navy)',
                                        outline: 'none'
                                    }, min: "1", required: true }, void 0)] }), void 0), (0, jsx_runtime_1.jsxs)("div", Object.assign({ style: {
                                display: 'flex',
                                gap: '15px',
                                justifyContent: 'flex-end'
                            } }, { children: [(0, jsx_runtime_1.jsx)("button", Object.assign({ type: "button", onClick: onCancel, disabled: isProcessing, style: {
                                        padding: '12px 24px',
                                        borderRadius: '8px',
                                        border: `2px solid var(--primary-blue)`,
                                        backgroundColor: 'var(--primary-white)',
                                        color: 'var(--primary-blue)',
                                        fontSize: '1rem',
                                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s ease',
                                        opacity: isProcessing ? 0.6 : 1
                                    }, onMouseOver: (e) => {
                                        if (!isProcessing) {
                                            e.currentTarget.style.backgroundColor = 'var(--light-blue)';
                                        }
                                    }, onMouseOut: (e) => {
                                        if (!isProcessing) {
                                            e.currentTarget.style.backgroundColor = 'var(--primary-white)';
                                        }
                                    } }, { children: "Cancel" }), void 0), (0, jsx_runtime_1.jsx)("button", Object.assign({ type: "submit", disabled: isProcessing, style: {
                                        padding: '12px 24px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: isProcessing ? 'var(--medium-blue)' : 'var(--primary-blue)',
                                        color: 'var(--primary-white)',
                                        fontSize: '1rem',
                                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s ease',
                                        opacity: isProcessing ? 0.8 : 1
                                    }, onMouseOver: (e) => {
                                        if (!isProcessing) {
                                            e.currentTarget.style.backgroundColor = 'var(--accent-teal)';
                                        }
                                    }, onMouseOut: (e) => {
                                        if (!isProcessing) {
                                            e.currentTarget.style.backgroundColor = 'var(--primary-blue)';
                                        }
                                    } }, { children: isProcessing ? 'Processing...' : 'Start' }), void 0)] }), void 0)] }), void 0)] }), void 0) }), void 0));
};
exports.default = BillingWorkflowModule;
//# sourceMappingURL=BillingWorkflowModule.js.map