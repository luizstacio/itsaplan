import { ExternalLink, GitPullRequest } from 'lucide-react';
import type { DevelopmentLink } from '@/lib/api/endpoints/git';
import { noDragProps } from '@/lib/dnd';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import IssueDevelopmentStateBadge from '@/features/issue/components/detail/IssueDevelopmentStateBadge';

export function IssueCardPullRequests({ links }: { links?: DevelopmentLink[] }) {
  const pullRequests = links?.filter((link) => link.kind === 'pull_request' && link.url);
  if (!pullRequests?.length) return null;

  return (
    <div className="mt-2 flex flex-col gap-1 border-t border-border/50 pt-1.5">
      {pullRequests.map((link) => (
        <Tooltip key={link.id}>
          <TooltipTrigger asChild>
            <a
              href={link.url!}
              target="_blank"
              rel="noopener noreferrer"
              {...noDragProps}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              className="-mx-1 flex items-center justify-between gap-2 rounded px-1 py-0.5 text-start hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span className="flex min-w-0 items-center gap-1.5 text-[10px] text-muted-foreground">
                <GitPullRequest className="size-3 shrink-0" />
                <span className="truncate font-mono">
                  {link.number == null ? link.title : `#${link.number}`}
                </span>
                <ExternalLink className="size-3 shrink-0" />
              </span>
              <IssueDevelopmentStateBadge link={link} />
            </a>
          </TooltipTrigger>
          <TooltipContent>
            {link.repository} · {link.title}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
