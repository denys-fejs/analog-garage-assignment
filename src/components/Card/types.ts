import { ReactNode } from "react";

export interface CardProps {
  title?: string;
  className?: string;
  footer?: ReactNode;
  children: ReactNode;
  headerActions?: ReactNode;
}
