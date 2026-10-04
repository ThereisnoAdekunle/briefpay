import "./globals.css";

export const metadata = {
  title: "Briefpay",
  description: "Milestone USDC escrow for freelance briefs on Arc.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
