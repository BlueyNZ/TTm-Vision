export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full border-t bg-background py-4 px-6 text-center text-sm text-muted-foreground">
      <p>© {currentYear} TTM Vision™. All rights reserved.</p>
    </footer>
  );
}
