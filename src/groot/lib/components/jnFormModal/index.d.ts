import { Component } from 'react';
export interface JNFormModalProps {
    formData: any[];
    visible: boolean;
    cancel: () => void;
    confirm: (values?: any) => void;
    title?: string;
    cancelText?: string;
    okText?: string;
    maskClosable?: boolean;
    width?: number;
    className?: string;
    refForm?: (form: any) => void;
    readOnly?:boolean
}
declare class JNFormModal extends Component<JNFormModalProps, any> {
    static defaultProps: {
        maskClosable: boolean;
        width: number;
    };
    form: any;
    handleOk: () => void;
    handleCancel: () => void;
    render(): JSX.Element;
}
export default JNFormModal;
export {JNFormModal}


