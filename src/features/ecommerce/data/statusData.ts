export function getStatusDetails(status: string) {
  switch (status) {
    case "delivered":
      return {
        title: "Delivered",
        icon: "checkmark-circle" as const,
        bgClass: "bg-green-50 border-green-100",
        iconColor: "#22C55E",
        textColor: "text-green-800",
        description: "Your delivery was completed successfully.",
        sheetBg: "#E8F5EE",
      };
    case "scheduled":
      return {
        title: "Scheduled",
        icon: "calendar" as const,
        bgClass: "bg-blue-50 border-blue-100",
        iconColor: "#3B82F6",
        textColor: "text-blue-800",
        description: "This delivery is scheduled and will arrive on time.",
        sheetBg: "#EFF6FF",
      };
    case "vacation":
      return {
        title: "Vacation Pause",
        icon: "pause-circle" as const,
        bgClass: "bg-amber-50 border-amber-100",
        iconColor: "#F59E0B",
        textColor: "text-amber-800",
        description: "Delivery is temporarily paused for your vacation gap.",
        sheetBg: "#FFFBEB",
      };
    case "skipped":
    case "undelivered":
      return {
        title: "Skipped / Undelivered",
        icon: "close-circle" as const,
        bgClass: "bg-red-50 border-red-100",
        iconColor: "#EF4444",
        textColor: "text-red-800",
        description: "Delivery was skipped or could not be completed on this day.",
        sheetBg: "#FEF2F2",
      };
    case "in_transit":
      return {
        title: "In Transit",
        icon: "bicycle" as const,
        bgClass: "bg-purple-50 border-purple-100",
        iconColor: "#A855F7",
        textColor: "text-purple-800",
        description: "Your order is in transit and on the way to you.",
        sheetBg: "#FAF5FF",
      };
    case "pending":
      return {
        title: "Pending",
        icon: "hourglass-outline" as const,
        bgClass: "bg-neutral-50 border-neutral-200",
        iconColor: "#737373",
        textColor: "text-neutral-700",
        description: "The delivery status is currently pending update.",
        sheetBg: "#FAFAFA",
      };
    case "off_day":
    case "not_active":
    default:
      return {
        title: "No Delivery",
        icon: "remove-circle-outline" as const,
        bgClass: "bg-gray-50 border-gray-100",
        iconColor: "#9CA3AF",
        textColor: "text-gray-600",
        description: "No delivery is scheduled for this day.",
        sheetBg: "#F5F8F6",
      };
  }
}
