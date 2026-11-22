import { Link, type LinkProps } from 'react-router'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './buttonStyles'

type Props = LinkProps & { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean }

/** A navigation link styled exactly like Button. */
export function ButtonLink({ variant, size, fullWidth, className, ...props }: Props) {
  return (
    <Link
      className={buttonClasses({ variant, size, fullWidth, className: className as string | undefined })}
      {...props}
    />
  )
}
