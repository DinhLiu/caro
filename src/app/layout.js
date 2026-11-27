import "./globals.css";

export const metadata = {
  title: "Cờ Caro Online 2 Người",
  description: "Chơi cờ caro trực tuyến với bạn bè",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}