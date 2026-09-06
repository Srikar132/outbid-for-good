import Link from "next/link";

const footerLinks = [
  { label: "Rules", href: "/rules" },
  { label: "FAQ", href: "/faq" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Imprint", href: "/imprint" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-200 py-8 text-center">
      <p className="text-small text-neutral-500">
        Built by{" "}
        <span className="font-semibold text-neutral-700">@srikar</span> &{" "}
        <span className="font-semibold text-neutral-700">@Ramakrishna</span> &middot;{" "}
        <a
          href="https://orbitfilings.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary-500 hover:text-primary-400"
        >
          OrbitFilings
        </a>
      </p>
      <p className="text-small mt-2 flex flex-wrap items-center justify-center gap-2 text-neutral-500">
        {footerLinks.map((link, i) => (
          <span key={link.href} className="flex items-center gap-2">
            <Link href={link.href} className="hover:text-neutral-700">
              {link.label}
            </Link>
            {i < footerLinks.length - 1 && <span>&middot;</span>}
          </span>
        ))}
      </p>
    </footer>
  );
}
