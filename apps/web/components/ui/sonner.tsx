"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-[#0A0A0F] group-[.toaster]:text-[#EEF3F8] group-[.toaster]:border-[rgba(200,216,232,0.1)] group-[.toaster]:shadow-lg font-mono",
          description: "group-[.toast]:text-[#8BA3BF]",
          actionButton: "group-[.toast]:bg-[#C9933A] group-[.toast]:text-[#0A0A0F]",
          cancelButton: "group-[.toast]:bg-[rgba(200,216,232,0.1)] group-[.toast]:text-[#8BA3BF]",
          success: "group-[.toaster]:border-[#C9933A]/50 group-[.toaster]:bg-[#C9933A]/10 group-[.toaster]:text-[#C9933A]",
          error: "group-[.toaster]:border-red-900/50 group-[.toaster]:bg-red-950/20 group-[.toaster]:text-red-400",
          info: "group-[.toaster]:border-blue-900/50 group-[.toaster]:bg-blue-950/20 group-[.toaster]:text-blue-400",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4 text-[#C9933A]" />,
        info: <InfoIcon className="size-4 text-blue-400" />,
        warning: <TriangleAlertIcon className="size-4 text-yellow-400" />,
        error: <OctagonXIcon className="size-4 text-red-400" />,
        loading: <Loader2Icon className="size-4 animate-spin text-[#8BA3BF]" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
