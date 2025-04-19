import { ReactNode, MouseEvent } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  title?: string;
  children: ReactNode;
  size?: ButtonSize;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  variant?: ButtonVariant;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}
