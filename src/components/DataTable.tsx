"use client";
import React, { useState } from "react";

interface Column<T> {
  key?: keyof T; // optional, để tránh undefined
  label: string;
  render?: (row: T) => React.ReactNode;
  width?: string; // optional custom width (e.g., "w-[150px]", "max-w-[200px]")
}

interface DataTableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  rowsPerPage?: number;
}

export function DataTable<T extends object>({
  columns,
  data,
  onEdit,
  onDelete,
  rowsPerPage = 10,
  rowKey, // key prop để tr.unique
}: DataTableProps<T> & { rowKey?: keyof T }) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / rowsPerPage);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const visibleData = data.slice(startIndex, startIndex + rowsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Calculate fixed width for each column based on total columns
  const totalCols = columns.length + (onEdit || onDelete ? 1 : 0);
  const getColumnWidth = (index: number, total: number) => {
    // Action column gets fixed width
    if (onEdit || onDelete && index === columns.length) {
      return "w-[140px]";
    }
    // Distribute remaining width evenly among data columns
    if (total <= 4) return "min-w-[200px]";
    if (total <= 6) return "min-w-[150px]";
    return "min-w-[120px]";
  };

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm transition-colors">
      <table className="w-full text-sm border-collapse table-fixed">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={col.key ? String(col.key) : `col-${idx}`} 
                className={`px-4 py-2 border-b dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold text-left ${col.width || getColumnWidth(idx, totalCols)}`}
              >
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className={`px-4 py-2 border-b dark:border-gray-600 text-center text-gray-900 dark:text-gray-100 font-semibold ${getColumnWidth(columns.length, totalCols)}`}>Actions</th>
            )}
          </tr>
        </thead>

        <tbody>
          {visibleData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                className="text-center py-6 text-gray-500 dark:text-gray-400"
              >
                No data
              </td>
            </tr>
          ) : (
            visibleData.map((row, i) => (
              <tr key={rowKey ? String(row[rowKey]) : i} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                {columns.map((col, colIdx) => (
                  <td 
                    key={col.key ? String(col.key) : `col-${colIdx}`} 
                    className={`px-4 py-2 border-b dark:border-gray-700 text-gray-900 dark:text-gray-100 text-left align-top ${col.width || getColumnWidth(colIdx, totalCols)}`}
                  >
                    <div className="word-wrap break-word text-left">
                      {col.render ? col.render(row) : col.key ? String(row[col.key]) : "—"}
                    </div>
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className={`px-4 py-2 border-b dark:border-gray-700 text-center ${getColumnWidth(columns.length, totalCols)}`}>
                    <div className="flex items-center justify-center gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs whitespace-nowrap"
                        >
                          ✏️ Update
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs whitespace-nowrap"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 p-3 border-t dark:border-gray-700">
          <button
            className="px-3 py-1 border dark:border-gray-700 rounded disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Before
          </button>
          <span className="text-sm text-gray-900 dark:text-gray-100">
            Pages <b>{currentPage}</b> / {totalPages}
          </span>
          <button
            className="px-3 py-1 border dark:border-gray-700 rounded disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            After →
          </button>
        </div>
      )}
    </div>
  );
}
