import { FC } from 'react'
import dayjs from 'dayjs'
import { DatePicker, DatePickerProps } from 'antd'

const CustomDatePicker: FC<DatePickerProps> = ({
  onChange,
  value,
  ...otherProps
}) => {
  const dateOnChange = (date: any, dateString: string) => {
    if (onChange) {
      onChange(date?.set('millisecond', 0).valueOf(), dateString)
    }
  }

  return (
    <DatePicker
      format='YYYY-MM-DD HH:mm:ss'
      {...otherProps}
      onChange={dateOnChange as any}
      value={value && dayjs(value)}
    />
  )
}

export default CustomDatePicker
