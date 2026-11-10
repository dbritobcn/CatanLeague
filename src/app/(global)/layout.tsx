import { Navigation } from "@/presentation/components/Navigation";
import { SidebarAuth } from "@/presentation/components/SidebarAuth";

/** Chrome for global routes (/​, /crear, /login): the plain sidebar with the auth slot. */
export default function GlobalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation footer={<SidebarAuth />} />
      <main id="contenido" tabIndex={-1}>{children}</main>
    </>
  );
}
