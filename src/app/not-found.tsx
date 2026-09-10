import dynamic from "next/dynamic";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Page Not Found | Beginning",
  description: "The page you are looking for does not exist.",
};

const NotFoundPage = dynamic(() => import("@/components/ui/page-not-found"), {
  ssr: false,
  loading: () => <div className="w-full h-screen h-[100dvh] bg-black" />,
});

export default function NotFound() {
  return <NotFoundPage />;
}
