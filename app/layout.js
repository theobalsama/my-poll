import "./globals.css";

export const metadata = {
  title: "Favourite Lebanese Dish",
  description: "Vote for your favourite Lebanese dish",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
