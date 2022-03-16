// (function (global, factory) {
//   typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react'), require('antd'), require('react-color'), require('moment'), require('react-router-dom'), require('qs')) :
//   typeof define === 'function' && define.amd ? define(['exports', 'react', 'antd', 'react-color', 'moment', 'react-router-dom', 'qs'], factory) :
//   (global = global || self, factory(global.groot = {}, global.React, global.antd, global.reactColor, global.moment, global.reactRouterDom, global.qs));
// }(this, function (exports, React, antd, reactColor, moment, reactRouterDom, qs) { 'use strict';

//   var React__default = 'default' in React ? React['default'] : React;
//   moment = moment && moment.hasOwnProperty('default') ? moment['default'] : moment;
//   qs = qs && qs.hasOwnProperty('default') ? qs['default'] : qs;

//   const FormItem = antd.Form.Item;
//   const { Option } = antd.Select;
//   const RadioGroup = antd.Radio.Group;
//   const CheckboxGroup = antd.Checkbox.Group;
//   const { RangePicker: RangePicker$1, DatePicker, MonthPicker: MonthPicker$1, WeekPicker: WeekPicker$1 } = JNDatePicker$1;
//   const { TextArea } = antd.Input;
//   class JNForm extends React.Component {
//       constructor() {
//           super(...arguments);
//           this.createFormItem = (formItem, index) => {
//               const { label, id, options = {}, type, props = {}, childData = [], prompt, customComponent, show = true, } = formItem;
//               const { getFieldDecorator } = this.props.form;
//               return (show &&
//                   React__default.createElement(FormItem, { label: label, key: index },
//                       getFieldDecorator(id, options)(this.formItem(type, props, childData, customComponent)),
//                       prompt &&
//                           React__default.createElement("span", { className: "ant-form-text", style: { lineHeight: '18px', color: '#999', fontSize: '12px' } }, prompt)));
//           };
//           this.formItem = (type, props, childData, customComponent) => {
//               switch (type) {
//                   case 'input':
//                       return React__default.createElement(antd.Input, Object.assign({}, props));
//                   case 'number':
//                       return React__default.createElement(antd.InputNumber, Object.assign({}, props));
//                   case 'textArea':
//                       return React__default.createElement(TextArea, Object.assign({}, props));
//                   case 'switch':
//                       return React__default.createElement(antd.Switch, Object.assign({}, props));
//                   case 'slider':
//                       return React__default.createElement(antd.Slider, Object.assign({}, props));
//                   case 'rate':
//                       return React__default.createElement(antd.Rate, Object.assign({}, props));
//                   case 'treeSelect':
//                       return React__default.createElement(antd.TreeSelect, Object.assign({}, props));
//                   case 'transfer':
//                       return React__default.createElement(antd.Transfer, Object.assign({}, props));
//                   case 'upload':
//                       return React__default.createElement(JNUpload, Object.assign({}, props));
//                   case 'color':
//                       return React__default.createElement(JNColorPicker, Object.assign({}, props));
//                   case 'cascader':
//                       return React__default.createElement(antd.Cascader, Object.assign({}, props));
//                   case 'datePicker':
//                       return React__default.createElement(DatePicker, { pickerProps: props });
//                   case 'monthPicker':
//                       return React__default.createElement(MonthPicker$1, { pickerProps: props });
//                   case 'rangePicker':
//                       return React__default.createElement(RangePicker$1, { pickerProps: props });
//                   case 'weekPicker':
//                       return React__default.createElement(WeekPicker$1, { pickerProps: props });
//                   case 'timePicker':
//                       return React__default.createElement(antd.TimePicker, Object.assign({}, props));
//                   case 'select':
//                       return (React__default.createElement(antd.Select, Object.assign({}, props), childData.map((item, index) => (React__default.createElement(Option, Object.assign({ key: index }, item.props), item.text)))));
//                   case 'radio':
//                       return (React__default.createElement(RadioGroup, Object.assign({}, props), childData.map((item, index) => (React__default.createElement(antd.Radio, Object.assign({ key: index }, item.props), item.text)))));
//                   case 'checkbox':
//                       return (React__default.createElement(CheckboxGroup, Object.assign({}, props),
//                           React__default.createElement(antd.Row, null, childData.map((item, index) => (React__default.createElement(antd.Col, { span: 8, key: index },
//                               React__default.createElement(antd.Checkbox, Object.assign({}, item.props), item.text)))))));
//                   case 'custom': // 自定义组件
//                       return customComponent;
//                   default:
//                       return null;
//               }
//           };
//       }
//       render() {
//           const { formData = [], formProps } = this.props;
//           return (React__default.createElement(antd.Form, Object.assign({}, formProps), formData.map((data, index) => (this.createFormItem(data, index)))));
//       }
//   }
//   var JNForm$1 = antd.Form.create()(JNForm);

//   class JNFormModal extends React.Component {
//       constructor() {
//           super(...arguments);
//           this.form = null;
//           this.handleOk = () => {
//               const { confirm } = this.props;
//               this.form.validateFields((error, values) => {
//                   console.log(values);
//                   if (!error) {
//                       confirm(values);
//                   }
//                   else {
//                       console.log('表单校验出错', error);
//                   }
//               });
//           };
//           this.handleCancel = () => {
//               this.props.cancel();
//           };
//       }
//       render() {
//           const { visible, formData = [], title, cancelText, okText, width, maskClosable, className, refForm } = this.props;
//           return (React__default.createElement(antd.Modal, { className: className, visible: visible, title: title, cancelText: cancelText, okText: okText, onOk: this.handleOk, destroyOnClose: true, onCancel: this.handleCancel, maskClosable: maskClosable, width: width },
//               React__default.createElement(JNForm$1, { formData: formData, wrappedComponentRef: (formRef) => {
//                       if (refForm) {
//                           refForm(formRef && formRef.props.form);
//                       }
//                       this.form = formRef && formRef.props.form;
//                   }, formProps: {
//                       labelCol: { span: 6 },
//                       wrapperCol: { span: 14 },
//                   } })));
//       }
//   }
//   JNFormModal.defaultProps = {
//       maskClosable: false,
//       width: 600
//   };

//   class JNSearchTable extends React.Component {
//       constructor() {
//           super(...arguments);
//           this.form = null;
//           this.state = {
//               pageId: 1,
//               pageSize: 20,
//           };
//           this.search = () => {
//               const { history, onSearch } = this.props;
//               history.replace({
//                   pathname: history.location.pathname,
//                   search: qs.stringify(this.state, { arrayFormat: 'repeat' }),
//                   state: history.location.state,
//               });
//               if (onSearch) {
//                   onSearch(Object.assign({}, this.state));
//               }
//           };
//           this.paginationChange = (pageId, pageSize) => {
//               this.setState({ pageId, pageSize }, () => {
//                   this.search();
//               });
//           };
//           this.searchValidate = () => {
//               this.form.validateFields((error, values) => {
//                   console.log(values);
//                   if (!error) {
//                       this.setState(Object.assign({}, values, { pageId: 1 }), () => {
//                           this.search();
//                       });
//                   }
//                   else {
//                       console.log(error);
//                   }
//               });
//           };
//           this.resetSearch = () => {
//               this.form.resetFields();
//           };
//       }
//       componentDidMount() {
//           const { history } = this.props;
//           const parameter = qs.parse(history.location.search.substring(1));
//           this.setState(Object.assign({}, parameter), () => {
//               this.search();
//           });
//       }
//       render() {
//           const { searchFormData, tableProps = {}, formProps, renderChildComponent, renderButton } = this.props;
//           const { pageId, pageSize } = this.state;
//           return (React__default.createElement(React__default.Fragment, null,
//               searchFormData &&
//                   React__default.createElement("div", { className: "search-form" },
//                       React__default.createElement(JNForm$1, { formData: searchFormData, wrappedComponentRef: (formRef) => this.form = formRef && formRef.props.form, formProps: Object.assign({ layout: 'inline' }, formProps) }),
//                       React__default.createElement("div", { style: { minWidth: 250 } },
//                           React__default.createElement(antd.Button, { style: { marginRight: '10px' }, type: "primary", icon: "search", onClick: this.searchValidate }, "\u67E5\u8BE2"),
//                           React__default.createElement(antd.Button, { onClick: this.resetSearch }, "\u91CD\u7F6E"),
//                           renderButton && renderButton(this.form))),
//               renderChildComponent && React__default.createElement("div", { className: "search-form-child-components" }, renderChildComponent(this.state, this.form)),
//               React__default.createElement(antd.Table, Object.assign({ bordered: true }, tableProps, { pagination: Object.assign({ showQuickJumper: true, defaultCurrent: 1, current: parseInt(`${pageId}`, 10), onChange: this.paginationChange, pageSize: parseInt(`${pageSize}`, 10), onShowSizeChange: this.paginationChange, showSizeChanger: true }, tableProps.pagination) }))));
//       }
//   }
//   var index = reactRouterDom.withRouter(JNSearchTable);

//   exports.JNForm = JNForm$1;
//   exports.JNFormModal = JNFormModal;
//   exports.JNSearchTable = index;

//   Object.defineProperty(exports, '__esModule', { value: true });

// }));
