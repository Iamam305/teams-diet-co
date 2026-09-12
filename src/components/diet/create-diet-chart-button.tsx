import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function CreateDietChartButton({
  label = "New diet chart",
}: {
  label?: string;
}) {
  return (
    <Link href="/diet-charts/new" className={buttonVariants()}>
      {label}
    </Link>
  );
}
