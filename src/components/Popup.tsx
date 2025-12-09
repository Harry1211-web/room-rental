"use client";
import React, { ReactNode } from "react"; // Import ReactNode
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";
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

// Update interface to include custom props
interface EditablePopupProps<T extends object> {
  open: boolean;
  title: string;
  fields: Field<T>[];
  data: T;
  onClose: () => void;
  // Change onSave to allow two types: (T) => void (for Edit) or () => Promise<void> (for Delete)
  onSave?: (updated: T) => (void | Promise<void>) | (() => Promise<void>);
  globalReadOnly?: boolean;

  // Props for delete logic
  isDeleteAction?: boolean; // If it is delete action, use red color and different onSave logic
  saveLabel?: string; // Custom name for Save (or Delete) button

  // Thêm children
  children?: ReactNode;
}

// Update function component to destructure new props
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

  // Function to handle save/delete
  const handleAction = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      if (isDeleteAction) {
        // When Delete, onSave is passed as () => Promise<void>
        const deleteAction = onSave as () => Promise<void>;
        await deleteAction();
      } else {
        // When Save, onSave is passed as (T) => void | Promise<void>
        const saveAction = onSave as (updated: T) => void | Promise<void>;
        await saveAction(formData);
      }
    } catch (error) {
      console.error("Popup action failed:", error);
      // Toast error can be handled in parent component
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Display children here (used for Delete notification) */}
          {children}

          {/* Chỉ render fields nếu không phải là hành động Delete */}
          {!isDeleteAction &&
            fields.map((f) => {
              const isReadOnly = globalReadOnly || f.readOnly;
              return (
                <div key={String(f.key)} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {f.label}
                  </label>

                  {isReadOnly ? (
                    <div className="px-2 py-1 text-sm border dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                      {String(formData[f.key] ?? "")}
                    </div>
                  ) : f.type === "select" && f.options ? (
                    <select
                      value={(formData[f.key] as string) ?? ""}
                      onChange={(e) =>
                        handleChange(f.key, e.target.value as T[keyof T])
                      }
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
              variant={isDeleteAction ? "destructive" : "default"} // Red for delete
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                saveLabel // Use saveLabel custom name
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
