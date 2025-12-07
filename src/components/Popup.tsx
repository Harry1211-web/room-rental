"use client";
import React, { ReactNode } from "react"; // Import ReactNode
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react"; // Import icon loading

interface SelectOption {
  key: string;
  value: string;
  label: string;
}

interface Field<T> {
  key: keyof T;
  label: string;
  type?: "text" | "number" | "email" | "select" | "textarea";
  options?: string[] | SelectOption[];
  readOnly?: boolean;
}

// Cập nhật interface để bao gồm các props tùy chỉnh
interface EditablePopupProps<T extends object> {
  open: boolean;
  title: string;
  fields: Field<T>[];
  data: T;
  onClose: () => void;
  // Thay đổi onSave để cho phép hai kiểu: (T) => void (cho Edit) hoặc () => Promise<void> (cho Delete)
  onSave?: (updated: T) => (void | Promise<void>) | (() => Promise<void>); 
  globalReadOnly?: boolean;
  
  // Props cho logic Delete
  isDeleteAction?: boolean; // Nếu là hành động xóa, sử dụng màu đỏ và logic onSave khác
  saveLabel?: string; // Tên tùy chỉnh cho nút Save (hoặc Delete)

  // Thêm children
  children?: ReactNode; 
}

// Cập nhật hàm component để destructure các props mới
export function EditablePopup<T extends object>({
  open,
  title,
  fields,
  data,
  onClose,
  onSave,
  globalReadOnly = false,
  isDeleteAction = false,
  saveLabel = "Save",
  children, // Nhận prop children
}: EditablePopupProps<T>) {
  const [formData, setFormData] = React.useState<T>(data);
  const [isSaving, setIsSaving] = React.useState(false); // State quản lý trạng thái lưu

  React.useEffect(() => {
    setFormData(data);
  }, [data]);

  function handleChange<K extends keyof T>(key: K, value: T[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }
  
  // Hàm xử lý việc lưu/xóa
  const handleAction = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
        if (isDeleteAction) {
            // Khi là Delete, onSave được truyền là () => Promise<void>
            const deleteAction = onSave as () => Promise<void>;
            await deleteAction();
        } else {
            // Khi là Save, onSave được truyền là (T) => void | Promise<void>
            const saveAction = onSave as (updated: T) => (void | Promise<void>);
            await saveAction(formData);
        }
    } catch (error) {
        console.error("Popup action failed:", error);
        // Toast error có thể được xử lý ở component cha
    } finally {
        setIsSaving(false);
    }
  }


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
            {/* Hiển thị children ở đây (dùng cho thông báo Delete) */}
            {children} 

            {/* Chỉ render fields nếu không phải là hành động Delete */}
            {!isDeleteAction && fields.map((f) => { 
            const isReadOnly = globalReadOnly || f.readOnly;
            return (
              <div key={String(f.key)} className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">{f.label}</label>

                {isReadOnly ? (
                  <div className="px-2 py-1 text-sm border dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    {String(formData[f.key] ?? "")}
                  </div>
                ) : f.type === "select" && f.options ? (
                  <select
                    value={(formData[f.key] as string) ?? ""}
                    onChange={(e) => handleChange(f.key, e.target.value as T[keyof T])}
                    className="border dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    {f.options.map((o) =>
                      typeof o === "string" ? (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ) : (
                        <option key={o.key} value={o.value}>
                          {o.label}
                        </option>
                      )
                    )}
                  </select>
                ) : (
                  <input
                    type={f.type ?? "text"}
                    value={(formData[f.key] as string | number) ?? ""}
                    onChange={(e) =>
                      handleChange(
                        f.key,
                        (f.type === "number"
                          ? Number(e.target.value)
                          : e.target.value) as T[keyof T]
                      )
                    }
                    className="border dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Close
          </Button>
          {!globalReadOnly && onSave && (
            <Button 
                    onClick={handleAction} 
                    disabled={isSaving}
                    variant={isDeleteAction ? "destructive" : "default"} // Dùng màu đỏ cho Delete
                >
                    {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        saveLabel // Sử dụng saveLabel tùy chỉnh
                    )}
                </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}