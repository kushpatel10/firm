"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

function Popover({
  ...props
}) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function getNativeButtonProp(nativeButton, asChild, children) {
  if (nativeButton !== undefined) {
    return nativeButton;
  }
  if (!asChild || !children) {
    return undefined;
  }
  if (React.isValidElement(children)) {
    const isLink =
      children.props?.href !== undefined ||
      children.type === "a" ||
      (typeof children.type === "function" &&
        (children.type.name === "Link" || children.type.displayName === "Link"));

    const isNonButtonTag =
      typeof children.type === "string" && children.type !== "button";

    if (isLink || isNonButtonTag) {
      return false;
    }
  }
  return undefined;
}

function PopoverTrigger({
  asChild,
  nativeButton,
  render,
  children,
  ...props
}) {
  const computedNativeButton = getNativeButtonProp(nativeButton, asChild, children);

  if (asChild && children) {
    return (
      <PopoverPrimitive.Trigger
        data-slot="popover-trigger"
        render={children}
        {...(computedNativeButton !== undefined ? { nativeButton: computedNativeButton } : {})}
        {...props}
      />
    );
  }

  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      render={render}
      {...(computedNativeButton !== undefined ? { nativeButton: computedNativeButton } : {})}
      {...props}
    >
      {children}
    </PopoverPrimitive.Trigger>
  );
}

function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  ...props
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50">
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "z-50 flex w-72 origin-(--transform-origin) flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props} />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-0.5 text-sm", className)}
      {...props} />
  );
}

function PopoverTitle({
  className,
  ...props
}) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("font-medium", className)}
      {...props} />
  );
}

function PopoverDescription({
  className,
  ...props
}) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("text-muted-foreground", className)}
      {...props} />
  );
}

export {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}
