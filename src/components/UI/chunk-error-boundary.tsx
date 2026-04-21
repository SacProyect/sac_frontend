import { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    isChunkError: boolean;
}

/**
 * ChunkErrorBoundary - Captura errores de carga dinámica de módulos (code-splitting)
 * 
 * Cuando se hace un nuevo despliegue, los archivos JS cambian de hash.
 * Los usuarios con la app abierta intentan cargar chunks antiguos que ya no existen.
 * Este componente detecta esos errores y recarga la página automáticamente.
 */
export class ChunkErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, isChunkError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        // Detectar si es un error de carga de chunk dinámico
        const isChunkError = 
            error.message?.includes('Failed to fetch dynamically imported module') ||
            error.message?.includes('Failed to load module script') ||
            error.message?.includes('Importing a module script failed') ||
            error.message?.includes('error loading dynamically imported module') ||
            error.message?.includes('Loading chunk') ||
            error.message?.includes('Loading CSS chunk') ||
            // Errores de red relacionados con archivos .js
            (error.message?.includes('Failed to fetch') && error.stack?.includes('.js'));

        return { hasError: true, isChunkError };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ChunkErrorBoundary capturó un error:', error, errorInfo);

        if (this.state.isChunkError) {
            // Esperar un momento para que otros errores se asienten
            setTimeout(() => {
                // Limpiar el caché del service worker si existe
                if ('caches' in window) {
                    caches.keys().then(cacheNames => {
                        cacheNames.forEach(cacheName => {
                            caches.delete(cacheName);
                        });
                    });
                }

                // Recargar la página para obtener los nuevos chunks
                window.location.reload();
            }, 500);
        }
    }

    handleManualReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError && !this.state.isChunkError) {
            // Error que no es de chunk, mostrar fallback genérico
            return this.props.fallback || (
                <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
                    <div className="text-center space-y-4">
                        <h2 className="text-xl font-semibold text-red-400">Ha ocurrido un error</h2>
                        <p className="text-slate-400">Por favor, recarga la página para continuar.</p>
                        <button
                            onClick={this.handleManualReload}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                        >
                            Recargar página
                        </button>
                    </div>
                </div>
            );
        }

        // Si es error de chunk, mostramos un mensaje mientras se recarga
        if (this.state.isChunkError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
                    <div className="text-center space-y-4">
                        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                        <h2 className="text-xl font-semibold">Actualizando aplicación...</h2>
                        <p className="text-slate-400 text-sm">
                            Se ha detectado una nueva versión. Recargando automáticamente.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
