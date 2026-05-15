import { Button } from "@/components/UI/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  setPage: (n: number | ((p: number) => number)) => void;
  labels?: string[];
};

export function InternalAuditPaginationBar({ page, totalPages, setPage, labels }: Props) {
  const currentLabel = labels?.[page - 1];
  return (
    <div className="flex justify-center pt-2">
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="text-slate-300"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>
        <span className="text-slate-400 text-sm px-2 tabular-nums min-w-[160px] text-center">
          {page} / {totalPages}
          {currentLabel ? <span className="ml-1 text-slate-500">· {currentLabel}</span> : null}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="text-slate-300"
        >
          Siguiente
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
