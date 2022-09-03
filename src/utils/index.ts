import qs from 'qs'

const getSearch = () =>
  qs.parse(window.location.search.substring(1)) as {
    [key: string]: string
  }

export { getSearch }
