import Link from "next/link";

const LINKS = [
  { href: "/", label: "Upload" },
  { href: "/library", label: "Library" },
  { href: "/mcp-demo", label: "MCP Demo" },
];

export default function SiteHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="border-b bg-white mb-6">
      <div className="container mx-auto px-4 py-4 max-w-4xl flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold truncate">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <nav className="flex gap-4 text-sm shrink-0">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-blue-600 hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
