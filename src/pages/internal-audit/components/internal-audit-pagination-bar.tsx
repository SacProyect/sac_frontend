import { Button } from "@/components/UI/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  setPage: (n: number | ((p: number) => number)) => void;
};

export function InternalAuditPaginationBar({ page, totalPages, setPage }: Props) {
  return (
    <div className="flex justify-center pt-2">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 flex items-center gap-2 shadow-lg">
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
        <span className="text-slate-400 text-sm px-2 tabular-nums">
          {page} / {totalPages}
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
