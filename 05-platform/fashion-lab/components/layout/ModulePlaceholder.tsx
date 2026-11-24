import { ArrowLeft, Construction } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

interface Props {
  moduleName: string;
  milestone: string;
  description: string;
}

/** Shown for areas that are planned but not built yet. Says so plainly. */
export function ModulePlaceholder({ moduleName, milestone, description }: Props) {
  return (
    <Card className="max-w-xl mx-auto my-8 p-10 text-center">
      <div className="size-12 rounded-xl bg-surface-2 text-ink-2 flex items-center justify-center mx-auto mb-4">
        <Construction className="size-6" aria-hidden />
      </div>
      <Badge className="mb-3">Not built yet · {milestone}</Badge>
      <h1 className="text-xl font-semibold text-ink mb-2">{moduleName}</h1>
      <p className="text-sm text-ink-2 max-w-md mx-auto mb-6">{description}</p>
      <ButtonLink href="/dashboard" variant="secondary">
        <ArrowLeft aria-hidden /> Back to home
      </ButtonLink>
    </Card>
  );
}
