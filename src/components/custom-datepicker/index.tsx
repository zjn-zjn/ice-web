import { FC } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { DatePicker } from 'antd'

interface CustomDatePickerProps {
  value?: number | null
  onChange?: (value: number | null, dateString: string | string[]) => void
  [key: string]: any
}

const CustomDatePicker: FC<CustomDatePickerProps> = ({
  onChange,
  value,
  ...otherProps
}) => {
  const dateOnChange = (date: Dayjs | null, dateString: string | string[]) => {
    if (onChange) {
      onChange(date ? date.set('millisecond', 0).valueOf() : null, dateString)
    }
  }

  return (
    <DatePicker
      format='YYYY-MM-DD HH:mm:ss'
      {...otherProps}
      onChange={dateOnChange}
      value={value ? dayjs(value) : null}
    />
  )
}

export default CustomDatePicker
