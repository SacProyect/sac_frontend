import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Badge } from '@/components/UI/badge';
import { Trophy, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/UI/dialog';
import { FiscalLeaderboardData } from '@/hooks/useFiscalStats';

interface FiscalLeaderboardV2Props {
  data: FiscalLeaderboardData[];
}

export function FiscalLeaderboardV2({ data }: FiscalLeaderboardV2Props) {
  const navigate = useNavigate();
  const [selectedFiscal, setSelectedFiscal] = useState<string | null>(null);
  const selectedData = data.find((f) => f.id === selectedFiscal);

  const sortedFiscales = [...data].sort((a, b) => b.recaudacion - a.recaudacion);

  if (data.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Fiscales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-center py-8">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Fiscales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedFiscales.map((fiscal, index) => (
            <div
              key={fiscal.id}
              className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                index === 0
                  ? 'bg-gradient-to-r from-yellow-900 to-yellow-800 border border-yellow-700 hover:from-yellow-800 hover:to-yellow-700'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
              onClick={() => {
                setSelectedFiscal(fiscal.id);
                // También navegar a la página de estadísticas individuales
                navigate(`/v2/stats/fiscal/${fiscal.id}`);
              }}
            >
              <div className="flex items-center gap-4">
                {index === 0 ? (
                  <Trophy className="h-6 w-6 text-yellow-500" />
                ) : (
                  <div className="w-6 h-6 flex items-center justify-center font-bold text-slate-300">
                    #{index + 1}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">{fiscal.nombre}</p>
                  <p className="text-xs text-slate-400">
                    Cumplimiento: {fiscal.cumplimiento}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-400">
                  {new Intl.NumberFormat('es-VE', {
                    style: 'currency',
                    currency: 'VES',
                    notation: 'compact',
                  }).format(fiscal.recaudacion)}
                </p>
                {fiscal.meta > 0 && (
                  <div className="flex items-center gap-1 text-sm text-green-400">
                    <TrendingUp className="h-3 w-3" />
                    {Math.round(((fiscal.recaudacion - fiscal.meta) / fiscal.meta) * 100)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={selectedFiscal !== null} onOpenChange={() => setSelectedFiscal(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl transition-all duration-200">
          <DialogHeader>
            <DialogTitle className="text-white">
              Estadísticas del Fiscal - {selectedData?.nombre}
            </DialogTitle>
          </DialogHeader>
          {selectedData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700 rounded-lg">
                  <p className="text-slate-400 text-sm">Recaudación Total</p>
                  <p className="text-xl font-bold text-green-400">
                    {new Intl.NumberFormat('es-VE', {
                      style: 'currency',
                      currency: 'VES',
                      notation: 'compact',
                    }).format(selectedData.recaudacion)}
                  </p>
                </div>
                <div className="p-4 bg-slate-700 rounded-lg">
                  <p className="text-slate-400 text-sm">Cumplimiento</p>
                  <p className="text-xl font-bold text-blue-400">
                    {selectedData.cumplimiento}%
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-white">Verificaciones de Domicilio</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-slate-700 rounded-lg border-l-4 border-green-500">
                    <span className="text-slate-300">VDF en Plazo</span>
                    <Badge className="bg-green-600">{selectedData.vdfEnPlazo}</Badge>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-700 rounded-lg border-l-4 border-yellow-500">
                    <span className="text-slate-300">VDF Fuera de Plazo (Proceso)</span>
                    <Badge className="bg-yellow-600">{selectedData.vdfFueraPlazoProceso}</Badge>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-700 rounded-lg border-l-4 border-red-500">
                    <span className="text-slate-300">VDF Fuera de Plazo (Dejada)</span>
                    <Badge className="bg-red-600">{selectedData.vdfFueraPlazoDejada}</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
