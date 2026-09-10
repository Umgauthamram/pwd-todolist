import NotFoundPage from "@/components/ui/page-not-found";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Page Not Found | Beginning",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return <NotFoundPage />;
}
