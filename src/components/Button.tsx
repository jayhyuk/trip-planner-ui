"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 disabled:bg-teal-300",
  secondary:
    "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 disabled:text-slate-400",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", loading, disabled, className = "", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
});

export default Button;
