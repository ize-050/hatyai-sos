'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">🚨 Hatyai SOS API Documentation</h1>
          <p className="text-blue-100 mt-1">ศูนย์ช่วยเหลือน้ำท่วมหาดใหญ่ - API สำหรับหน่วยงานภาครัฐ</p>
        </div>
      </div>
      
      {/* Swagger UI */}
      <div className="swagger-wrapper">
        <SwaggerUI url="/api/docs" />
      </div>

      <style jsx global>{`
        .swagger-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .swagger-ui .topbar {
          display: none;
        }
        .swagger-ui .info {
          margin: 20px 0;
        }
        .swagger-ui .info .title {
          font-size: 28px;
          color: #1e40af;
        }
        .swagger-ui .opblock-tag {
          font-size: 18px;
          border-bottom: 1px solid #e5e7eb;
        }
        .swagger-ui .opblock.opblock-get .opblock-summary-method {
          background: #22c55e;
        }
        .swagger-ui .opblock.opblock-post .opblock-summary-method {
          background: #3b82f6;
        }
        .swagger-ui .btn.execute {
          background: #2563eb;
          border-color: #2563eb;
        }
        .swagger-ui .btn.execute:hover {
          background: #1d4ed8;
        }
      `}</style>
    </div>
  );
}
