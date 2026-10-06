import { Linking, Platform } from "react-native";

/**
 * UPI deep links.
 *
 * Android resolves the generic `upi://pay` URL through its intent chooser, so one
 * link covers every installed UPI app. iOS has no such resolver: `upi://` is not
 * a registered scheme, and `Linking.canOpenURL` returns false for any scheme not
 * listed in `LSApplicationQueriesSchemes` (see app.json → ios.infoPlist).
 *
 * So on iOS we address each app by its own scheme and only offer the ones that
 * are actually installed. When none are, the caller falls back to the QR poster
 * and the copy-UPI-ID row — which is also what an App Store reviewer will see,
 * since they are unlikely to have any Indian UPI app installed.
 */

export interface UpiPaymentRequest {
  /** Payee VPA, e.g. "paytmqr5fwdg5@ptys". */
  payeeAddress: string;
  payeeName: string;
  amount: number;
  note?: string;
}

export interface UpiApp {
  id: string;
  name: string;
  /** URL scheme probed with canOpenURL, and used to build the link. */
  scheme: string;
  /** Path between the scheme and the query string. */
  path: string;
}

/**
 * iOS schemes for the UPI apps with a documented handler. Each must also appear
 * in LSApplicationQueriesSchemes or canOpenURL always resolves false.
 */
export const IOS_UPI_APPS: UpiApp[] = [
  { id: "gpay", name: "Google Pay", scheme: "gpay", path: "//upi/pay" },
  { id: "phonepe", name: "PhonePe", scheme: "phonepe", path: "//pay" },
  { id: "paytm", name: "Paytm", scheme: "paytmmp", path: "//pay" },
  { id: "bhim", name: "BHIM", scheme: "bhim", path: "//pay" },
];

/** Standard UPI query string, identical across apps and platforms. */
function upiQuery({ payeeAddress, payeeName, amount, note }: UpiPaymentRequest): string {
  const params = [
    `pa=${encodeURIComponent(payeeAddress)}`,
    `pn=${encodeURIComponent(payeeName)}`,
    `am=${encodeURIComponent(String(amount))}`,
    "cu=INR",
  ];
  if (note) params.push(`tn=${encodeURIComponent(note)}`);
  return params.join("&");
}

/** Generic link — resolves through the intent chooser on Android only. */
export function buildGenericUpiUrl(request: UpiPaymentRequest): string {
  return `upi://pay?${upiQuery(request)}`;
}

export function buildAppUpiUrl(app: UpiApp, request: UpiPaymentRequest): string {
  return `${app.scheme}:${app.path}?${upiQuery(request)}`;
}

/**
 * UPI apps installed on this device.
 *
 * Android returns an empty list: the generic `upi://` link is the correct path
 * there, so there is nothing to probe. iOS returns only apps that answered
 * canOpenURL, which requires the scheme to be declared in Info.plist.
 */
export async function getInstalledUpiApps(): Promise<UpiApp[]> {
  if (Platform.OS !== "ios") return [];

  const checks = await Promise.all(
    IOS_UPI_APPS.map(async (app) => {
      try {
        return (await Linking.canOpenURL(`${app.scheme}://`)) ? app : null;
      } catch {
        return null;
      }
    })
  );

  return checks.filter((app): app is UpiApp => app !== null);
}

/** True when the platform can hand off to a UPI app without probing first. */
export function supportsGenericUpiIntent(): boolean {
  return Platform.OS === "android";
}
