"use client";
import React, { useState } from "react";

interface Column<T> {
  key?: keyof T; // optional, để tránh undefined
  label: string;
  render?: (row: T) => React.ReactNode;
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

  return (
    <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
      <table className="min-w-full text-sm text-left border-collapse">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col, idx) => (
              <th key={col.key ? String(col.key) : `col-${idx}`} className="px-4 py-2 border-b">
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="px-4 py-2 border-b text-center w-[140px]">Action</th>
            )}
          </tr>
        </thead>

        <tbody>
          {visibleData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                className="text-center py-6 text-gray-500"
              >
                No data
              </td>
            </tr>
          ) : (
            visibleData.map((row, i) => (
              <tr key={rowKey ? String(row[rowKey]) : i} className="hover:bg-gray-50 transition">
                {columns.map((col, colIdx) => (
                  <td key={col.key ? String(col.key) : `col-${colIdx}`} className="px-4 py-2 border-b">
                    {col.render ? col.render(row) : col.key ? String(row[col.key]) : "—"}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-4 py-2 border-b text-center space-x-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs"
                      >
                        ✏️ Update
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 p-3">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Before
          </button>
          <span className="text-sm">
            Pages <b>{currentPage}</b> / {totalPages}
          </span>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
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
