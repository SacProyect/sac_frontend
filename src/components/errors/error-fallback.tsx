import React from "react";

export function ErrorFallback({
    error,
    resetErrorBoundary,
}: {
    error: Error;
    resetErrorBoundary: () => void;
}) {
    return (
        <div role="alert" className="flex flex-col items-center justify-center p-4 bg-red-100 rounded-lg">
            <p className="text-red-700 font-bold">⚠️ Algo salió mal:</p>
            {/* <pre className="text-sm text-red-600 mt-2">{error.message}</pre> */}
            <button
                onClick={resetErrorBoundary}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
                Reintentar
            </button>
        </div>
    );
}
