import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;
function Icon({ children, ...props }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 256 256"
      fill="none"
      stroke="currentColor"
      strokeWidth="16"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}
export function ArrowLeftIcon(props: Props) {
  return (
    <Icon {...props}>
      <path d="M216 128H40m72-72-72 72 72 72" />
    </Icon>
  );
}
export function ArrowRightIcon(props: Props) {
  return (
    <Icon {...props}>
      <path d="M40 128h176m-72-72 72 72-72 72" />
    </Icon>
  );
}
export function CaretDownIcon(props: Props) {
  return (
    <Icon {...props}>
      <path d="m48 96 80 80 80-80" />
    </Icon>
  );
}
export function CloseIcon(props: Props) {
  return (
    <Icon {...props}>
      <path d="m64 64 128 128M192 64 64 192" />
    </Icon>
  );
}
