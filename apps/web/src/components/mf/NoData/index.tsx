import clsx from 'clsx'
import styles from './index.module.scss'

interface Props {
  className?: string
  imgWidth?: number
}

export function NoData({ className, imgWidth }: Props) {
  return (
    <div className={clsx(styles.noData, className)}>
      <img width={imgWidth || 48} src="/icons/empty.svg" alt="" />
      <div className={styles.desc}>暂无数据</div>
    </div>
  )
}
