import { QuickCaptureForm } from '@/components/census/QuickCaptureForm';

export default function CensusQuickCapturePage() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 w-full max-w-none px-0 py-0 md:px-4 md:py-4">
        <QuickCaptureForm />
      </div>
    </div>
  );
}
