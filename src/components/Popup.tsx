"use client";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dialog";
import { Button } from "@/components/ui/button";

interface SelectOption {
  key: string;
  value: string;
  label: string;
}

interface Field<T> {
  key: keyof T;
  label: string;
  type?: "text" | "number" | "email" | "select";
  options?: string[] | SelectOption[];
  readOnly?: boolean;
}

interface EditablePopupProps<T extends object> {
  open: boolean;
  title: string;
  fields: Field<T>[];
  data: T;
  onClose: () => void;
  onSave?: (updated: T) => void;
  globalReadOnly?: boolean;
}

export function EditablePopup<T extends object>({
  open,
  title,
  fields,
  data,
  onClose,
  onSave,
  globalReadOnly = false,
}: EditablePopupProps<T>) {
  const [formData, setFormData] = React.useState<T>(data);

  React.useEffect(() => {
    setFormData(data);
  }, [data]);

  function handleChange<K extends keyof T>(key: K, value: T[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {fields.map((f) => {
            const isReadOnly = globalReadOnly || f.readOnly;
            return (
              <div key={String(f.key)} className="flex flex-col gap-1">
                <label className="text-sm font-medium">{f.label}</label>

                {isReadOnly ? (
                  <div className="px-2 py-1 text-sm border rounded bg-gray-50">
                    {String(formData[f.key] ?? "")}
                  </div>
                ) : f.type === "select" && f.options ? (
                  <select
                    value={(formData[f.key] as string) ?? ""}
                    onChange={(e) => handleChange(f.key, e.target.value as T[keyof T])}
                    className="border rounded px-2 py-1 text-sm"
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
                    className="border rounded px-2 py-1 text-sm"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {!globalReadOnly && onSave && (
            <Button onClick={() => onSave(formData)}>Save</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
