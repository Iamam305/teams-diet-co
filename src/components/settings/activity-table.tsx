import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { activityTypeLabel } from "@/lib/activity";
import { formatDateTime } from "@/lib/format";
import type { ActivityRow } from "@/server/queries";

function activityDetail(row: ActivityRow) {
  const title =
    typeof row.metadata?.title === "string" ? row.metadata.title : null;

  if (title) {
    return title;
  }

  return "-";
}

export function ActivityTable({ rows }: { rows: ActivityRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        No activity yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="font-medium">
              {row.userName} · {activityTypeLabel(row.type)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(row.createdAt)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {activityDetail(row)}
            </p>
          </li>
        ))}
      </ul>
      <div className="hidden rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Person</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                <TableCell>{row.userName}</TableCell>
                <TableCell>{activityTypeLabel(row.type)}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {activityDetail(row)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
