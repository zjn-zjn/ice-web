export type CallbackFun = (data?: object, sagaUtils?: any) => any

export interface Option {
  process?: CallbackFun
}

export interface Action {
  type: string
  payload: any
}

export interface ResponseGenerator {
  config?: any,
  data?: any,
  headers?: any,
  request?: any,
  status?: number,
  error?: any,
  statusText?: string,
  records?: any,
  pageNum?: any,
  total?: any
}

const callApi = (api?: any, option?: Option) =>
  function* (action: Action, sagaUtils: any) {
    const { type, payload } = action
    const { call, put } = sagaUtils
    const actionType = type.split("/").pop()

    try {
      const response:ResponseGenerator = yield call(api, payload)
      const payloadX = response.data
      yield put({ type: `_${actionType}`, payload: payloadX })

      if(option && typeof option.process === "function"){
        yield option.process(payloadX, sagaUtils)
      }
    } catch (err) {
      const { response } = err
      console.log(err, response)
      if (response) {
        const responseData = response.data
        yield put({ type: `_${actionType}`, payload: responseData })
      }
      if (option) {
        if (typeof option.process === "function") {
          yield option.process(response, sagaUtils)
        }
      }
    }
  }

const updateState = (stateName: string) => (state: object, action: Action) => ({
  ...state,
  [stateName]: action.payload,
})

const updateStateArrayWithData = (stateName: string) => (
  state: object,
  action: Action
) => ({ ...state, [stateName]: action.payload.data || [] })

const updateStateObjectWithData = (stateName: string) => (
  state: object,
  action: Action
) => ({ ...state, [stateName]: action.payload.data || {} })

export {
  callApi,
  updateState,
  updateStateArrayWithData,
  updateStateObjectWithData,
}
