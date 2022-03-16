import React, { Component } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { FormDataItem } from '../JNForm';
import { TableProps } from 'antd/es/table';
import { FormComponentProps } from 'antd/es/form';
import './index.scss';
interface JNSearchTableProps extends RouteComponentProps {
    onSearch: (values: any) => void;
    searchFormData?: FormDataItem[];
    tableProps?: TableProps<any>;
    formProps?: FormComponentProps;
    renderChildComponent?: (values?: any, form?: any) => React.ReactNode;
    renderButton?: (form?: any) => React.ReactNode;
}
declare class JNSearchTable extends Component<JNSearchTableProps, any> {
    form: any;
    state: {
        pageId: number;
        pageSize: number;
    };
    componentDidMount(): void;
    search: () => void;
    paginationChange: (pageId: number, pageSize?: number | undefined) => void;
    searchValidate: () => void;
    resetSearch: () => void;
    render(): JSX.Element;
}
declare const _default: React.ComponentClass<Pick<JNSearchTableProps, "searchFormData" | "onSearch" | "tableProps" | "formProps" | "renderChildComponent" | "renderButton">, any> & import("react-router").WithRouterStatics<typeof JNSearchTable>;
export default _default;
