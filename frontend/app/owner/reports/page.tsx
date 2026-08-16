'use client';

import React, { useState, useEffect } from 'react';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { api } from '@/lib/api';
import { FileBarChart, Download, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get('/fuel-transactions?limit=100');
        setReportData(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const exportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Date,Plate Number,Driver,Station,Liters,Cost,Risk Level']
        .concat(
          reportData.map(
            (r) =>
              `${new Date(r.fuelDate).toLocaleDateString()},${r.vehicleId?.plateNumber},${r.driverId?.fullName},${r.fuelStationName},${r.fuelQuantity},${r.totalAmount},${r.riskLevel}`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'FFFDMS_Fuel_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      reportData.map((r) => ({
        Date: new Date(r.fuelDate).toLocaleDateString(),
        PlateNumber: r.vehicleId?.plateNumber,
        Driver: r.driverId?.fullName,
        Station: r.fuelStationName,
        Liters: r.fuelQuantity,
        Cost: r.totalAmount,
        RiskLevel: r.riskLevel,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fuel Transactions');
    XLSX.writeFile(workbook, 'FFFDMS_Fuel_Report.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('FFFDMS Executive Fuel Audit Report', 14, 15);
    const tableColumn = ['Date', 'Plate', 'Driver', 'Station', 'Liters', 'Cost ($)', 'Risk'];
    const tableRows = reportData.map((r) => [
      new Date(r.fuelDate).toLocaleDateString(),
      r.vehicleId?.plateNumber || '',
      r.driverId?.fullName || '',
      r.fuelStationName || '',
      r.fuelQuantity,
      r.totalAmount,
      r.riskLevel,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
    });
    doc.save('FFFDMS_Fuel_Report.pdf');
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <FileBarChart className="w-6 h-6 text-amber-500" />
              <span>Audit & Fuel Reports</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">Export verified fleet fuel consumption records in standard formats</p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={exportCSV}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={exportExcel}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-bold transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={exportPDF}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-xl text-xs font-bold transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Report Preview Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Generating report preview...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/50 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Plate Number</th>
                    <th className="px-5 py-3.5">Driver</th>
                    <th className="px-5 py-3.5">Fuel Station</th>
                    <th className="px-5 py-3.5">Liters</th>
                    <th className="px-5 py-3.5">Total Amount</th>
                    <th className="px-5 py-3.5">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {reportData.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs">{new Date(r.fuelDate).toLocaleDateString()}</td>
                      <td className="px-5 py-4 font-mono font-bold text-amber-400">{r.vehicleId?.plateNumber}</td>
                      <td className="px-5 py-4">{r.driverId?.fullName}</td>
                      <td className="px-5 py-4 text-slate-400">{r.fuelStationName}</td>
                      <td className="px-5 py-4 font-mono">{r.fuelQuantity} L</td>
                      <td className="px-5 py-4 font-mono font-bold text-emerald-400">${r.totalAmount}</td>
                      <td className="px-5 py-4 font-bold text-xs">{r.riskLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}
