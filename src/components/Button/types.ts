import { ReactNode } from "react";

export interface ButtonProps {
  title?: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "danger" | "success";

  onClick: () => void;
}
