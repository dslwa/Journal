import { useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';

declare global {
  interface Window { TradingView: any; }
}

export default function ChartPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'tradingview-widget';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';
    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          container_id: 'tradingview-widget',
          autosize: true,
          symbol: 'OANDA:EURUSD',
          interval: '60',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#0f1419',
          enable_publishing: false,
          allow_symbol_change: true,
          hide_side_toolbar: false,
          studies: [],
          withdateranges: true,
          details: true,
          calendar: true,
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      script.remove();
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  return (
    <Layout>
      <div className="flex flex-col h-full -m-6">
        <div ref={containerRef} className="flex-1 min-h-0" />
      </div>
    </Layout>
  );
}
