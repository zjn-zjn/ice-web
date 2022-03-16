import React, { Component } from 'react';
import { FormComponentProps } from 'antd/es/form';
export interface JNFormProps extends FormComponentProps {
    wrappedComponentRef?: (form: any) => void;
    formData?: FormDataItem[];
    formProps?: object;
}
export interface FormDataItem {
    label: string;
    id: string;
    type: string;
    options?: object;
    props?: object;
    childData?: any[];
    prompt?: string;
    customComponent?: React.ReactNode;
    show?: boolean;
}
declare class JNForm extends Component<JNFormProps, any> {
    createFormItem: (formItem: FormDataItem, index: number) => false | JSX.Element;
    formItem: (type: string, props: object, childData: any[], customComponent: any) => any;
    render(): JSX.Element;
}
declare const _default: import("antd/lib/form/interface").ConnectedComponentClass<typeof JNForm, Pick<JNFormProps, "formData" | "wrappedComponentRef" | "formProps">>;
export default _default;
