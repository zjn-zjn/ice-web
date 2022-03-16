import { connect } from "dva"

export default (mapState: string | string[]) => (component: any) => {
  let mapStateToProps
  if (mapState instanceof Array) {
    mapStateToProps = (store: any) => {
      let stateToProps = { loading: store.loading }
      mapState.forEach((state: string) => {
        stateToProps = { ...stateToProps, [state]: store[state] }
      })
      return stateToProps
    }
  } else {
    mapStateToProps = (store: any) => ({
      [mapState]: store[mapState] || {},
      loading: store.loading,
    })
  }

  const mapDispacthToProps = (dispatch: any) => {
    const createDispatch = (type: string, payload: any) =>
      dispatch({ type, payload })
    return { dispatch, createDispatch }
  }

  return connect(mapStateToProps, mapDispacthToProps)(component)
}
