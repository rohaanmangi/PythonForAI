import "./globals.css";

export const metadata = {
  title: "Xander | Restaurant support",
  description: "Chat with Xander restaurant support about the menu, prices, or an order complaint.",
  other: { "page-type": "software", "site-kind": "software" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-type="software" data-radius="soft" data-buttons="solid">
      <body>{children}</body>
    </html>
  );
}
