export function getApiData(response) {
  if (!response?.data?.success) {
    throw new Error(response?.data?.message || 'Request failed')
  }

  return response.data.data
}

export function getApiMessage(error, fallback = 'Something went wrong') {
  return error?.response?.data?.message || error?.message || fallback
}
