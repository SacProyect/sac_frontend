import React, { useState, useMemo, useEffect, useRef } from 'react';
import InfoTableOptMenu from '../UI/InfoTable/InfoTableOptMenu';
import { TaxpayerCensus } from '../../types/taxpayerCensus';

interface TaxpayerCensusTableProps {
  propRows: TaxpayerCensus[];
}

const columns = [
  { label: 'Número', id: 'number' },
  { label: 'Proceso', id: 'process' },
  { label: 'Nombre', id: 'name' },
  { label: 'RIF', id: 'rif' },
  { label: 'Tipo', id: 'type' },
  { label: 'Dirección', id: 'address' },
  { label: 'Fecha de emisión', id: 'emition_date' },
  { label: 'Fiscal', id: 'fiscal.name' },
];

const TaxpayerCensusTable: React.FC<TaxpayerCensusTableProps> = ({ propRows }) => {
  const [rows, setRows] = useState<TaxpayerCensus[]>([]);
  const [visibleCount, setVisibleCount] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingMoreLock = useRef(false);

  useEffect(() => {
    const sorted = [...propRows].sort((a, b) => Number(a.number) - Number(b.number));
    setRows(sorted);
  }, [propRows]);

  const filteredTaxpayers = useMemo(() => {
    return rows.filter((item) => {
      const search = searchTerm.toLowerCase();
      return (
        item.number.toString().includes(search) ||
        item.process?.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search) ||
        item.rif.toLowerCase().includes(search) ||
        item.type?.toLowerCase().includes(search) ||
        item.address?.toLowerCase().includes(search) ||
        (item.fiscal?.name?.toLowerCase() || '').includes(search) ||
        (item.emition_date && new Date(item.emition_date).toLocaleDateString().includes(search))
      );
    });
  }, [rows, searchTerm]);

  const visibleRows = useMemo(() => filteredTaxpayers.slice(0, visibleCount), [filteredTaxpayers, visibleCount]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let debounceTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        if (loadingMoreLock.current || isLoadingMore) return;

        const scrollTop = el.scrollTop;
        const scrollHeight = el.scrollHeight;
        const clientHeight = el.clientHeight;
        const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

        if (distanceToBottom < 100 && visibleCount < filteredTaxpayers.length) {
          loadingMoreLock.current = true;
          setIsLoadingMore(true);

          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + 25, filteredTaxpayers.length));
            setIsLoadingMore(false);
            loadingMoreLock.current = false;
          }, 500);
        }
      }, 150);
    };

    el.addEventListener('scroll', handleScroll);
    return () => {
      clearTimeout(debounceTimeout);
      el.removeEventListener('scroll', handleScroll);
    };
  }, [visibleCount, filteredTaxpayers.length, isLoadingMore]);

  console.log("Taxpayers: " + JSON.stringify(filteredTaxpayers));

  return (
    <div className="w-full">
      <div className='flex items-center justify-center w-full lg:py-4'>
        <h2 className="mb-2 text-2xl font-semibold">Contribuyentes Censados</h2>
      </div>

      <div className='pl-4'>
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded md:max-w-full lg:max-w-lg"
        />
      </div>

      <div ref={containerRef} className="overflow-auto h-[70vh] lg:h-[83.5vh] w-[80vw] custom-scroll lg:pl-4">
        <div className="flex flex-col min-w-full text-xs">
          <div
            className="sticky top-0 z-10 bg-[#363F4B] rounded-t-lg text-white text-center min-w-max flex lg:grid"
            style={{ gridTemplateColumns: `repeat(${columns.length}, 0.8fr)` }}
          >
            {columns.map((col) => (
              <div
                key={col.id}
                className="px-1 pl-4 py-1 font-semibold min-w-[10rem] lg:min-w-0 lg:px-2 lg:py-2 lg:whitespace-nowrap"
              >
                {col.label}
              </div>
            ))}
          </div>

          {visibleRows.map((item) => (
            <div
              key={item.id}
              className="flex items-center text-center transition-colors hover:bg-blue-50 lg:grid"
              style={{ gridTemplateColumns: `repeat(${columns.length}, 0.8fr)` }}
            >
              {columns.map((col) => {
                const value =
                  col.id === 'options' ? (
                    <InfoTableOptMenu id={item.id} />
                  ) : col.id === 'emition_date' ? (
                    item.emition_date
                      ? new Date(item.emition_date).toLocaleDateString()
                      : '—'
                  ) : col.id === 'type' ? (
                    item.type === 'ORDINARY' ? 'ORDINARIO' : 'ESPECIAL'
                  ) : col.id === 'fiscal.name' ? (
                    item.fiscal?.name ?? '—'
                  ) : (
                    String(item[col.id as keyof TaxpayerCensus])
                  );

                return (
                  <div
                    key={col.id}
                    className="px-1 pl-4 py-1 break-words whitespace-normal min-w-[10rem] lg:min-w-0 lg:px-2 lg:py-2 lg:break-words"
                  >
                    {value}
                  </div>
                );
              })}
            </div>
          ))}

          {isLoadingMore && (
            <div className="flex justify-center py-2">
              <div className="w-5 h-5 border-2 border-blue-500 rounded-full border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaxpayerCensusTable;
