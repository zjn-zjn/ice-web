import React, { Component } from 'react';
import {/* message,*/ Button, /*Icon, Upload,Popover,*/ Modal,  DatePicker as DatePicker$1, Form, Radio, Checkbox, Input, InputNumber, /*Switch, Slider, Rate, TreeSelect, Transfer, Cascader, TimePicker,*/ Select, Row, Col, Table } from 'antd';
// import { SketchPicker } from 'react-color';
import moment from 'moment';
import { withRouter } from 'react-router-dom';
import qs from 'qs';

// class JNUpload extends Component {
//     constructor(props) {
//         super(props);
//         this.createDefaultFileList = (value) => {
//             const { maxLength } = this.props;
//             const fileItem = (v) => ({
//                 uid: v.url,
//                 name: '当前已上传文件',
//                 status: 'done',
//                 url: v.url,
//                 response: {
//                     ret: 0,
//                     data: [{ url: v.url }]
//                 }
//             });
//             if (maxLength === 1) {
//                 return [fileItem(value)];
//             }
//             else {
//                 return (value instanceof Array) && value.map((item) => fileItem(item));
//             }
//         };
//         this.handlePreview = (file) => {
//             this.setState({
//                 previewSrcUrl: file.url || file.response.data[0].url || file.thumbUrl,
//                 previewVisible: true,
//             });
//         };
//         this.handleCancel = () => {
//             this.setState({ previewVisible: false });
//         };
//         this.handleChange = ({ file, fileList }) => {
//             const { onChange, maxLength } = this.props;
//             const { status, name, response } = file;
//             this.setState({ fileList });
//             switch (status) {
//                 case 'uploading':
//                     break;
//                 case 'done':
//                     if (response.ret === 0) {
//                         message.success(`${name} 上传成功`);
//                         const url = response.data[0].url;
//                         const { origin_height = 0, origin_width = 0 } = response.data[0].processResult || {};
//                         const { dfsId, fileName, fileSize } = response.data[0];
//                         if (maxLength === 1) {
//                             if (onChange) {
//                                 onChange({ url, width: origin_width, height: origin_height, dfsId, fileName, fileSize });
//                             }
//                         }
//                         else {
//                             const urlArray = fileList.map((fileItem) => {
//                                 if (fileItem.status === 'done') {
//                                     const { origin_height: height = 0, origin_width: width = 0, } = fileItem.response.data[0].processResult || {};
//                                     const { dfsId, fileName, fileSize } = fileItem.response.data[0];
//                                     return { url: fileItem.response.data[0].url, width, height, dfsId, fileName, fileSize };
//                                 }
//                                 else {
//                                     return null;
//                                 }
//                             });
//                             if (onChange) {
//                                 onChange(urlArray);
//                             }
//                         }
//                     }
//                     else {
//                         message.error(`${name} 上传失败, ${response.msg}`);
//                     }
//                     break;
//                 case 'error':
//                     message.error(`${name} 上传失败`);
//                     break;
//                 case 'removed':
//                     if (maxLength === 1) {
//                         if (onChange) {
//                             onChange('');
//                         }
//                     }
//                     else {
//                         const urlArray = fileList.map((fileItem) => {
//                             if (fileItem.status === 'done') {
//                                 return { url: fileItem.response.data[0].url };
//                             }
//                             else {
//                                 return null;
//                             }
//                         });
//                         if (onChange) {
//                             onChange(urlArray);
//                         }
//                     }
//                     break;
//                 default:
//                     break;
//             }
//         };
//         this.previewFile = () => Promise.resolve('http://fdfs.xmcdn.com/group61/M07/27/96/wKgMZl0phm2iO_0FAAD98EWXkAg768.png');
//         const fileList = props.value ? this.createDefaultFileList(props.value) : [];
//         this.state = {
//             fileList,
//             previewVisible: false,
//             previewSrcUrl: '',
//         };
//     }
//     render() {
//         const { fileList, previewVisible, previewSrcUrl } = this.state;
//         const { maxLength = 1, type, listType, uploadButtonText, showUploadList, uploadProps, } = this.props;
//         const textUploadButton = React.createElement(Button, null,
//             React.createElement(Icon, { type: "upload" }),
//             React.createElement("span", { className: "jnupload-text" }, uploadButtonText));
//         const uploadButton = (listType === 'picture-card' ?
//             React.createElement("div", { className: "jnupload-button" },
//                 React.createElement(Icon, { type: "plus" }),
//                 React.createElement("div", { className: "jnupload-text" }, uploadButtonText))
//             :
//                 textUploadButton);
//         const previewFileProps = type !== 'picture' ? { previewFile: this.previewFile } : {};
//         return (React.createElement("div", { className: "jnupload-container" },
//             React.createElement(Upload, Object.assign({ action: type === 'file' ? '/general-management-admin/upload' : `/bgupload/dtres/backend/${type}/upload`, listType: listType, className: listType === 'picture-card' ? 'jnupload' : '', fileList: fileList, showUploadList: showUploadList, onPreview: this.handlePreview, onChange: this.handleChange }, previewFileProps, uploadProps), maxLength === 1 && !showUploadList ?
//                 textUploadButton
//                 : fileList.length >= maxLength ? null : uploadButton),
//             React.createElement(Modal, { visible: previewVisible, title: "\u9884\u89C8", footer: null, onCancel: this.handleCancel }, type === 'picture' ? (React.createElement("img", { style: { width: '100%' }, src: previewSrcUrl })) : (React.createElement("video", { style: { width: '100%' }, src: previewSrcUrl, controls: true })))));
//     }
// }
// JNUpload.defaultProps = {
//     maxLength: 1,
//     type: 'picture',
//     listType: 'picture-card',
//     uploadButtonText: '点击上传',
//     showUploadList: true,
// };

// class JNColorPicker extends Component {
//     constructor(props) {
//         super(props);
//         this.handleChangeComplete = (color) => {
//             const { onChange, type, disableAlpha } = this.props;
//             const selectedColor = type === 'hex' ? color.hex : color.rgb;
//             const value = type === 'hex' ? selectedColor : `rgb${!disableAlpha ? 'a' : ''}(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b}${!disableAlpha ? `, ${selectedColor.a}` : ''})`;
//             this.setState({ selectedColor, backgroundColor: value }, () => {
//                 if (onChange) {
//                     onChange(value);
//                 }
//             });
//         };
//         this.clear = (e) => {
//             e.stopPropagation();
//             const { onChange } = this.props;
//             this.setState({ selectedColor: '', backgroundColor: '' }, () => {
//                 if (onChange) {
//                     onChange('');
//                 }
//             });
//         };
//         const { value } = this.props;
//         this.state = {
//             selectedColor: value || '',
//             backgroundColor: value || '',
//         };
//     }
//     render() {
//         const { selectedColor, backgroundColor } = this.state;
//         const { disableAlpha } = this.props;
//         return (React.createElement(Popover, { content: React.createElement(SketchPicker, { disableAlpha: disableAlpha, color: selectedColor, onChangeComplete: this.handleChangeComplete }), trigger: "click", placement: "rightTop", overlayClassName: "jn-color-picker-popover" },
//             React.createElement("div", { className: "jn-color-picker" },
//                 React.createElement("div", { style: {
//                         backgroundColor,
//                         width: '100%',
//                         height: '100%',
//                     } }),
//                 selectedColor && React.createElement("div", { className: "clear-color", onClick: this.clear }, "\u6E05\u9664"))));
//     }
// }
// JNColorPicker.defaultProps = {
//     type: 'hex',
//     disableAlpha: true,
// };

const { RangePicker } = DatePicker$1;
class XMRangePicker extends Component {
    constructor() {
        super(...arguments);
        this.onChange = (dates) => {
            const { onChange } = this.props;
            if (onChange) {
                onChange([dates[0] && dates[0].valueOf(), dates[1] && dates[1].valueOf()]);
            }
        };
    }
    render() {
        const { value = [], pickerProps } = this.props;
        return (React.createElement(RangePicker, Object.assign({ allowClear: true, showToday: true, showTime: { format: 'HH:mm' }, format: "YYYY-MM-DD HH:mm", onChange: this.onChange, value: value[0] ? [moment(value[0]), moment(value[1])] : undefined }, pickerProps)));
    }
}

class JNDatePicker extends Component {
    constructor() {
        super(...arguments);
        this.onChange = (date) => {
            const { onChange } = this.props;
            if (onChange) {
                onChange(date && date.valueOf());
            }
        };
    }
    render() {
        const { value, pickerProps } = this.props;
        return (React.createElement(DatePicker$1, Object.assign({ allowClear: true, showToday: true, showTime: { format: 'HH:mm' }, format: "YYYY-MM-DD HH:mm", onChange: this.onChange, value: value && moment(value) }, pickerProps)));
    }
}

const { WeekPicker } = DatePicker$1;
class XMWeekPicker extends Component {
    constructor() {
        super(...arguments);
        this.onChange = (month) => {
            const { onChange } = this.props;
            if (onChange) {
                onChange(month && month.valueOf());
            }
        };
    }
    render() {
        const { value, pickerProps } = this.props;
        return (React.createElement(WeekPicker, Object.assign({ allowClear: true, format: "YYYY-wo", onChange: this.onChange, value: value && moment(value) }, pickerProps)));
    }
}

const { MonthPicker } = DatePicker$1;
class XMMonthPicker extends Component {
    constructor() {
        super(...arguments);
        this.onChange = (month) => {
            const { onChange } = this.props;
            if (onChange) {
                onChange(month && month.valueOf());
            }
        };
    }
    render() {
        const { value, pickerProps } = this.props;
        return (React.createElement(MonthPicker, Object.assign({ allowClear: true, format: "YYYY-MM", onChange: this.onChange, value: value && moment(value) }, pickerProps)));
    }
}

var JNDatePicker$1 = {
    RangePicker: XMRangePicker,
    DatePicker: JNDatePicker,
    WeekPicker: XMWeekPicker,
    MonthPicker: XMMonthPicker,
};

const FormItem = Form.Item;
const { Option } = Select;
const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;
const { RangePicker: RangePicker$1, DatePicker, MonthPicker: MonthPicker$1, WeekPicker: WeekPicker$1 } = JNDatePicker$1;
const { TextArea } = Input;
class JNForm extends Component {
    constructor() {
        super(...arguments);
        this.createFormItem = (formItem, index) => {
            const { label, id, options = {}, type, props = {}, childData = [], prompt, customComponent, show = true, } = formItem;
            const { getFieldDecorator } = this.props.form;
            return (show &&
                React.createElement(FormItem, { label: label, key: index },
                    getFieldDecorator(id, options)(this.formItem(type, props, childData, customComponent)),
                    prompt &&
                        React.createElement("span", { className: "ant-form-text", style: { lineHeight: '18px', color: '#999', fontSize: '12px' } }, prompt)));
        };
        this.formItem = (type, props, childData, customComponent) => {
            switch (type) {
                case 'input':
                    return React.createElement(Input, Object.assign({}, props));
                case 'number':
                    return React.createElement(InputNumber, Object.assign({}, props));
                case 'textArea':
                    return React.createElement(TextArea, Object.assign({}, props));
                // case 'switch':
                //     return React.createElement(Switch, Object.assign({}, props));
                // case 'slider':
                //     return React.createElement(Slider, Object.assign({}, props));
                // case 'rate':
                //     return React.createElement(Rate, Object.assign({}, props));
                // case 'treeSelect':
                //     return React.createElement(TreeSelect, Object.assign({}, props));
                // case 'transfer':
                //     return React.createElement(Transfer, Object.assign({}, props));
                // case 'upload':
                //     return React.createElement(JNUpload, Object.assign({}, props));
                // case 'color':
                //     return React.createElement(JNColorPicker, Object.assign({}, props));
                // case 'cascader':
                //     return React.createElement(Cascader, Object.assign({}, props));
                case 'datePicker':
                    return React.createElement(DatePicker, { pickerProps: props });
                case 'monthPicker':
                    return React.createElement(MonthPicker$1, { pickerProps: props });
                case 'rangePicker':
                    return React.createElement(RangePicker$1, { pickerProps: props });
                case 'weekPicker':
                    return React.createElement(WeekPicker$1, { pickerProps: props });
                // case 'timePicker':
                    // return React.createElement(TimePicker, Object.assign({}, props));
                case 'select':
                    return (React.createElement(Select, Object.assign({}, props), childData.map((item, index) => (React.createElement(Option, Object.assign({ key: index }, item.props), item.text)))));
                case 'radio':
                    return (React.createElement(RadioGroup, Object.assign({}, props), childData.map((item, index) => (React.createElement(Radio, Object.assign({ key: index }, item.props), item.text)))));
                case 'checkbox':
                    return (React.createElement(CheckboxGroup, Object.assign({}, props),
                        React.createElement(Row, null, childData.map((item, index) => (React.createElement(Col, { span: 8, key: index },
                            React.createElement(Checkbox, Object.assign({}, item.props), item.text)))))));
                case 'custom': // 自定义组件
                    return customComponent;
                default:
                    return null;
            }
        };
    }
    render() {
        const { formData = [], formProps } = this.props;
        return (React.createElement(Form, Object.assign({}, formProps), formData.map((data, index) => (this.createFormItem(data, index)))));
    }
}
var JNForm$1 = Form.create()(JNForm);

class JNFormModal extends Component {
    constructor() {
        super(...arguments);
        this.form = null;
        this.handleOk = () => {
            const { confirm } = this.props;
            this.form.validateFields((error, values) => {
                // console.log(values);
                if (!error) {
                    confirm(values);
                }
                else {
                    // console.log('表单校验出错', error);
                }
            });
        };
        this.handleCancel = () => {
            this.props.cancel();
        };
    }
    render() {
        const { visible, formData = [], title, cancelText, okText, width, maskClosable, className, refForm } = this.props;
        return (React.createElement(Modal, { className: className, visible: visible, title: title, cancelText: cancelText, okText: okText, onOk: this.handleOk, destroyOnClose: true, onCancel: this.handleCancel, maskClosable: maskClosable, width: width },
            React.createElement(JNForm$1, { formData: formData, wrappedComponentRef: (formRef) => {
                    if (refForm) {
                        refForm(formRef && formRef.props.form);
                    }
                    this.form = formRef && formRef.props.form;
                }, formProps: {
                    labelCol: { span: 6 },
                    wrapperCol: { span: 14 },
                } })));
    }
}
JNFormModal.defaultProps = {
    maskClosable: false,
    width: 600
};

// class JNPreview extends Component {
//     constructor() {
//         super(...arguments);
//         this.state = {
//             previewVisible: false,
//         };
//         this.openPreview = (e) => {
//             e.stopPropagation();
//             this.setState({ previewVisible: true });
//         };
//         this.handleCancel = () => this.setState({ previewVisible: false });
//     }
//     render() {
//         const { previewVisible } = this.state;
//         const { srcUrl, type, imgUrl, width, height } = this.props;
//         return (React.createElement(React.Fragment, null,
//             React.createElement("div", { className: "preview-content", style: { width, height } },
//                 React.createElement("div", { className: "preview-image" },
//                     React.createElement("img", { src: imgUrl, alt: "" })),
//                 React.createElement("div", { className: "preview-button", onClick: this.openPreview },
//                     React.createElement(Icon, { type: "eye", style: { fontSize: 24, color: '#fff' } }))),
//             React.createElement(Modal, { visible: previewVisible, title: "\u9884\u89C8", footer: null, onCancel: this.handleCancel, width: 600 },
//                 type === 'picture' && React.createElement("img", { style: { width: '100%' }, src: srcUrl }),
//                 type === 'video' && React.createElement("video", { style: { width: '100%' }, src: srcUrl, controls: true }))));
//     }
// }
// JNPreview.defaultProps = {
//     type: 'picture'
// };

class JNSearchTable extends Component {
    constructor() {
        super(...arguments);
        this.form = null;
        this.state = {
            pageId: 1,
            pageSize: 20,
        };
        this.search = () => {
            const { history, onSearch } = this.props;
            history.replace({
                pathname: history.location.pathname,
                search: qs.stringify(this.state, { arrayFormat: 'repeat' }),
                state: history.location.state,
            });
            if (onSearch) {
                onSearch(Object.assign({}, this.state));
            }
        };
        this.paginationChange = (pageId, pageSize) => {
            this.setState({ pageId, pageSize }, () => {
                this.search();
            });
        };
        this.searchValidate = () => {
            this.form.validateFields((error, values) => {
                // console.log(values);
                if (!error) {
                    this.setState(Object.assign({}, values, { pageId: 1 }), () => {
                        this.search();
                    });
                }
                else {
                    console.log(error);
                }
            });
        };
        this.resetSearch = () => {
            this.form.resetFields();
        };
    }
    componentDidMount() {
        const { history } = this.props;
        const parameter = qs.parse(history.location.search.substring(1));
        this.setState(Object.assign({}, parameter), () => {
            this.search();
        });
    }
    render() {
        const { searchFormData, tableProps = {}, formProps, renderChildComponent, renderButton } = this.props;
        const { pageId, pageSize } = this.state;
        return (React.createElement(React.Fragment, null,
            searchFormData &&
                React.createElement("div", { className: "search-form" },
                    React.createElement(JNForm$1, { formData: searchFormData, wrappedComponentRef: (formRef) => this.form = formRef && formRef.props.form, formProps: Object.assign({ layout: 'inline' }, formProps) }),
                    React.createElement("div", { style: { minWidth: 250 } },
                        React.createElement(Button, { style: { marginRight: '10px' }, type: "primary", icon: "search", onClick: this.searchValidate }, "\u67E5\u8BE2"),
                        React.createElement(Button, { onClick: this.resetSearch }, "\u91CD\u7F6E"),
                        renderButton && renderButton(this.form))),
            renderChildComponent && React.createElement("div", { className: "search-form-child-components" }, renderChildComponent(this.state, this.form)),
            React.createElement(Table, Object.assign({ bordered: true }, tableProps, { pagination: Object.assign({ showQuickJumper: true, defaultCurrent: 1, current: parseInt(`${pageId}`, 10), onChange: this.paginationChange, pageSize: parseInt(`${pageSize}`, 10), onShowSizeChange: this.paginationChange, showSizeChanger: true }, tableProps.pagination) }))));
    }
}
var indexSearchTable = withRouter(JNSearchTable);

export { /*JNColorPicker,*/JNDatePicker$1 as JNDatePicker, JNForm$1 as JNForm, JNFormModal, indexSearchTable as JNSearchTable/*, JNUpload, JNPreview*/ };
